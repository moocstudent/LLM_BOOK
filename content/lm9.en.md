## What quantization does

The mechanism fits in one line: **take a group of weights, scale them by their maximum absolute value into low-bit integers, and store one scale factor.**

Say a group of fp16 weights spans [-0.42, 0.38] and must fit in 4 bits (16 representable values): the scale factor is 0.42/7, each weight is divided by it and rounded to an integer between -8 and 7. At use time, multiply the scale back.

This is nearly free because **large-model weights carry substantial redundancy** — their information content is far below what 16-bit floats provide. It is not entirely free because a few outlier weights are unusually large, inflating the scale factor and degrading precision for everything else in the group.

## Grouping: precision against overhead

If one scale factor covers a whole matrix, a single outlier ruins precision everywhere. So practice uses **group-wise quantization**: one scale factor per 32/64/128 weights.

Smaller groups fit the local distribution better and raise accuracy; but scale factors must be stored too, so overhead rises. 128 is the common default; 64 does better where precision matters.

That is what the group-size knob in the experiment means — you can watch it move memory and perplexity at the same time.

@fig lm9-bits

## Post-training quantization vs quantization-aware training

**Post-training quantization (PTQ)**: compress an already-trained model directly. Fast (minutes to hours), needing no training data or only a few hundred calibration samples. This is what almost every situation should use.

**Quantization-aware training (QAT)**: simulate quantization error during training so the model learns to work at low precision. Better results, but requires retraining.

The practical middle ground today is calibrated PTQ: use a few hundred representative samples to measure activation distributions per layer, then optimise the choice of scale factors accordingly. Clear benefit at low cost. **The calibration data should come from your own real workload** — commonly overlooked, and sometimes worth half the degradation.

@fig lm9-ptq-qat

## Which tasks are quantization-sensitive

This is the chapter's most practical section. Under the same 4-bit quantization, degradation differs several-fold by task:

- **Chat and summarisation**: usually not measurable. These tasks admit many acceptable outputs, and a little noise does not change acceptability.
- **Classification and extraction**: mild degradation, usually acceptable.
- **Code generation**: clear degradation. One wrong token and it does not run — no tolerance.
- **Multi-step maths and reasoning**: the worst. Error compounds along the chain: a 2% per-step error rate becomes 18% after ten steps.
- **Precise retrieval in long context**: clear degradation and the hardest to self-detect. The model roughly remembers what the document said while citing the wrong number.

One more: **small models are more sensitive than large ones**, because they had little redundant capacity to give up. The same 4-bit is nearly lossless at 7B and visibly damaging at 1.5B.

## Distillation: the other road

If 4-bit is still not small enough, shaving more bits is usually the wrong direction (degradation climbs steeply below 3 bits). That is when to consider **distillation**: train a genuinely smaller model on the large model's outputs (or output distributions).

The key difference from quantization: quantization compresses the same model, leaving its capability ceiling intact; distillation trains a new model that can be strong on your target task and weak elsewhere. **So distillation suits well-scoped tasks — which is fine-tuning's home turf. In module five we will see that "large-model quality at small-model cost" is one of the three legitimate reasons to fine-tune.**

One last thing to remember: **quantization is a real model change, and you must rerun your own eval set afterwards.** Its damage concentrates exactly where the eye misses it: occasional arithmetic errors, instructions lost midway through long documents, cited numbers subtly off.

---

## Exercises

1. Compare the perplexity rise for 7B and 1.5B at 4 bits in the experiment. Use the difference to explain why "small model plus quantization", which looks so economical, often loses to "medium model, no quantization".
2. If you have a quantized model to hand, run 20 multi-step arithmetic problems against both it and the original and compare accuracy. That is the test class most likely to expose quantization loss.
3. Write a quantization acceptance checklist for your own workload: which three sample classes must pass, how much degradation is tolerable, and what your rollback plan is if it exceeds that.
