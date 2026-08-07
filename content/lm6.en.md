## Four curve shapes, four diseases

The loss curve is your only instrument panel during training. It can say four things.

**One: falling too slowly.** A gentle slope with loss still high after thousands of steps. The learning rate is too small. In fine-tuning this is the most misdiagnosed disease — training finishes, the model has barely changed, and the team concludes "not enough data, label ten thousand more". Raise the learning rate an order of magnitude first.

**Two: oscillating without converging.** The curve jitters up and down, descending overall but ragged. The learning rate is high. Sometimes it still yields a usable model, but the final loss is usually worse than a correctly tuned run.

**Three: a spike with no recovery.** Loss jumps several-fold and stays there, or becomes NaN. This is a numerical accident: an anomalous batch (a stretch of repeated-character junk, say) combined with too high a learning rate pushed the weights somewhere unrecoverable. **The correct response is not to keep training but to roll back to the last checkpoint.**

**Four: the two lines separate.** Training loss keeps falling while validation loss turns upward. Overfitting. The separation point is your early-stopping position.

Note the last one is only visible if you have a validation set. **Training without one is driving with your eyes closed** — training loss will descend all the way to zero, and that is precisely the model memorising the exam.

@fig lm6-shapes

## LR schedules: why warm up

Nearly all modern training uses one shape: linear ramp from zero to a peak (warmup), then cosine decay toward zero.

**Warmup addresses initial instability.** At the very start, adaptive optimizers like Adam have not accumulated reliable second-moment estimates, and a peak learning rate can easily take one large step somewhere terrible. Raising the rate over a few hundred to a few thousand steps lets the optimizer's statistics settle first.

**Decay addresses final precision.** A large learning rate approaches the basin quickly but cannot settle into it — it keeps bouncing around nearby. Decay shrinks the late-stage step size so the run can land lower. The cosine shape works well in practice, though linear decay is barely different; there is no magic here.

Concrete advice for fine-tuning: **use 3%–10% of total steps for warmup, no more.** Fine-tuning has few steps to begin with, and an overlong warmup means you never actually train at the peak rate.

@fig lm6-lr

## Gradient clipping and mixed precision

**Gradient clipping**: when the gradient norm exceeds a threshold, scale the whole gradient back to it. Nearly free, and it blocks most instances of disease three. Leave it on; 1.0 is a common threshold.

**Mixed precision**: keep activations and computation in bf16 or fp16 while holding a master copy of weights and the optimizer state in fp32. It nearly halves memory and bandwidth demand and is standard in modern training.

One interaction deserves attention: fp16 has a narrow dynamic range (max around 65504), so gradients easily overflow to inf, which is why fp16 training requires loss scaling. **bf16 has the same exponent width as fp32 and therefore barely overflows, which is why bf16 is now the default** — trading mantissa precision for stability.

## The validation set is the only thing that tells you to stop

This deserves its own section, because it is the step most often skipped in fine-tuning and the one with the largest consequences.

A usable validation set needs three properties:

1. **Strictly disjoint from the training set** — and disjoint after deduplication (two phrasings of the same example count as overlap).
2. **Drawn from the real usage distribution.** If your training data came from historical tickets, the validation set should be tickets too, not questions you invented.
3. **Large enough.** A 4% difference on 50 items is noise, as we will work out with confidence intervals in module eight.

Beyond that, fine-tuning needs a second artefact: **a general evaluation set unrelated to your task.** Its job is detecting catastrophic forgetting — your task validation set comes from the same distribution, so it cannot see that the model got worse at everything else. We will step on that landmine by hand in the next module's hyperparameter experiment.

---

## Exercises

1. Produce all four curve shapes in the experiment, recording the parameters for each. The point is to be able to infer parameters from a curve later, rather than only the reverse.
2. Turn off gradient clipping, set the learning rate to maximum, and repeat until you see spikes. Then re-enable clipping and retry. Use what you observed to explain why clipping does not solve the underlying problem of too high a learning rate, yet should still be on by default.
3. Write the validation-set spec for a task of your own: how many items, from where, how you will guarantee no overlap with training, and what general evaluation set you will prepare separately to detect forgetting.
