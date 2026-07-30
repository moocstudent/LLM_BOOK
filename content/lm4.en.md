## One line of objective

The pretraining objective is disappointingly simple:

```
L = -Σ log P(x_t | x_1 ... x_{t-1})
```

Given everything before it, predict the next token; minimise cross-entropy. That is the whole objective — there is no second one.

**Every capability the model has — grammar, world knowledge, translation, the seeds of reasoning, writing code — is a by-product of that one target.** It is worth pausing on: to predict the next word better, a sufficiently large model is compelled to learn subject–verb agreement, compelled to remember that Paris is the capital of France, compelled to internalise code syntax, because each of those is an effective path to lower loss.

This also settles a common misreading. People say "it is only predicting the next word, so it does not understand". The premise is right and the conclusion does not follow: a simple objective does not imply simple representations were learned to achieve it.

## The pipeline is mostly throwing things away

From raw web pages to trainable data there are five stages:

**One: crawl.** Public web snapshots (Common Crawl and similar) are the starting point, on the order of tens to hundreds of terabytes of compressed text.

**Two: text extraction.** Strip navigation, ads, footers and cookie notices out of the HTML. More than half is gone at this step alone — visible in the drop from the first bar to the second in the experiment above.

**Three: deduplication.** Both document-level (whole duplicates) and substring-level (repeated paragraphs). The return here is routinely underestimated: duplicated content does not merely waste compute, it gets memorised verbatim, polluting generation (the model starts reciting its corpus) and creating privacy and copyright exposure. **In many ablations, stronger dedup beats adding a fresh corpus of equal size.**

**Four: quality filtering.** Rules (length, punctuation ratio, repetition rate, blocklists) plus a lightweight classifier, removing machine-generated spam, SEO farms and mojibake. One trap here: quality classifiers usually define "good" as "resembling Wikipedia", so over-filtering strips out speech, dialects, smaller languages and long-tail professional domains, leaving a model that is bookish and brittle.

**Five: mixing.** Decide the shares of web text, code, maths, books and other languages.

## Why code and maths punch above their weight

A repeatedly verified phenomenon: **adding code and mathematics to the training data improves structured reasoning on tasks that involve neither.**

The intuitive account is that code and mathematical proofs are the most rigorously structured text humans produce: each step must follow strictly from the last, with no room for vagueness. The pattern the model learns from them — one step at a time, state must stay consistent — transfers to multi-step reasoning in natural language.

But it is not free. The shares sum to 100%, so 25% code means 75% natural language. That is what the warning in the experiment means: code and maths buy reasoning, paid for in the share left for ordinary conversation and common sense. **The mixture is a trade, not an addition.**

## Contamination: the technical reason leaderboards inflate

If benchmark items appear in the training data, the model has seen the answers. This is data contamination, and the score inflation it causes is pervasive across the industry.

It arrives two ways, neither fully avoidable:

- **Direct contamination**: the benchmark itself is published online and gets crawled. The countermeasure is n-gram matching against the training data to remove it (decontamination), but rephrased items slip through.
- **Indirect contamination**: variants, discussions and worked solutions are scattered across forums and blogs. This one is nearly impossible to remove.

The practical implication is immediate: **public leaderboard scores cannot serve as your acceptance criteria.** You need your own never-published eval set, which is exactly what module eight is about. When two models differ by three points on a public benchmark, you cannot tell whether that is capability or contamination.

---

## Exercises

1. In the experiment, set dedup strength to zero and then to maximum, recording trainable tokens and quality index each time. Then answer: if you could turn only one knob to improve model quality, which would it be?
2. Find the technical report of an open model you know and locate its data mixture table. What share is code? Maths? Other languages? Compare it against another model and try to explain the difference in character you have felt in actual use from the difference in mixture.
3. Design a contamination test: if you suspect a model is contaminated on a particular benchmark, what evidence could you gather without access to the training data? (Hint: consider rephrasing items in ways that preserve the answer.)
