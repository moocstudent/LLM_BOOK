## One operation holds up the whole architecture

The genuinely new thing in the Transformer is a single operation: **self-attention**. What it does fits in one sentence — it lets every position in the sequence take one weighted average over every position.

Concretely, three steps:

1. Each token's vector is multiplied by three matrices to produce a query **Q**, a key **K** and a value **V**. Read them as: Q is "what am I looking for", K is "what can I offer", V is "the information I actually carry".
2. Dot Q against every K to get relevance scores, divide by √d, and pass them through softmax to get weights summing to one.
3. Take the weighted sum of all the V vectors — that is this position's output.

As a formula: `Attention(Q,K,V) = softmax(QKᵀ/√d)·V`. The heat map in the experiment above is one row of the `softmax(QKᵀ/√d)` matrix.

**Why is this so useful?** Because it is the only operation that lets two distant tokens interact directly, at a cost independent of their distance. Before it, recurrent networks had to pass information along step by step, and twenty words was enough to wash it out. Under attention, token 1 is exactly as close to token 100 as token 99 is.

## The √d is not decoration

That scaling factor exists for a very specific numerical reason. The dot product of two d-dimensional vectors whose entries are zero-mean, unit-variance random numbers has variance d, hence standard deviation √d. So the larger d is, the larger the dot products get in absolute terms.

And softmax has a property: the larger its inputs in absolute value, the closer its output gets to one-hot. At d=4096, unscaled dot products easily reach the tens, and after softmax nearly all the probability concentrates on one position — **the gradient at every other position goes to zero and learning stalls**.

Dividing by √d pulls the variance back to one, keeping softmax in the range where it is sensitive. Turn off "divide by √d" in the experiment and push d to 1024 to watch the peak weight climb past 99%.

Incidentally, this move — dividing by a number to control how sharp a distribution is — reappears in the decoding chapter, where it is called **temperature**. They are the same mathematical action.

## Multi-head: several relations at once

One attention operation can only compute one notion of relevance. But language carries many at once: subject–verb agreement, coreference, semantic similarity, positional adjacency.

Multi-head attention handles this directly: split the d dimensions into h shares (4096 into 32 heads of 128, say), run attention independently in each, then concatenate and pass through one more linear layer. **The point is that each head has its own Q/K/V projections, so each learns a different attention pattern.**

Researchers do observe division of labour in trained models: some heads work almost exclusively on coreference, some watch adjacent positions, some connect syntactically dependent words. Most heads, of course, resist any clean explanation — that is everyday life in interpretability research.

## A complete block

Attention is only half of a layer. A standard Transformer block looks like this:

```
x = x + Attention(LayerNorm(x))     # attention sub-layer + residual
x = x + FFN(LayerNorm(x))           # feed-forward sub-layer + residual
```

Three components, three jobs:

- **Residual connections** (those two `x +`) let gradients pass straight across layers, which is what makes 80 layers possible at all.
- **LayerNorm** re-standardises the activations at each position so values do not drift with depth. Modern models generally place it before the sub-layer (pre-norm) because that is more stable.
- **The feed-forward network (FFN)** is a two-layer network that expands (usually 4×) and contracts. It holds roughly two-thirds of the model's parameters, and its job complements attention: attention moves information between positions, the FFN transforms it within a position. There is substantial evidence that **the model's "knowledge" lives mostly in the FFN**, which is why the LoRA chapter's decision about whether to adapt the MLP matters as much as it does.

Stack that block N times, add an embedding layer in front and a linear projection to the vocabulary at the end, and you have a complete language model. Everything remaining is engineering detail and scale.

---

## Exercises

1. Take a toy example with three tokens and d=4, write out Q, K and V as 3×4 matrices by hand, and carry the attention weights all the way through. Doing this once by hand makes every attention variant you meet later (multi-query, sliding window, linear attention) far quicker to read.
2. In the experiment, push d to its maximum with scaling off and record the peak weight and entropy; then turn scaling on and record both again. Use those two pairs of numbers to explain to someone else why the √d cannot be dropped.
3. Estimate: for a sequence of length n, how many entries does the attention matrix have, and how does that grow with n? That growth is the root reason long context is expensive — and the setup for the KV cache chapter.
