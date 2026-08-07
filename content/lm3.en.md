## A power law, not a miracle

The single most important empirical regularity about large models is that **loss falls as a power law in scale**. Multiply parameters, data or compute by ten and loss drops by a fixed amount; multiply by ten again and it drops by the same amount again. On log-log axes it is a straight line.

That line held across several orders of magnitude without breaking, and that — not a belief in miracles — is why "keep scaling" could be treated as a reliable engineering decision for several years. The curve extrapolates.

The fitted form is usually written:

```
L(N, D) = E + A/N^α + B/D^β
```

Three terms: an irreducible loss E (the entropy of language itself, which no model size reaches zero on), a term for insufficient parameters, and a term for insufficient data. Both α and β land near 0.3 — **which means returns diminish fast: a tenfold increase in parameters cuts the second term only to 46% of its value.**

@fig lm3-powerlaw

## 6ND: the arithmetic of compute

Estimating training compute has an approximation that is almost unreasonably useful:

```
total FLOPs ≈ 6 × parameters × training tokens
```

The 6 comes from this: in the forward pass each parameter takes part in one multiply and one add, so 2 FLOPs; the backward pass computes two sets of gradients (with respect to activations and to weights), roughly twice the forward, so 4. Total 6.

The value of the formula is not precision but **its ability to stop you before you launch a doomed experiment**. Example: a 7B model on 2T tokens is 6 × 7e9 × 2e12 ≈ 8.4e22 FLOPs. One H100 realistically sustains about 400 TFLOP/s in bf16 at 40% utilisation, so 8.4e22 / (400e12 × 0.4) ≈ 5.8e8 GPU-seconds, or about 160,000 GPU-hours. On 64 cards that is 105 days.

Now you know why nobody pretrains their own model from scratch.

## Chinchilla: which side to spend on

With 6ND in hand a natural question appears: given a fixed compute budget C, do you spend it on more parameters or more data?

Because C ≈ 6ND is a constraint, N and D have only one degree of freedom between them. Substituting that constraint into the loss formula and minimising gives the well-known result: **the optimum is roughly 20 training tokens per parameter.**

That was distinctly counter-intuitive when published in 2022, because prevailing models were parameter-rich and data-poor — by this criterion they should have spent the same compute on a model half the size with twice the data, and done better.

You can see the resulting U in the experiment above: at fixed compute, both too small a model (data glut) and too large a model (data starvation) worsen the loss, with an optimum in between.

@fig lm3-chinchilla

## Yet everyone deliberately departs from it today

Open the technical report of any current open small model and you will see far more than 20 tokens per parameter — often 100× or more. Does that mean Chinchilla was wrong?

No. **Chinchilla answers "how do I reach a given loss with the least training compute", while reality asks "how do I serve a billion requests at the least total cost".** Those are different objectives.

Inference cost is proportional to parameter count and is paid forever; training cost is paid once. So if a model will be deployed at volume, spending extra training compute to obtain a smaller inference model is entirely correct economics — even though the training itself is "wasteful". That is why over-training became standard practice.

## On "emergent abilities"

You will often hear that certain abilities "emerge suddenly" once a model crosses a size threshold. That claim needs calibration.

Scale genuinely brings capability, but a large share of those cliff-shaped curves comes from **discontinuity in the metric itself**. If your metric is "did it get the whole multi-step arithmetic problem right", then as per-step accuracy rises from 20% to 80% the whole-problem accuracy leaps from near zero — because the metric is a product of several probabilities. Swap in a continuous metric (per-digit log-likelihood, say) and the same underlying curve becomes a smooth climb.

This does not mean scale is unimportant. It means **"emergence" is largely a measurement phenomenon rather than a physical phase transition.** The distinction matters in practice because it determines whether small-scale experiments can predict large-scale outcomes — if the underlying curve is smooth, they can; if there were true phase transitions, they could not.

---

## Exercises

1. Use 6ND to estimate the pretraining compute of an open model you know well (parameter count and token count are usually in the technical report). Convert it to money at $2.50 per H100-hour and 40% utilisation. That number is worth remembering.
2. In the experiment, fix a compute budget and find the N that minimises loss. Then halve N and see how much loss rises. That difference tells you the real cost of picking the wrong model size — usually smaller than people expect, which is itself a useful finding.
3. Suppose you will serve a model 10 million calls a day for two years. Using the rough assumption that inference cost is proportional to parameter count, argue why you should choose a model smaller than the Chinchilla optimum and train it for longer.
