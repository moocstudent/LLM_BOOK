## Why cache at all

Autoregressive generation contains an obvious waste: when generating token 100, the K and V for the first 99 positions are identical to what was computed a step earlier. Recomputing them is pure waste.

Hence the **KV cache**: store K and V for every layer and position, so a new token computes only its own Q, K and V and then attends its Q against every cached K.

This drops the cost of generating one token from O(n²) to O(n); without it, long-text generation would be infeasible. The price is memory, and that price is often startlingly large.

## The KV cache memory formula

```
bytes per token per layer = 2 × kv_heads × head_dim × bytes_per_value
total KV bytes            = the above × layers × sequence length × batch
```

For a 7B model (32 layers, 8 KV heads, head_dim 128, fp16):

- per token: 2 × 8 × 128 × 2 × 32 = 131 KB
- at 8K context, batch 16: 131 KB × 8192 × 16 ≈ **17 GB**

The weights themselves are only 14 GB. **The KV cache is larger than the model.**

That explains two things you will hit in practice: first, "supports 128K context" and "serves 100 concurrent users" usually cannot both be true; second, **a small model with long context blows up memory just as readily** — the KV cache depends chiefly on layer count and context length, not directly on parameter count.

Incidentally, that `kv_heads` term reflects an important modern optimisation: early models had as many KV heads as query heads (32, say), until it turned out that letting several query heads share one set of KV (grouped-query attention, GQA) shrinks the cache several-fold at almost no quality cost. It is an architectural decision made purely for inference economics.

## Prefill and decode are two entirely different workloads

A request has two phases with completely different bottlenecks.

**Prefill**: process the whole input prompt. All positions compute in parallel as one large matrix multiplication — **compute-bound**. It determines time-to-first-token and scales roughly with input length.

**Decode**: generate output tokens one at a time. Each step computes a single position, the matrix multiplication degenerates into a matrix-vector product, and every step reads the entire set of weights out of memory — **bandwidth-bound**.

That distinction has an important corollary: **during decode the compute units sit nearly idle.** The chip waits for weights to arrive from memory. So if you can process several requests at once, one pass over the weights serves the whole batch: throughput rises nearly linearly while latency barely moves.

**That is the entire principle behind batching**, and why continuous batching — requests joining and leaving without waiting for a batch boundary — became standard in modern inference servers.

## How to answer the customer's question

The question platform engineers get most often is: "we need N concurrent users at context M — how many GPUs?"

You can now finish it on paper:

1. weight bytes = parameters × bytes per value
2. KV bytes = the formula above with batch = N
3. add roughly 10%–20% runtime overhead
4. divide by per-GPU memory and round up

Run it backwards — solve for the maximum batch at a fixed GPU count — and you have the concurrency you can promise. That is exactly what "max batch" computes in the experiment above.

If the number falls short, four knobs in order of return: **quantize the KV cache to 8 bits (an immediate halving), shorten the context, quantize the weights, add GPUs.** Note the first three each cost quality, and that cost must be measured on your own eval set rather than guessed.

---

## Exercises

1. Use the experiment to compute how many concurrent requests one 80 GB card can serve for a 7B model at 4K, 32K and 128K context. Write down the three numbers — the gaps between them are much larger than most people's intuition.
2. Change KV precision from 16 to 8 bits and watch max batch move. Then consider which task types might pay for that in quality. (Hint: precise retrieval deep inside a long context.)
3. Estimate the GPU count needed for a real scenario of your own. Then halve the context length and estimate again. This exercise usually prompts a fresh conversation with product about whether the context really needs to be that long.
