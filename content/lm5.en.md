## From FLOPs to an invoice

What a training run costs is a four-step conversion, each step doable on paper:

```
1. total compute   C = 6 · N · D                    (FLOPs)
2. effective rate  T = peak FLOPs × MFU             (FLOP/s)
3. GPU-hours       H = C / T / 3600
4. cost            $ = H × price    wall days = H / GPUs / 24
```

Step 2's MFU (Model FLOPs Utilization) is the only term requiring experience. It is the share of nominal peak compute you actually use, and **35%–50% is normal at scale**. If a marketing sheet claims 70%, check whether the denominator is a sparse-compute peak.

Another common trap is which peak you use. The largest number on a GPU spec sheet is usually sparse fp8 or int8, while training runs in bf16 at roughly half that or less. The experiment above has already done that division for you.

@fig lm5-flops

## Where the MFU goes

The missing 60% did not vanish; it went into three things.

**Communication.** Data parallelism synchronises gradients across all devices after every step (an all-reduce), and that traffic is proportional to parameter count. More devices and slower interconnect make this term larger. It is also why adding GPUs shows diminishing returns: past some point the extra cards are mostly waiting on the network.

**Memory movement.** GPU compute has grown far faster than memory bandwidth, so many operators in modern training are bandwidth-bound rather than compute-bound — the chip waits for data. Fused kernels (folding attention's several steps into one) exist mainly to address this.

**Pipeline bubbles.** Pipeline parallelism splits the model's layers across devices, so the first device finishes its segment and then waits for the last one to finish the batch before starting the next. That idle stretch is the bubble. Smaller micro-batches shrink it at the cost of more communication.

## Three parallelisms, three things saved

When one device cannot hold the model, there are three ways to cut, usually combined.

**Data parallelism**: a full copy per device, each processing different data, gradients synchronised. Simplest, but requires one device to hold the whole model plus optimizer state. ZeRO/FSDP-style techniques shard the optimizer state and parameters too, greatly relaxing that.

**Tensor parallelism**: split individual matrix multiplications — a 4096×11008 weight sliced column-wise across 8 devices, say. It saves memory within a layer, at the cost of **communication in every layer** — which is why tensor parallelism is used almost exclusively within one machine's high-speed interconnect.

**Pipeline parallelism**: place different layers on different devices. Minimal communication (only activations at layer boundaries) but bubbles, and the highest implementation complexity.

Practical guidance: **start with data parallelism (with ZeRO/FSDP), add tensor parallelism within a machine when it does not fit, and only consider pipeline parallelism across machines.** Most fine-tuning needs only the first.

@fig lm5-parallel

## What the estimate is really for

Note that the value of all this arithmetic is not precise prediction — your real numbers may be 30% off. Its value is **interception**.

Specifically, it answers three kinds of question:

- "Could we pretrain our own?" One calculation tells you whether the discussion should continue.
- "How long will this run take?" If the answer exceeds 60 days you almost certainly will not finish — hardware fails, data problems surface, goals change.
- "Will twice the GPUs halve the time?" No, because MFU drops. Think through the communication overhead first.

The same arithmetic applies to fine-tuning, just with much smaller numbers: 1,000 examples averaging 800 tokens over 3 epochs is 2.4M tokens; LoRA on a 7B model is roughly 6 × 7e9 × 2.4e6 ≈ 1e17 FLOPs, under an hour on a single consumer card. **That contrast is this module's most important conclusion: pretraining is an industrial undertaking, fine-tuning is an afternoon.**

---

## Exercises

1. Use the experiment to compute how many days and dollars your own GPU (or one you can rent) needs to train a 1.5B model on 300B tokens. Then change the parameter count to 7B and watch the time move — note whether it is linear or superlinear.
2. Find the technical report of an open model you know and look up its reported MFU. If it is not reported, derive it from the published GPU count, days and token count. Is the derived number plausible?
3. Estimate the cost of a typical fine-tune: 10,000 examples averaging 1,200 tokens, 2 epochs, 7B with LoRA. Compare that number to the labour cost of the last feature you wrote by hand.
