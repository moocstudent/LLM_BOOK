## The model sees ids, not characters

Before any text reaches the model it is split into tokens and mapped to integers. **That string of integers is the model's entire world.** It has never seen a letter and does not know which characters make up "strawberry" — what it sees might be three opaque numbers like `[496, 675, 15717]`.

That single fact explains a whole family of odd behaviours, which we will match up one by one below.

## Why neither characters nor words

Two obvious schemes both fail:

**Split by character.** The vocabulary is tiny (a few thousand) and there are no unknown words. But sequences become very long — four or five times the token count of word splitting for the same sentence, and attention costs grow quadratically in length. Worse, the model must spend a meaningful share of its capacity learning how characters compose into words, something we did not need it to learn.

**Split by word.** Sequences are short and the units are semantically clean. But the vocabulary explodes (inflections, proper nouns and misspellings blow past several hundred thousand), and you will always meet an unseen word — an out-of-vocabulary product name collapses to `<UNK>` and its information is gone.

**Subword splitting** is the compromise between the two, and what every mainstream model does today: common words are one token, rare words break into meaningful fragments, any string is representable, and the vocabulary stays between tens of thousands and a couple hundred thousand.

## How BPE builds the vocabulary

Byte-pair encoding trains by a procedure simple enough to do on paper:

1. Start with a vocabulary of all single bytes (or characters).
2. Count the frequency of every adjacent symbol pair in the corpus, merge the most frequent pair into a new symbol, and add it to the vocabulary.
3. Repeat step 2 until the vocabulary reaches its target size.

For example: if `l` and `o` are frequently adjacent, `lo` gets merged; later, if `lo` and `w` are frequently adjacent, `low` becomes a token. **So the tokens in the vocabulary are not linguistic units but statistically frequent fragments.** This is also why the same word can split differently depending on context, and why `" the"` with a leading space is usually a different token from `"the"` without one.

## Four real consequences

**One: it cannot count letters.** The famous failure to count the r's in "strawberry" is not stupidity but the absence of letters in what the model receives. The same explains weakness at reversing strings, counting characters and solving word puzzles.

**Two: arithmetic on long numbers is unreliable.** Long numbers split into groups of a few digits, so `1284736` may become `128|473|6`. The model must then learn carrying on a fragmented representation — it gets some of the way, but nowhere near a human with a pencil. This is why handing it a calculator (tool use) almost always beats asking it to compute.

**Three: languages differ several-fold in cost.** The vocabulary is built from corpus statistics, and mainstream corpora are English-heavy. So for equal information, Chinese, Japanese and Thai often need one to two times more tokens than English, and Arabic and smaller languages fare worse. That multiplies straight into your API bill — switch samples in the experiment above to see the gap.

**Four: code shreds.** Indentation, underscores, camel case and nested brackets all generate tokens. A 200-line file easily consumes several thousand.

## Embeddings: from id to vector

The token id carries no meaning of its own (500 and 501 are unrelated). Meaning comes from the **embedding matrix**: a lookup table of shape `vocab × hidden`, one row per token id.

That matrix is large. At a 128K vocabulary and hidden size 4096 it holds 520 million parameters — over 7% of a 7B model — and the output layer usually needs another of the same size (some models tie the two).

That is the real vocabulary trade-off: **a larger vocabulary means fewer tokens for the same text (cheaper inference) but fatter embedding and output layers (consuming model capacity and making each step's softmax more expensive).** Modern vocabularies run from 32K to 256K, and enlarging one to better serve multiple languages is a recurring engineering decision.

---

## Exercises

1. Measure three passages in the experiment above: something you wrote in your own language, an equivalent English translation, and real code from your project. Record the chars-per-token ratio for each. Those three numbers will appear in every cost estimate you ever make.
2. Open the tokenizer for the model you actually use (most have an online visualiser) and feed it the proper nouns that appear most often in your project. How many pieces does each become? If more than three, consider a more common phrasing in the prompt, or make it frequent in your fine-tuning data.
3. Estimate: if your product handles 50,000 requests a day at 1,200 input tokens each, how much would switching user input from your language to English save? Then work out why that "optimisation" is usually the wrong thing to do.
