## The model emits a distribution, not a word

At every step the model outputs a set of scores (logits) over the entire vocabulary, which softmax turns into a probability distribution. **Which word gets said is the decoder's decision, not the model's.**

That distinction matters enormously, because it means the same weights under different decoding parameters can behave like two different models. And many problems reported as "the model hallucinates" or "the model is unstable" originate in these few parameters.

## Temperature: one division

Temperature does exactly one thing: divide the logits by T, then softmax.

- **T < 1**: sharpens. High-scoring candidates get amplified further, low ones suppressed. T → 0 is equivalent to greedy decoding (always take the maximum).
- **T = 1**: the raw distribution.
- **T > 1**: flattens. Low-probability candidates gain more chance, output gets more diverse and more error-prone.

Note this is the same mathematical action as the √d in chapter one: divide by a number to control how sharp softmax is. Understand one and you understand the other.

Practical defaults:

| Task | Temperature | Why |
|---|---|---|
| Extraction, classification, structured output | 0–0.2 | you want reproduction, not creation |
| Translation, rewriting, summarisation | 0.3–0.6 | some phrasing freedom helps |
| Creative writing, brainstorming | 0.8–1.1 | diversity is the point |
| Code | 0–0.3 | one wrong character and it does not run |

@fig lm7-temp

## The truncation family: top-k and top-p

Temperature changes the shape; truncation changes the candidate set.

**top-k**: keep the k highest-probability candidates and renormalise. Simple, but insensitive to distribution shape — when the model is very certain (first place at 99%), k=50 leaves 49 pieces of junk in the pool; when it is very uncertain (the top 200 all similar), k=50 cuts off reasonable options.

**top-p (nucleus)**: accumulate probability from the top down until the total exceeds p, and keep those candidates. **Its cleverness is exactly that adaptivity: few kept when the distribution is sharp, many when it is flat.** Hence its status as the mainstream default.

The two can be combined (top-k then top-p), which is how the experiment above computes it. Drag top-p to 0.5 and watch the pool shrink.

One more often-forgotten parameter: **repetition penalty**. It lowers the score of tokens already emitted, suppressing the degenerate loop where the model recites the same sentence. But it is a blunt instrument — it equally penalises words that legitimately should repeat (variable names in code, proper nouns), so it should be off or very small for code and structured output.

@fig lm7-topk

## Genuinely deterministic output

Many people assume temperature 0 means deterministic output. Broadly yes, with two catches.

**One: floating-point addition is not associative.** On a GPU, different batch sizes change reduction order, and a tiny numerical difference can flip the ordering of two nearly equal candidates. So the same prompt occasionally yields different results under different concurrency — not a bug, but numerical reality.

**Two: the server may not obey you.** Many inference services carry their own defaults or apply speculative decoding and quantization, so your temperature=0 does not necessarily map to greedy.

To reproduce, then: **fix the temperature, fix the seed, fix the batching configuration, and record all of it in your evaluation log.** Otherwise what you compare between two evaluations may be sampling noise alone — something module eight will quantify with confidence intervals.

---

## Exercises

1. In the experiment, sweep temperature from 0.05 to 2 and record three numbers: peak probability, entropy, and wrong-answer mass. Find the temperature at which the wrong answer first acquires appreciable probability, and remember it.
2. Take a prompt you actually use, run it five times at temperature 0 and five times at 1, and read the ten outputs side by side. Then decide which setting your case genuinely needs.
3. Check the decoding parameters of your production service. Has anyone left the temperature at a framework default (often 0.7 or 1.0)? If this is an extraction or classification service, you just found a free accuracy improvement.
