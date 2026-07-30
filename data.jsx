/* =========================================================
   Curriculum data — 8 modules / 24 chapters
   ---------------------------------------------------------
   Metadata only (bilingual). The teaching content ("解释")
   for each chapter lives in content/<id>.<lang>.md and is
   fetched on demand by the chapter page. `viz` names an
   interactive experiment ("训练场实验") from viz.jsx / viz2.jsx.
   `props` lists the key concepts the chapter leans on.
   ========================================================= */

const MODULES = [
  {
    id: "l1", code: "FM", accent: "primary", level: 1,
    zh: "模型基础", en: "Model Foundations",
    tagline: { zh: "在谈微调之前,先搞清你到底要调的是什么。", en: "Before fine-tuning anything, get clear on what you are tuning." },
    description: {
      zh: "大模型不是魔法,是一个把「下一个 token 的概率分布」算得极准的函数。要理解为什么微调有效、为什么它有时无效,你必须先看清三件事:注意力如何让每个位置去别的位置取信息、分词如何决定模型眼里的世界长什么样、以及参数量、数据量与算力之间那条被反复验证的缩放定律。本模块把这三件事拆成可以亲手拖动的实验。",
      en: "A large model is not magic; it is a function that predicts the next token's distribution extremely well. To understand why fine-tuning works — and when it cannot — you must first see three things clearly: how attention lets each position fetch information from every other, how tokenization decides what the world looks like to the model, and the repeatedly verified scaling law binding parameters, data and compute. This module turns all three into experiments you can drag.",
    },
  },
  {
    id: "l2", code: "PT", accent: "primary", level: 2,
    zh: "预训练与算力", en: "Pretraining & Compute",
    tagline: { zh: "你不会从零预训练一个模型,但你必须知道它花了什么代价。", en: "You will not pretrain from scratch — but you must know what it cost." },
    description: {
      zh: "预训练是整个能力的来源:模型的知识、语法、推理雏形都在这一步被压进权重里。绝大多数人不会亲手跑预训练,但不理解它会导致两类致命误判——以为微调能补上模型根本没学过的知识,以及严重低估自己那点数据的分量。本模块讲清预训练的目标函数、数据流水线里去重与配比的真实影响、算力预算的四则运算(参数 × token × 6),以及为什么训练曲线会突然炸掉。",
      en: "Pretraining is where capability comes from: knowledge, grammar and the seeds of reasoning are all compressed into the weights at this stage. Most people will never run one, yet not understanding it produces two fatal misjudgements — believing fine-tuning can install knowledge the model never saw, and badly overestimating the weight of your own small dataset. This module covers the pretraining objective, what deduplication and data mixing really do, the arithmetic of a compute budget (params × tokens × 6), and why loss curves suddenly explode.",
    },
  },
  {
    id: "l3", code: "IN", accent: "accent", level: 2,
    zh: "推理与部署基础", en: "Inference Foundations",
    tagline: { zh: "同一份权重,解码参数和量化方式能让它变成两个不同的模型。", en: "The same weights, decoded or quantized differently, behave like two different models." },
    description: {
      zh: "很多被当成「模型不行」的问题,其实是推理配置不行:温度设成 1.0 去做信息抽取、top-p 留着默认值去写代码、batch 开太大把显存挤爆、量化到 4 bit 之后没做任何评估。本模块把推理侧拆成三层:解码策略如何塑造输出分布、KV 缓存与批处理如何决定吞吐和显存、以及量化与蒸馏在质量与成本之间划出的那条曲线——这也是你微调后必须重新走一遍的路。",
      en: "Many problems blamed on 'the model' are really inference configuration: temperature at 1.0 for extraction, top-p left at its default for code, a batch size that blows the memory, a 4-bit quantization nobody evaluated. This module splits inference into three layers: how decoding shapes the output distribution, how the KV cache and batching set throughput and memory, and the quality-versus-cost curve drawn by quantization and distillation — the same road you must walk again after every fine-tune.",
    },
  },
  {
    id: "l4", code: "PR", accent: "accent", level: 2,
    zh: "提示与上下文", en: "Prompting & Context",
    tagline: { zh: "能用提示词解决的问题,不要用一次训练去解决。", en: "Never spend a training run on a problem a prompt can solve." },
    description: {
      zh: "微调是最贵的那把锤子,而它前面还有两级更便宜的台阶:把要求写清楚(提示与结构化输出),以及把知识送到模型眼前(检索增强)。跳过这两级直接开训,是新手最常见也最昂贵的错误——因为你会用几天时间和几百块算力,去解决一个改十行提示词就能解决的问题。本模块教你把需求正确定位到这三级台阶上,并给出一个可算的判据。",
      en: "Fine-tuning is the most expensive hammer, and two cheaper rungs sit below it: stating the requirement precisely (prompting and structured output), and putting the knowledge in front of the model (retrieval). Skipping both and going straight to training is the commonest and costliest beginner mistake — you spend days and real money solving what ten lines of prompt would have fixed. This module teaches you to place a requirement on the right rung, with a criterion you can actually compute.",
    },
  },
  {
    id: "l5", code: "FT", accent: "accent", level: 3,
    zh: "微调基础", en: "Fine-tuning Foundations",
    tagline: { zh: "微调改的是模型的行为方式,不是它的知识库。", en: "Fine-tuning changes how the model behaves, not what it knows." },
    description: {
      zh: "这是本站的核心模块。微调的正确心智模型是:你在教模型「以什么方式回答」,而不是往它脑子里灌事实——想灌事实,检索便宜一万倍。本模块先给出一套可判定的决策标准(什么问题该微调、什么问题微调也救不了),再讲最决定成败的一步:SFT 数据集的构建——为什么 1000 条精心挑选的样本常常打败 10 万条爬来的样本;最后把学习率、epoch 数、批大小对训练动态的影响做成可拖动的曲线,让你亲眼看到过拟合与灾难性遗忘长什么样。",
      en: "This is the core module. The right mental model for fine-tuning is that you are teaching the model how to answer, not loading facts into it — for facts, retrieval is ten thousand times cheaper. This module first gives a decidable criterion (which problems deserve a fine-tune, which ones it cannot save), then covers the step that decides everything: building the SFT dataset — why 1,000 carefully chosen examples routinely beat 100,000 scraped ones. It ends with learning rate, epochs and batch size rendered as draggable curves so you can watch overfitting and catastrophic forgetting happen.",
    },
  },
  {
    id: "l6", code: "PE", accent: "accent", level: 3,
    zh: "参数高效微调", en: "Parameter-Efficient Fine-tuning",
    tagline: { zh: "只训 0.1% 的参数,拿到 95% 的效果——前提是你知道该训哪 0.1%。", en: "Train 0.1% of the weights for 95% of the gain — if you know which 0.1%." },
    description: {
      zh: "全参微调一个 7B 模型需要约 100 GB 显存,而 LoRA 能把它压到一张 24 GB 消费级显卡里。这不是工程小技巧,而是一个数学观察:微调引起的权重更新矩阵是低秩的,所以用两个瘦矩阵的乘积就能表示它。本模块把 LoRA 的秩、缩放系数、作用层拆成可调参数,把显存的四个组成部分(权重、梯度、优化器状态、激活)做成一张会实时重算的账本,并对比 LoRA、QLoRA、全参、前缀微调在质量、显存、部署灵活性上的真实取舍。",
      en: "A full fine-tune of a 7B model needs roughly 100 GB of VRAM; LoRA fits it on a single 24 GB consumer card. That is not a trick but a mathematical observation: the weight update induced by fine-tuning is low-rank, so a product of two thin matrices can express it. This module makes LoRA's rank, scaling factor and target modules adjustable, turns VRAM's four components (weights, gradients, optimizer state, activations) into a live-recomputing ledger, and compares LoRA, QLoRA, full fine-tuning and prefix tuning on quality, memory and deployment flexibility.",
    },
  },
  {
    id: "l7", code: "AL", accent: "primary", level: 3,
    zh: "对齐与偏好优化", en: "Alignment & Preference Optimization",
    tagline: { zh: "SFT 教模型怎么答,偏好优化教它在两个都对的答案里选哪个。", en: "SFT teaches the model how to answer; preference optimization teaches it which good answer to prefer." },
    description: {
      zh: "监督微调有一个天花板:它只能模仿你写下的那个标准答案,而现实里「好」往往是相对的——两个回答都正确,但一个更简洁、更安全、更有帮助。这就是偏好优化要解决的问题。本模块讲清 RLHF 的三段式流水线(SFT → 奖励模型 → 策略优化)、DPO 如何用一个巧妙的推导把奖励模型整个省掉、β 系数控制的「学新东西」与「别跑太远」之间的拉锯,以及可验证奖励(RLVR)为什么在数学和代码任务上格外有效——顺便看看奖励黑客(reward hacking)是怎么发生的。",
      en: "Supervised fine-tuning has a ceiling: it can only imitate the one reference answer you wrote, while in reality 'good' is comparative — two answers are both correct, but one is more concise, safer, more helpful. That is what preference optimization solves. This module covers RLHF's three-stage pipeline (SFT → reward model → policy optimization), how DPO's derivation removes the reward model entirely, the tug-of-war β controls between learning something new and not drifting too far, and why verifiable rewards (RLVR) work so well on maths and code — while watching reward hacking happen.",
    },
  },
  {
    id: "l8", code: "EV", accent: "primary", level: 2,
    zh: "评估与上线", en: "Evaluation & Production",
    tagline: { zh: "「感觉变好了」是大模型项目里最贵的一句话。", en: "'It feels better now' is the most expensive sentence in an LLM project." },
    description: {
      zh: "微调完了,你怎么知道它真的更好了?公开榜单大概率被污染,人工看十条样本会被幸存者偏差骗,而客户只会记住那一条崩掉的输出。本模块教你建自己的评估体系:黄金样本集、判分方式的选择、回归检测,以及为什么每次改动都要跑全集;接着讲安全侧——越狱、过度拒绝,以及安全与有用性之间那条必须显式选择的取舍线;最后回到钱:延迟、单次成本、路由与级联,把一个能跑的模型变成一个能一直跑下去的服务。",
      en: "Your fine-tune is done — how do you know it is better? Public leaderboards are probably contaminated, eyeballing ten samples invites survivorship bias, and the customer will remember only the one output that collapsed. This module builds your own evaluation: a golden set, the right grading method, regression detection, and why every change reruns the whole set. Then safety — jailbreaks, over-refusal, and the helpfulness trade-off you must choose explicitly. Finally, money: latency, cost per call, routing and cascades — turning a model that runs into a service that keeps running.",
    },
  },
];

const CHAPTERS = [
  /* ============ L1 模型基础 ============ */
  {
    id: "lm1", code: "FM1", moduleId: "l1", difficulty: 1, hours: 5, prereq: [], viz: "attentionLab",
    props: ["自注意力 / self-attention", "Q·K·V", "softmax", "多头 / multi-head", "残差与 LayerNorm"],
    title: { zh: "注意力机制:每个位置去别处取信息", en: "Attention: Every Position Fetches From Every Other" },
    summary: {
      zh: "Transformer 的全部魔力集中在一个操作上:每个 token 拿自己的查询向量(Q)去和所有 token 的键向量(K)做点积,得到一组相关性分数,softmax 归一化成权重,再用这些权重对值向量(V)加权求和。就这一步,让「it」知道自己指的是前面哪个名词。本章给你一个可拖动的注意力热力图:改动词与词的相关性,看权重分布如何重排,以及为什么缩放因子 √d 不能省。",
      en: "All of the Transformer's magic concentrates in one operation: each token takes its query vector (Q), dots it against every token's key vector (K) to get relevance scores, normalises them into weights with softmax, and returns a weighted sum of the value vectors (V). That single step is how 'it' knows which earlier noun it refers to. This chapter gives you a draggable attention heat map: change word-to-word relevance and watch the weights redistribute — and see why the √d scaling factor cannot be dropped.",
    },
    objectives: [
      { zh: "用一句话说清 Q、K、V 各自的角色", en: "State in one sentence what Q, K and V each do" },
      { zh: "手算一个 3 token 的注意力权重分布", en: "Hand-compute the attention weights for three tokens" },
      { zh: "解释缩放因子 √d 解决了什么数值问题", en: "Explain the numerical problem the √d factor solves" },
      { zh: "说清多头注意力为什么比单头更强", en: "Say why multi-head attention beats a single head" },
    ],
    outline: [
      { zh: "从「查字典」直觉到 Q·K·V 公式", en: "From a dictionary-lookup intuition to the Q·K·V formula" },
      { zh: "softmax 与缩放因子:温度的第一次出场", en: "Softmax and scaling: temperature's first appearance" },
      { zh: "多头:同时看语法、指代与语义", en: "Multi-head: watching syntax, coreference and semantics at once" },
      { zh: "残差、LayerNorm 与前馈层:一个 block 的全貌", en: "Residuals, LayerNorm and the FFN: a full block" },
    ],
  },
  {
    id: "lm2", code: "FM2", moduleId: "l1", difficulty: 1, hours: 4, prereq: ["lm1"], viz: "tokenizerLab",
    props: ["分词 / tokenization", "BPE", "词表 / vocabulary", "嵌入 / embedding", "中文与代码的 token 膨胀"],
    title: { zh: "分词与嵌入:模型眼里的世界", en: "Tokens & Embeddings: The World the Model Sees" },
    summary: {
      zh: "模型看不到字符,只看到 token 编号。这解释了一大堆看起来很怪的现象:为什么模型数不清单词里的字母、为什么中文和代码的 API 账单比英文贵、为什么一个罕见人名会被切成五段导致模型记不住它。本章给你一个分词实验台:输入任意文本,看它如何被切分、切成多少 token、以及不同词表大小下的压缩率差异——这也是你估算训练与推理成本的第一个输入。",
      en: "The model never sees characters, only token ids. That explains a pile of odd behaviours: why it cannot count letters in a word, why Chinese and code cost more per API call than English, why a rare name gets split into five pieces and never sticks. This chapter gives you a tokenization bench: feed in any text, watch it split, count the tokens, and compare compression across vocabulary sizes — the first input to every training and inference cost estimate you will make.",
    },
    objectives: [
      { zh: "解释 BPE 如何从字符合并出子词", en: "Explain how BPE merges characters into subwords" },
      { zh: "估算一段中文/英文/代码各占多少 token", en: "Estimate the token count of Chinese, English and code" },
      { zh: "说清词表大小对模型大小与压缩率的双向影响", en: "Explain how vocabulary size cuts both ways" },
      { zh: "识别分词导致的三类典型模型「弱智」现象", en: "Recognise three classic tokenizer-induced failures" },
    ],
    outline: [
      { zh: "为什么不按字符、也不按词", en: "Why neither characters nor words" },
      { zh: "BPE 的合并过程与词表构建", en: "The BPE merge procedure and vocabulary construction" },
      { zh: "嵌入矩阵:token 编号如何变成向量", en: "The embedding matrix: from id to vector" },
      { zh: "分词的副作用:计数、拼写、多语言与成本", en: "Side effects: counting, spelling, multilinguality and cost" },
    ],
  },
  {
    id: "lm3", code: "FM3", moduleId: "l1", difficulty: 2, hours: 4, prereq: ["lm2"], viz: "scalingLaw",
    props: ["缩放定律 / scaling law", "Chinchilla 最优", "参数量 vs 数据量", "涌现 / emergence", "过训练模型"],
    title: { zh: "缩放定律:参数、数据与算力的三角", en: "Scaling Laws: The Parameters–Data–Compute Triangle" },
    summary: {
      zh: "给定一笔固定的算力预算,你应该训一个更大的模型还是喂更多的数据?这个问题有一个经验答案:Chinchilla 定律说,最优配比大约是每个参数配 20 个训练 token。今天的开源小模型普遍「过度训练」——用远超 20 倍的数据去训一个小模型,因为推理成本比训练成本重要得多。本章给你一个缩放沙盘:拖动参数量与 token 数,看损失估计、算力需求(6ND)与最优点如何移动。",
      en: "Given a fixed compute budget, should you train a bigger model or feed it more data? There is an empirical answer: the Chinchilla result says the optimum is roughly 20 training tokens per parameter. Today's open small models are deliberately 'over-trained' — far more than 20× data on a small model — because inference cost matters far more than training cost. This chapter gives you a scaling sandbox: drag parameters and tokens, watch estimated loss, compute demand (6ND) and the optimum move.",
    },
    objectives: [
      { zh: "用 6ND 估算一次预训练需要多少 FLOPs", en: "Estimate pretraining FLOPs with 6ND" },
      { zh: "解释 Chinchilla 的 20:1 配比从哪来", en: "Explain where Chinchilla's 20:1 ratio comes from" },
      { zh: "说清为什么现在流行「过度训练小模型」", en: "Say why over-training small models is now standard" },
      { zh: "判断「涌现能力」的说法在什么意义上成立", en: "Judge in what sense 'emergent abilities' is a valid claim" },
    ],
    outline: [
      { zh: "损失随规模的幂律下降", en: "Loss falls as a power law in scale" },
      { zh: "6ND:算力的四则运算", en: "6ND: the arithmetic of compute" },
      { zh: "Chinchilla 最优与它的前提", en: "The Chinchilla optimum and its assumptions" },
      { zh: "推理成本改变了目标函数", en: "Inference cost changes the objective" },
    ],
  },

  /* ============ L2 预训练与算力 ============ */
  {
    id: "lm4", code: "PT1", moduleId: "l2", difficulty: 2, hours: 5, prereq: ["lm3"], viz: "dataPipeline",
    props: ["下一 token 预测", "数据去重 / dedup", "数据配比 / mixture", "质量过滤", "数据污染"],
    title: { zh: "预训练目标与数据流水线", en: "The Pretraining Objective & Data Pipeline" },
    summary: {
      zh: "预训练的目标函数简单到令人意外:预测下一个 token,最小化交叉熵。所有能力都是这个目标的副产品。真正难的是数据:从几十 TB 的原始网页里,去重、过滤低质、按领域配比、剔除评测集污染,最后留下几 T token。本章给你一个流水线沙盘:调节各阶段的过滤强度与领域配比,看剩余数据量、质量分与下游能力预估如何变化——顺便看清为什么去重比加数据更有效。",
      en: "The pretraining objective is surprisingly plain: predict the next token, minimise cross-entropy. Every capability is a by-product of that. The hard part is data: from tens of terabytes of raw web pages, deduplicate, filter for quality, mix by domain, strip benchmark contamination, and keep a few trillion tokens. This chapter gives you a pipeline sandbox: tune each stage's filtering strength and the domain mixture, and watch surviving volume, quality score and projected downstream ability respond — including why dedup beats adding data.",
    },
    objectives: [
      { zh: "写出下一 token 预测的损失函数并解释每一项", en: "Write the next-token loss and explain each term" },
      { zh: "说清去重为什么能同时提升质量与效率", en: "Say why dedup improves quality and efficiency at once" },
      { zh: "设计一个领域配比方案并说明依据", en: "Design a domain mixture and justify it" },
      { zh: "识别数据污染并解释它如何毁掉评测", en: "Spot contamination and explain how it destroys evaluation" },
    ],
    outline: [
      { zh: "自回归目标:一个损失,全部能力", en: "The autoregressive objective: one loss, all abilities" },
      { zh: "流水线五步:抓取、抽取、去重、过滤、配比", en: "Five stages: crawl, extract, dedup, filter, mix" },
      { zh: "代码与数学数据的特殊地位", en: "Why code and maths data punch above their weight" },
      { zh: "污染:榜单虚高的技术原因", en: "Contamination: the technical reason leaderboards inflate" },
    ],
  },
  {
    id: "lm5", code: "PT2", moduleId: "l2", difficulty: 2, hours: 4, prereq: ["lm4"], viz: "computeBudget",
    props: ["FLOPs", "GPU 小时", "MFU / 利用率", "数据并行 vs 张量并行", "训练成本"],
    title: { zh: "算力预算:把训练换算成钱", en: "Compute Budget: Converting Training Into Money" },
    summary: {
      zh: "「训这个模型要多少钱」不是玄学,是一道能在纸上算完的乘法:总 FLOPs ≈ 6 × 参数量 × token 数,除以显卡的有效算力(峰值 × 利用率),得到 GPU 小时,再乘单价。这个估算的价值在于:它能在你启动一个注定跑不完的实验之前把你拦住。本章给你一个预算计算器,并顺带讲清三种并行方式各自在省什么、代价是什么。",
      en: "'What will this training run cost' is not mysticism; it is a multiplication you can finish on paper: total FLOPs ≈ 6 × parameters × tokens, divided by effective throughput (peak × utilisation) to get GPU-hours, times the hourly price. The value of the estimate is that it stops you before you launch an experiment that was never going to finish. This chapter gives you a budget calculator and explains what each parallelism strategy saves and what it costs.",
    },
    objectives: [
      { zh: "独立估算任意规模训练的 GPU 小时与费用", en: "Independently estimate GPU-hours and cost at any scale" },
      { zh: "解释 MFU(算力利用率)为什么很难超过 50%", en: "Explain why MFU rarely exceeds 50%" },
      { zh: "区分数据并行、张量并行与流水线并行的适用场景", en: "Distinguish data, tensor and pipeline parallelism" },
      { zh: "用预算反推可行的实验规模", en: "Work backwards from budget to a feasible experiment size" },
    ],
    outline: [
      { zh: "6ND 的来源:前向 2、反向 4", en: "Where 6ND comes from: 2 forward, 4 backward" },
      { zh: "从 FLOPs 到 GPU 小时到账单", en: "From FLOPs to GPU-hours to an invoice" },
      { zh: "利用率:通信、显存与流水线气泡", en: "Utilisation: communication, memory and pipeline bubbles" },
      { zh: "三种并行与它们的组合", en: "Three parallelisms and how they combine" },
    ],
  },
  {
    id: "lm6", code: "PT3", moduleId: "l2", difficulty: 3, hours: 4, prereq: ["lm5"], viz: "lossCurve",
    props: ["学习率调度", "warmup", "损失尖峰 / loss spike", "梯度裁剪", "混合精度"],
    title: { zh: "训练稳定性:损失曲线会说话", en: "Training Stability: Reading the Loss Curve" },
    summary: {
      zh: "一条训练曲线上有四种可读的信号:下降太慢(学习率太小)、震荡不收敛(太大)、突然尖峰后不回来(数值爆炸或坏数据批)、以及训练损失继续降而验证损失开始升(过拟合)。这套读图能力在微调时比预训练时更重要——因为微调的数据少、迭代快,一次配置错误可能在十分钟内把一个好模型改坏。本章给你一个可调的曲线实验台:改学习率、warmup、裁剪阈值,看曲线的形状如何变。",
      en: "A training curve carries four readable signals: falling too slowly (learning rate too small), oscillating without converging (too large), spiking and never recovering (numerical blow-up or a bad batch), and training loss still falling while validation loss turns upward (overfitting). Reading these matters more in fine-tuning than in pretraining — data is small, iterations are fast, and one bad config can ruin a good model in ten minutes. This chapter gives you a tunable curve bench: change learning rate, warmup and clipping and watch the shape respond.",
    },
    objectives: [
      { zh: "从损失曲线形状诊断出四类典型问题", en: "Diagnose four classic problems from curve shape" },
      { zh: "解释 warmup 和余弦衰减各自解决什么", en: "Explain what warmup and cosine decay each solve" },
      { zh: "说清梯度裁剪与混合精度的作用与风险", en: "Describe what clipping and mixed precision do and risk" },
      { zh: "区分「还需要多训」与「已经过拟合」", en: "Tell 'needs more training' from 'already overfitting'" },
    ],
    outline: [
      { zh: "四种曲线形状与它们的病因", en: "Four curve shapes and their causes" },
      { zh: "学习率调度:warmup、峰值、衰减", en: "LR schedules: warmup, peak, decay" },
      { zh: "尖峰:坏数据、数值溢出还是初始化", en: "Spikes: bad data, overflow, or initialisation" },
      { zh: "验证集:唯一能告诉你何时停手的东西", en: "The validation set: the only thing that tells you to stop" },
    ],
  },

  /* ============ L3 推理与部署基础 ============ */
  {
    id: "lm7", code: "IN1", moduleId: "l3", difficulty: 1, hours: 4, prereq: ["lm1"], viz: "decodingLab",
    props: ["温度 / temperature", "top-k", "top-p / nucleus", "贪心与束搜索", "重复惩罚"],
    title: { zh: "解码策略:同一个模型的两种人格", en: "Decoding: Two Personalities From One Model" },
    summary: {
      zh: "模型每一步输出的其实是整个词表上的概率分布,而「说出哪个词」是解码器决定的。温度把分布拉平或压尖,top-k 和 top-p 砍掉长尾,贪心解码永远选最大值。这几个旋钮的组合,决定了你的模型是一个严谨的信息抽取器还是一个爱编故事的作家。本章给你一个采样实验台:调旋钮,实时看候选 token 的概率如何重排、哪些被截断、以及输出多样性与准确性怎么互换。",
      en: "At each step the model actually emits a probability distribution over the whole vocabulary; which word gets said is the decoder's decision. Temperature flattens or sharpens the distribution, top-k and top-p cut the tail, greedy decoding always takes the maximum. The combination decides whether your model is a rigorous extractor or a fabulist. This chapter gives you a sampling bench: turn the knobs and watch candidate probabilities redistribute, see what gets truncated, and watch diversity trade against accuracy.",
    },
    objectives: [
      { zh: "解释温度在数学上做了什么", en: "Explain mathematically what temperature does" },
      { zh: "为抽取、翻译、创作三类任务各选一套解码参数", en: "Pick decoding parameters for extraction, translation and writing" },
      { zh: "说清 top-k 与 top-p 的区别与各自的失效场景", en: "Contrast top-k and top-p and name where each fails" },
      { zh: "识别哪些「幻觉」其实是解码参数问题", en: "Recognise which 'hallucinations' are really decoding settings" },
    ],
    outline: [
      { zh: "logits → softmax → 分布", en: "Logits → softmax → distribution" },
      { zh: "温度:一个除法改变一切", en: "Temperature: one division changes everything" },
      { zh: "截断家族:top-k、top-p、min-p", en: "The truncation family: top-k, top-p, min-p" },
      { zh: "确定性输出的正确做法", en: "How to actually get deterministic output" },
    ],
  },
  {
    id: "lm8", code: "IN2", moduleId: "l3", difficulty: 2, hours: 4, prereq: ["lm7"], viz: "kvCache",
    props: ["KV 缓存", "prefill vs decode", "连续批处理", "吞吐 vs 延迟", "上下文长度的平方代价"],
    title: { zh: "KV 缓存与吞吐:显存去哪了", en: "KV Cache & Throughput: Where the Memory Went" },
    summary: {
      zh: "生成第 100 个 token 时,模型不会重算前 99 个的注意力——它把它们的 K 和 V 缓存起来。这个缓存就是长上下文推理的真正瓶颈:它随「批大小 × 上下文长度 × 层数」线性增长,常常比模型权重本身还大。理解它,你才能解释为什么开长上下文后并发数骤降、为什么首 token 慢而后续快。本章给你一个吞吐沙盘:调批大小与上下文长度,看 KV 缓存占用、吞吐与延迟三方博弈。",
      en: "Generating token 100 does not recompute attention over the first 99 — their K and V are cached. That cache is the real bottleneck of long-context inference: it grows linearly in batch × context × layers and often exceeds the weights themselves. Understanding it explains why concurrency collapses when you enable long context, and why the first token is slow while the rest are fast. This chapter gives you a throughput sandbox: tune batch size and context length and watch KV footprint, throughput and latency negotiate.",
    },
    objectives: [
      { zh: "手算给定配置下 KV 缓存的显存占用", en: "Hand-compute KV cache footprint for a given config" },
      { zh: "区分 prefill 与 decode 两个阶段的瓶颈", en: "Distinguish the prefill and decode bottlenecks" },
      { zh: "解释连续批处理如何提高吞吐", en: "Explain how continuous batching lifts throughput" },
      { zh: "在延迟与吞吐之间为具体业务做取舍", en: "Trade latency against throughput for a real workload" },
    ],
    outline: [
      { zh: "为什么需要缓存:自回归的重复计算", en: "Why cache at all: autoregressive redundancy" },
      { zh: "KV 缓存的显存公式", en: "The KV cache memory formula" },
      { zh: "prefill 是算力瓶颈,decode 是带宽瓶颈", en: "Prefill is compute-bound, decode is bandwidth-bound" },
      { zh: "批处理策略与 SLA", en: "Batching strategies and your SLA" },
    ],
  },
  {
    id: "lm9", code: "IN3", moduleId: "l3", difficulty: 2, hours: 4, prereq: ["lm8"], viz: "quantLab",
    props: ["量化 / quantization", "INT8 / INT4", "困惑度损失", "蒸馏 / distillation", "推理成本"],
    title: { zh: "量化与蒸馏:用质量换成本", en: "Quantization & Distillation: Trading Quality for Cost" },
    summary: {
      zh: "把权重从 16 位浮点压到 4 位整数,显存需求降到四分之一,而多数任务上的质量损失小到测不出来——这几乎是免费的午餐,但「几乎」两个字里藏着代价:长上下文推理、数学计算和小模型对量化尤其敏感。本章给你一个量化实验台:选位宽与量化方式,看显存、速度与困惑度损失如何联动,并解释为什么你必须在量化之后重跑一遍自己的评估集。",
      en: "Compressing weights from 16-bit float to 4-bit integers cuts memory to a quarter while the quality loss on most tasks is too small to measure — nearly a free lunch, with the cost hiding in 'nearly': long-context inference, arithmetic and small models are all unusually quantization-sensitive. This chapter gives you a quantization bench: pick bit width and scheme, watch memory, speed and perplexity loss respond, and see why you must rerun your own eval set after quantizing.",
    },
    objectives: [
      { zh: "解释量化如何把浮点映射到低位整数", en: "Explain how quantization maps floats to low-bit integers" },
      { zh: "估算不同位宽下的显存需求", en: "Estimate memory at each bit width" },
      { zh: "识别对量化敏感的三类任务", en: "Identify three quantization-sensitive task types" },
      { zh: "说清蒸馏与量化的适用差别", en: "Say when to distil rather than quantize" },
    ],
    outline: [
      { zh: "位宽、缩放因子与分组量化", en: "Bit width, scale factors and group-wise quantization" },
      { zh: "训练后量化 vs 量化感知训练", en: "Post-training quantization vs quantization-aware training" },
      { zh: "蒸馏:让小模型学大模型的分布", en: "Distillation: teaching a small model the big one's distribution" },
      { zh: "量化后必做的评估", en: "The evaluation you must run afterwards" },
    ],
  },

  /* ============ L4 提示与上下文 ============ */
  {
    id: "lm10", code: "PR1", moduleId: "l4", difficulty: 1, hours: 4, prereq: ["lm7"], viz: "promptLab",
    props: ["提示结构", "少样本 / few-shot", "思维链 / CoT", "系统提示", "指令遵循"],
    title: { zh: "提示工程:最便宜的那一级台阶", en: "Prompting: The Cheapest Rung" },
    summary: {
      zh: "提示工程不是玄学咒语,而是三件很朴素的事:把任务说清楚、给几个例子、把输出格式钉死。它之所以值得先做,是因为迭代周期是秒级而不是小时级——你在微调上花的每一小时,本来可以试二十版提示词。本章给你一个提示打分台:勾选角色、约束、示例、格式、思维链等成分,看预估的准确率、一致性与 token 成本如何变化,以及哪些成分是虚假安慰。",
      en: "Prompt engineering is not incantation but three plain things: state the task precisely, give a few examples, and pin the output format. It is worth doing first because the iteration loop is seconds, not hours — every hour spent fine-tuning could have tested twenty prompts. This chapter gives you a prompt scoring bench: toggle role, constraints, examples, format and chain-of-thought and watch estimated accuracy, consistency and token cost move — including which ingredients are pure placebo.",
    },
    objectives: [
      { zh: "写出一个包含五个必要成分的提示模板", en: "Write a prompt template with the five necessary parts" },
      { zh: "解释少样本示例为什么有效以及何时反而有害", en: "Explain why few-shot works and when it hurts" },
      { zh: "判断一个任务是否需要思维链", en: "Judge whether a task needs chain-of-thought" },
      { zh: "用一致性而不是单次输出评价提示词", en: "Judge prompts by consistency, not a single output" },
    ],
    outline: [
      { zh: "提示的五个成分与各自的作用", en: "Five prompt components and what each buys" },
      { zh: "少样本:示例的数量、顺序与偏见", en: "Few-shot: count, order and induced bias" },
      { zh: "思维链:为什么「让它先想」有用", en: "Chain-of-thought: why 'think first' helps" },
      { zh: "提示的天花板:什么时候它一定不够", en: "The ceiling: when prompting cannot possibly suffice" },
    ],
  },
  {
    id: "lm11", code: "PR2", moduleId: "l4", difficulty: 2, hours: 4, prereq: ["lm10"], viz: "toolCall",
    props: ["结构化输出", "JSON schema", "工具调用 / tool use", "约束解码", "智能体循环"],
    title: { zh: "结构化输出与工具调用", en: "Structured Output & Tool Use" },
    summary: {
      zh: "要把模型接进真实系统,它的输出必须能被程序解析,而不是一段散文。这有三种手段,可靠性递增:在提示里要求 JSON、给出 schema 并校验重试、以及在解码阶段直接约束只能生成合法 token。工具调用则是这件事的自然延伸——模型输出的不是答案,而是一次函数调用。本章给你一个可交互的工具调用循环:看模型如何在「思考、调用、观察、回答」之间循环,以及每一步可能怎么坏掉。",
      en: "To wire a model into a real system its output must be parseable by a program, not prose. Three mechanisms, in increasing reliability: ask for JSON in the prompt, supply a schema and validate-with-retry, or constrain decoding so only legal tokens can be emitted. Tool use is the natural extension — the model emits a function call rather than an answer. This chapter gives you an interactive tool-calling loop: watch the model cycle through think, call, observe, answer, and see how each step can break.",
    },
    objectives: [
      { zh: "为一个真实任务设计 JSON schema 与校验策略", en: "Design a JSON schema and validation strategy for a real task" },
      { zh: "解释约束解码为什么能保证格式合法", en: "Explain why constrained decoding guarantees valid format" },
      { zh: "画出一次工具调用循环的完整数据流", en: "Draw the full data flow of one tool-calling loop" },
      { zh: "识别工具调用的四类失败模式", en: "Identify four tool-calling failure modes" },
    ],
    outline: [
      { zh: "三级可靠性:提示、校验重试、约束解码", en: "Three reliability tiers: prompt, validate-retry, constrain" },
      { zh: "schema 设计:少字段、平结构、枚举优先", en: "Schema design: fewer fields, flat, prefer enums" },
      { zh: "工具调用循环与终止条件", en: "The tool loop and its termination condition" },
      { zh: "失败模式:幻觉参数、死循环、越权调用", en: "Failure modes: hallucinated arguments, loops, over-reach" },
    ],
  },
  {
    id: "lm12", code: "PR3", moduleId: "l4", difficulty: 2, hours: 5, prereq: ["lm11"], viz: "ragVsFt",
    props: ["检索增强 / RAG", "知识 vs 行为", "上下文预算", "更新频率", "决策矩阵"],
    title: { zh: "RAG 还是微调:一个能算的判据", en: "RAG or Fine-tune: A Criterion You Can Compute" },
    summary: {
      zh: "这是整个大模型工程里最常被问错的问题。正确的分界线不在效果上,而在你缺的是什么:缺知识用检索(知识会变、要引用、要权限控制),缺行为用微调(格式、语气、领域推理套路、拒答边界)。把这条线画错,代价是几天算力加一个仍然会胡说的模型。本章给你一个决策矩阵:输入你的任务特征(知识更新频率、格式严格度、数据量、延迟预算),看两条路线的预估成本、效果与维护负担。",
      en: "This is the most frequently misanswered question in LLM engineering. The dividing line is not about quality but about what you lack: missing knowledge calls for retrieval (it changes, it needs citations, it needs access control); missing behaviour calls for fine-tuning (format, tone, domain reasoning patterns, refusal boundaries). Draw the line wrong and you spend days of compute on a model that still makes things up. This chapter gives you a decision matrix: enter your task's features (knowledge churn, format strictness, data volume, latency budget) and compare both routes on cost, quality and maintenance.",
    },
    objectives: [
      { zh: "用「缺知识还是缺行为」判定路线", en: "Route by 'missing knowledge or missing behaviour'" },
      { zh: "说清微调无法解决的三类问题", en: "Name three problems fine-tuning cannot solve" },
      { zh: "估算两条路线的一年总成本", en: "Estimate the one-year total cost of each route" },
      { zh: "设计检索与微调结合的混合方案", en: "Design a hybrid of retrieval and fine-tuning" },
    ],
    outline: [
      { zh: "知识 vs 行为:唯一有用的分界", en: "Knowledge vs behaviour: the only useful boundary" },
      { zh: "微调注入知识为什么低效且危险", en: "Why injecting knowledge by fine-tuning is inefficient and risky" },
      { zh: "四个决策维度与它们的权重", en: "Four decision dimensions and their weights" },
      { zh: "混合方案:微调格式,检索事实", en: "The hybrid: fine-tune the format, retrieve the facts" },
    ],
  },

  /* ============ L5 微调基础 ============ */
  {
    id: "lm13", code: "FT1", moduleId: "l5", difficulty: 2, hours: 5, prereq: ["lm12"], viz: "ftDecision",
    props: ["SFT / 指令微调", "行为 vs 知识", "灾难性遗忘", "样本效率", "微调的三个正当理由"],
    title: { zh: "什么时候该微调:三个正当理由", en: "When to Fine-tune: Three Legitimate Reasons" },
    summary: {
      zh: "微调有且只有三个真正站得住的理由:一是你要的行为无法用提示词稳定描述(比如一种特定的输出风格或专业判断套路);二是你要把大模型的能力压进一个更小更便宜的模型;三是延迟或成本要求不允许你在每次调用里塞进长提示和大量示例。除这三者之外的动机——尤其是「让它知道我们公司的产品」——几乎都应该改用检索。本章给你一个决策推演,输入场景看判定与理由。",
      en: "There are exactly three defensible reasons to fine-tune: the behaviour you want cannot be stably described in a prompt (a specific output style, a professional judgement pattern); you want to compress a large model's capability into a smaller, cheaper one; or latency and cost forbid stuffing a long prompt and many examples into every call. Motives outside those three — above all 'so it knows our products' — should almost always become retrieval instead. This chapter gives you a decision simulation: enter a scenario, see the verdict and the reasoning.",
    },
    objectives: [
      { zh: "对一个具体需求判断该不该微调并给出理由", en: "Decide whether a concrete need warrants fine-tuning, with reasons" },
      { zh: "解释灾难性遗忘的机制与缓解方法", en: "Explain catastrophic forgetting and how to mitigate it" },
      { zh: "估算微调所需的最小样本量", en: "Estimate the minimum sample size a fine-tune needs" },
      { zh: "设计微调前必须先跑通的基线", en: "Define the baseline you must beat before training" },
    ],
    outline: [
      { zh: "三个正当理由与三个常见错误动机", en: "Three legitimate reasons and three common wrong ones" },
      { zh: "行为可学、事实难灌:为什么", en: "Behaviour is learnable, facts are not: why" },
      { zh: "灾难性遗忘:学会新的,忘掉旧的", en: "Catastrophic forgetting: learning new, losing old" },
      { zh: "基线优先:没有基线的微调是赌博", en: "Baseline first: fine-tuning without one is gambling" },
    ],
  },
  {
    id: "lm14", code: "FT2", moduleId: "l5", difficulty: 3, hours: 6, prereq: ["lm13"], viz: "sftData",
    props: ["指令数据集", "多样性 vs 数量", "标注一致性", "数据清洗", "1000 条足够假设"],
    title: { zh: "SFT 数据集:1000 条精品胜过 10 万条垃圾", en: "SFT Datasets: 1,000 Good Beats 100,000 Bad" },
    summary: {
      zh: "微调的效果几乎完全由数据决定,而数据的质量由三个维度决定:多样性(覆盖了多少种不同的输入形态)、一致性(同类输入是否给出了同一种风格的输出)、正确性(有多少条标注本身是错的)。其中一致性最容易被忽视也最致命——两个标注员风格不同,模型会学到一个两者之间的平均值,而这个平均值往往两边都不像。本章给你一个数据集构建台:调节规模、多样性、噪声率与一致性,看预估效果曲线。",
      en: "Fine-tuning outcomes are almost entirely determined by data, and data quality by three dimensions: diversity (how many distinct input shapes are covered), consistency (whether similar inputs get the same style of output), and correctness (how many labels are simply wrong). Consistency is the most overlooked and most lethal — two annotators with different styles teach the model an average that resembles neither. This chapter gives you a dataset construction bench: tune size, diversity, noise rate and consistency, and watch the projected quality curve.",
    },
    objectives: [
      { zh: "为一个任务设计一份指令数据集的规格", en: "Write the spec for a task's instruction dataset" },
      { zh: "解释为什么一致性比数量更重要", en: "Explain why consistency outranks quantity" },
      { zh: "设计标注规范与交叉校验流程", en: "Design annotation guidelines and cross-review" },
      { zh: "识别并清除四类有害样本", en: "Identify and remove four kinds of harmful examples" },
    ],
    outline: [
      { zh: "三个质量维度:多样、一致、正确", en: "Three quality dimensions: diverse, consistent, correct" },
      { zh: "从哪里搞数据:真实日志、人工写作、模型合成", en: "Where data comes from: logs, human writing, synthesis" },
      { zh: "合成数据的收益与它的自我强化陷阱", en: "Synthetic data: the gain and the self-reinforcement trap" },
      { zh: "训练集/验证集切分与去重", en: "Train/validation split and deduplication" },
    ],
  },
  {
    id: "lm15", code: "FT3", moduleId: "l5", difficulty: 3, hours: 5, prereq: ["lm14"], viz: "hyperLab",
    props: ["学习率", "epoch 数", "批大小", "过拟合", "早停"],
    title: { zh: "超参与训练动态:过拟合长什么样", en: "Hyperparameters & Dynamics: What Overfitting Looks Like" },
    summary: {
      zh: "微调的超参空间小得令人愉快:真正重要的只有学习率、epoch 数和有效批大小三个。但它们的错误设置会以非常隐蔽的方式伤害模型——学习率大了会灾难性遗忘(通用能力崩掉但你的验证集看起来还行)、epoch 多了会背题(在训练分布上完美,换个问法就崩)。本章给你一个训练动态实验台:调这三个参数,看训练/验证损失双曲线、遗忘指标与最佳早停点如何移动。",
      en: "Fine-tuning's hyperparameter space is pleasantly small: only learning rate, epochs and effective batch size really matter. But wrong settings hurt in subtle ways — too high a learning rate causes catastrophic forgetting (general ability collapses while your validation set still looks fine), too many epochs memorise the exam (perfect on the training distribution, broken on a rephrasing). This chapter gives you a dynamics bench: tune the three, and watch the train/validation curves, a forgetting metric and the optimal early-stopping point move.",
    },
    objectives: [
      { zh: "为一次 LoRA 微调选出合理的初始超参", en: "Pick sane starting hyperparameters for a LoRA run" },
      { zh: "从双曲线判断最佳停止点", en: "Read the optimal stopping point off the two curves" },
      { zh: "区分过拟合与灾难性遗忘两类退化", en: "Distinguish overfitting from catastrophic forgetting" },
      { zh: "设计一个能检测遗忘的保留评估集", en: "Design a held-out set that detects forgetting" },
    ],
    outline: [
      { zh: "三个真正重要的超参", en: "The three that matter" },
      { zh: "有效批大小 = 批 × 累积 × 卡数", en: "Effective batch = batch × accumulation × devices" },
      { zh: "过拟合的两种面孔", en: "The two faces of overfitting" },
      { zh: "早停与检查点选择", en: "Early stopping and checkpoint selection" },
    ],
  },

  /* ============ L6 参数高效微调 ============ */
  {
    id: "lm16", code: "PE1", moduleId: "l6", difficulty: 3, hours: 6, prereq: ["lm15"], viz: "loraRank",
    props: ["LoRA", "低秩分解", "秩 r", "缩放 α", "目标模块"],
    title: { zh: "LoRA:为什么低秩就够了", en: "LoRA: Why Low Rank Is Enough" },
    summary: {
      zh: "LoRA 的核心观察只有一句话:微调造成的权重变化 ΔW 是低秩的,所以不必存一个和 W 一样大的 ΔW,只需存两个瘦矩阵 A 和 B,让 ΔW = BA。一个 4096×4096 的权重矩阵有 1677 万参数,而秩 r=8 的 LoRA 只需 6.5 万——训练参数量降到 0.4%,效果在多数任务上几乎不掉。本章给你一个 LoRA 实验台:拖动秩、α 与作用层集合,实时看可训练参数量、显存与预估效果。",
      en: "LoRA's core observation is one sentence: the weight change ΔW induced by fine-tuning is low-rank, so instead of storing a ΔW as large as W you store two thin matrices A and B with ΔW = BA. A 4096×4096 weight matrix holds 16.8M parameters; a rank-8 LoRA needs 65K — trainable parameters drop to 0.4% with almost no quality loss on most tasks. This chapter gives you a LoRA bench: drag rank, α and the set of target modules, and watch trainable parameters, memory and projected quality respond live.",
    },
    objectives: [
      { zh: "推导 LoRA 的参数量公式 2·r·d", en: "Derive LoRA's parameter count 2·r·d" },
      { zh: "解释 α/r 缩放系数的作用", en: "Explain the role of the α/r scaling factor" },
      { zh: "选择该给哪些层加 LoRA 并说明理由", en: "Choose which modules to adapt, with justification" },
      { zh: "判断什么任务需要更高的秩", en: "Judge which tasks need a higher rank" },
    ],
    outline: [
      { zh: "低秩假设:ΔW 的信息其实很少", en: "The low-rank hypothesis: ΔW carries little information" },
      { zh: "参数量与秩的线性关系", en: "Parameters scale linearly in rank" },
      { zh: "α、dropout 与初始化", en: "α, dropout and initialisation" },
      { zh: "该给哪些模块加:注意力、MLP、还是全部", en: "Which modules: attention, MLP, or everything" },
    ],
  },
  {
    id: "lm17", code: "PE2", moduleId: "l6", difficulty: 3, hours: 6, prereq: ["lm16"], viz: "vramLedger",
    props: ["QLoRA", "4-bit 量化训练", "优化器状态", "激活重算 / checkpointing", "显存账本"],
    title: { zh: "QLoRA 与显存账本:24 GB 能训多大", en: "QLoRA & the VRAM Ledger: What Fits in 24 GB" },
    summary: {
      zh: "「我的显卡能微调多大的模型」是一道加法题,加数有四项:权重、梯度、优化器状态、激活。全参微调用 Adam 时,后三项加起来是权重的 5–6 倍——这就是 7B 模型全参微调需要约 100 GB 的原因。LoRA 砍掉梯度和优化器状态里的绝大部分,QLoRA 再把权重量化到 4 bit,两者叠加后 7B 能塞进 10 GB 出头。本章给你一张会实时重算的显存账本,让你自己搭配置。",
      en: "'How large a model can my GPU fine-tune' is an addition with four terms: weights, gradients, optimizer state, activations. With Adam and full fine-tuning the last three sum to 5–6× the weights — which is why a 7B full fine-tune needs about 100 GB. LoRA removes most of the gradients and optimizer state; QLoRA then quantizes the frozen weights to 4 bits, and together 7B fits in a little over 10 GB. This chapter gives you a live-recomputing VRAM ledger to assemble your own configuration.",
    },
    objectives: [
      { zh: "手算任意配置下的显存需求", en: "Hand-compute VRAM for any configuration" },
      { zh: "解释 Adam 为什么让显存变成权重的三倍", en: "Explain why Adam triples the weight memory" },
      { zh: "说清 QLoRA 的三个关键技术", en: "Describe QLoRA's three key techniques" },
      { zh: "用激活重算与梯度累积换显存", en: "Trade compute for memory with checkpointing and accumulation" },
    ],
    outline: [
      { zh: "四项加数:权重、梯度、优化器、激活", en: "Four terms: weights, gradients, optimizer, activations" },
      { zh: "精度选择:fp32 / bf16 / fp8 / 4-bit", en: "Precision: fp32 / bf16 / fp8 / 4-bit" },
      { zh: "QLoRA:NF4 量化、双重量化、分页优化器", en: "QLoRA: NF4, double quantization, paged optimizers" },
      { zh: "省显存的四种手段与它们的时间代价", en: "Four ways to save memory and what each costs in time" },
    ],
  },
  {
    id: "lm18", code: "PE3", moduleId: "l6", difficulty: 3, hours: 5, prereq: ["lm17"], viz: "peftCompare",
    props: ["全参 vs LoRA", "前缀微调 / prefix", "适配器 / adapter", "权重合并 / merge", "多 LoRA 服务"],
    title: { zh: "方法对比与合并部署", en: "Comparing Methods & Serving Adapters" },
    summary: {
      zh: "参数高效微调不只有 LoRA:前缀微调只训一小段虚拟 token、适配器在层间插入小网络、DoRA 把幅度与方向分开训。它们在质量、显存、推理开销、可组合性上各有取舍。而部署时还有一个 LoRA 独有的巨大优势:多个适配器可以共享同一份基座权重同时在线服务,一个客户一个 LoRA——或者干脆把它合并回权重,做到零推理开销。本章给你一个对比矩阵与一个多适配器服务推演。",
      en: "Parameter-efficient fine-tuning is not only LoRA: prefix tuning trains a short run of virtual tokens, adapters insert small networks between layers, DoRA separates magnitude from direction. Each trades quality, memory, inference overhead and composability differently. Deployment adds one advantage unique to LoRA: many adapters can share one set of base weights and serve concurrently — one per customer — or be merged back into the weights for zero inference overhead. This chapter gives you a comparison matrix and a multi-adapter serving simulation.",
    },
    objectives: [
      { zh: "在四种微调方法之间为具体场景做选择", en: "Choose among four methods for a concrete scenario" },
      { zh: "解释权重合并的收益与它失去的灵活性", en: "Explain what merging gains and what flexibility it loses" },
      { zh: "设计一个多客户多适配器的服务架构", en: "Design a multi-tenant multi-adapter serving architecture" },
      { zh: "说清适配器叠加为什么常常不奏效", en: "Say why stacking adapters often fails" },
    ],
    outline: [
      { zh: "四种方法的机制对比", en: "Mechanisms of the four methods" },
      { zh: "质量、显存、推理开销三维取舍", en: "Quality, memory, inference overhead" },
      { zh: "合并 vs 动态加载", en: "Merge vs load dynamically" },
      { zh: "多适配器服务与版本管理", en: "Multi-adapter serving and version control" },
    ],
  },

  /* ============ L7 对齐与偏好优化 ============ */
  {
    id: "lm19", code: "AL1", moduleId: "l7", difficulty: 3, hours: 6, prereq: ["lm15"], viz: "rlhfPipeline",
    props: ["RLHF", "奖励模型 / reward model", "PPO", "KL 惩罚", "人类偏好标注"],
    title: { zh: "RLHF:从模仿到偏好", en: "RLHF: From Imitation to Preference" },
    summary: {
      zh: "监督微调只能告诉模型「这个答案是对的」,却无法告诉它「这两个都对但第一个更好」。RLHF 用三段式解决这个问题:先 SFT 让模型能用,再用人类的成对比较训一个奖励模型,最后用强化学习让策略去最大化奖励——同时用 KL 惩罚拴住它,不让它为了刷分而变成一个只会说安全废话的模型。本章给你一个流水线推演:调节标注量、奖励模型准确率与 KL 系数,看最终策略的有用性、安全性与多样性如何变化。",
      en: "Supervised fine-tuning can say 'this answer is correct' but not 'both are correct and the first is better'. RLHF solves that in three stages: SFT to make the model usable, a reward model trained on human pairwise comparisons, then reinforcement learning to maximise reward — with a KL penalty leashing the policy so it does not become a machine that games the score by saying safe nothings. This chapter gives you a pipeline simulation: tune annotation volume, reward-model accuracy and the KL coefficient, and watch helpfulness, safety and diversity respond.",
    },
    objectives: [
      { zh: "画出 RLHF 三个阶段的数据流与产出", en: "Draw the data flow and output of all three stages" },
      { zh: "解释奖励模型为什么用成对比较而不是打分", en: "Explain why reward models use pairwise comparisons, not scores" },
      { zh: "说清 KL 惩罚在防止什么", en: "Say what the KL penalty prevents" },
      { zh: "识别对齐税(alignment tax)的表现", en: "Recognise the symptoms of the alignment tax" },
    ],
    outline: [
      { zh: "为什么需要偏好:标准答案的天花板", en: "Why preference: the ceiling of reference answers" },
      { zh: "奖励模型:把比较变成分数", en: "The reward model: turning comparisons into scores" },
      { zh: "策略优化与 KL 约束", en: "Policy optimization under a KL constraint" },
      { zh: "对齐税与它的缓解", en: "The alignment tax and how to reduce it" },
    ],
  },
  {
    id: "lm20", code: "AL2", moduleId: "l7", difficulty: 3, hours: 6, prereq: ["lm19"], viz: "dpoLab",
    props: ["DPO", "隐式奖励", "β 系数", "参考模型", "偏好数据对"],
    title: { zh: "DPO:把奖励模型省掉", en: "DPO: Removing the Reward Model" },
    summary: {
      zh: "DPO 的推导是近年最优雅的结果之一:如果奖励模型和策略之间存在那个闭式最优解关系,那么可以把奖励整个消掉,直接在偏好数据上做一个像监督学习一样简单的损失。工程上的意义是巨大的——不用训奖励模型、不用采样、不用调 PPO,一张卡就能跑。代价是它对偏好数据的质量更敏感,而 β 系数控制的「学多少」与「漂多远」需要你自己把握。本章给你一个 DPO 实验台。",
      en: "DPO's derivation is one of the most elegant recent results: given the closed-form optimum relating reward and policy, the reward can be eliminated entirely, leaving a loss on preference data almost as simple as supervised learning. The engineering consequence is large — no reward model, no sampling, no PPO tuning; one GPU suffices. The price is greater sensitivity to preference data quality, and a β coefficient balancing how much it learns against how far it drifts. This chapter gives you a DPO bench.",
    },
    objectives: [
      { zh: "说清 DPO 与 RLHF 在流程上的差别", en: "Contrast the DPO and RLHF pipelines" },
      { zh: "解释 β 控制的是什么取舍", en: "Explain the trade-off β controls" },
      { zh: "判断什么情况下 DPO 不如 RLHF", en: "Judge when RLHF still beats DPO" },
      { zh: "为一个任务设计偏好数据采集方案", en: "Design preference-data collection for a task" },
    ],
    outline: [
      { zh: "从 RLHF 目标函数到 DPO 损失", en: "From the RLHF objective to the DPO loss" },
      { zh: "隐式奖励:模型自己就是奖励函数", en: "Implicit reward: the model is its own reward function" },
      { zh: "β 与参考模型:漂移的缰绳", en: "β and the reference model: the drift leash" },
      { zh: "偏好数据的构造与常见污染", en: "Constructing preference data and its usual contamination" },
    ],
  },
  {
    id: "lm21", code: "AL3", moduleId: "l7", difficulty: 3, hours: 5, prereq: ["lm20"], viz: "rewardHack",
    props: ["可验证奖励 / RLVR", "推理训练", "奖励黑客 / reward hacking", "过程 vs 结果奖励", "自我一致性"],
    title: { zh: "可验证奖励与奖励黑客", en: "Verifiable Rewards & Reward Hacking" },
    summary: {
      zh: "在数学和代码上,「答案对不对」可以被程序判定,不需要人类打分也不需要奖励模型——这就是可验证奖励(RLVR),也是近年推理能力大幅提升背后的关键。但它同时把奖励黑客暴露得最清楚:如果奖励只看最终答案,模型会学会猜、会学会写出通过测试但逻辑错误的代码、会学会在思考里绕圈以刷长度。本章给你一个奖励黑客实验室,让你设计奖励函数,然后亲眼看模型如何钻你留下的空子。",
      en: "In maths and code, whether the answer is right can be decided by a program — no human raters, no reward model. That is RLVR, and it is central to the recent jump in reasoning ability. It also exposes reward hacking most clearly: if the reward only checks the final answer, the model learns to guess, to write code that passes the tests with wrong logic, to pad its reasoning for length. This chapter gives you a reward-hacking lab: design the reward function, then watch the model exploit the loophole you left.",
    },
    objectives: [
      { zh: "区分可验证奖励与模型评审奖励的适用范围", en: "Contrast verifiable and model-judged rewards" },
      { zh: "设计一个抗黑客的奖励函数", en: "Design a hack-resistant reward function" },
      { zh: "解释过程奖励与结果奖励的取舍", en: "Explain the process-vs-outcome reward trade-off" },
      { zh: "识别三类典型的奖励黑客行为", en: "Recognise three classic reward-hacking behaviours" },
    ],
    outline: [
      { zh: "什么任务的奖励可以被程序判定", en: "Which tasks admit programmatic rewards" },
      { zh: "结果奖励、过程奖励与它们的组合", en: "Outcome, process, and combined rewards" },
      { zh: "奖励黑客的三种形态", en: "Three shapes of reward hacking" },
      { zh: "防御:多目标、抽查与红队", en: "Defences: multi-objective, spot checks, red teams" },
    ],
  },

  /* ============ L8 评估与上线 ============ */
  {
    id: "lm22", code: "EV1", moduleId: "l8", difficulty: 2, hours: 5, prereq: ["lm15"], viz: "evalHarness",
    props: ["黄金评估集", "基准污染", "判分方式", "回归检测", "置信区间"],
    title: { zh: "评估体系:没有评测就没有微调", en: "Evaluation: No Eval, No Fine-tune" },
    summary: {
      zh: "微调完只看几条样本觉得「好像好了」,是这个领域最常见的自欺。你需要的是一个 50–200 条的黄金评估集,一个明确的判分方式,以及一条纪律:每次改动都跑全集、并且分开报告提升项和回归项。本章给你一个评估台:改动模型配置,看通过率、幻觉率、回归项数量与统计置信区间——并让你亲眼看到 50 条样本上 4% 的提升在统计上其实什么也没说明。",
      en: "Eyeballing a few samples after a fine-tune and concluding 'it seems better' is this field's commonest self-deception. What you need is a golden set of 50–200 items, an explicit grading method, and one discipline: rerun the whole set on every change and report gains and regressions separately. This chapter gives you an evaluation bench: change the configuration and watch pass rate, hallucination rate, regression count and the confidence interval — and see for yourself that a 4% gain on 50 items says statistically nothing.",
    },
    objectives: [
      { zh: "为自己的任务建一个最小可用评估集", en: "Build a minimum viable eval set for your own task" },
      { zh: "为不同任务选择正确的判分方式", en: "Pick the right grading method per task" },
      { zh: "解释为什么公开榜单不能作为验收标准", en: "Explain why public leaderboards cannot be acceptance criteria" },
      { zh: "用置信区间判断一次提升是否真实", en: "Use confidence intervals to judge whether a gain is real" },
    ],
    outline: [
      { zh: "黄金集从哪来:真实用户的真实问题", en: "Where the golden set comes from: real user questions" },
      { zh: "四种判分:精确匹配、要点覆盖、模型评审、人工", en: "Four grading methods: exact, key-point, model-judge, human" },
      { zh: "污染与过拟合评估集", en: "Contamination and overfitting to your own eval" },
      { zh: "样本量与置信区间:小提升的陷阱", en: "Sample size and confidence: the small-gain trap" },
    ],
  },
  {
    id: "lm23", code: "EV2", moduleId: "l8", difficulty: 2, hours: 5, prereq: ["lm22"], viz: "redTeam",
    props: ["越狱 / jailbreak", "提示注入", "过度拒绝", "安全 vs 有用", "红队测试"],
    title: { zh: "安全与红队:有用与安全的那条线", en: "Safety & Red-teaming: The Helpfulness Line" },
    summary: {
      zh: "微调会动摇模型原有的安全行为——你在自己数据上训得越狠,基座模型的拒答边界就越可能被冲掉。而反方向的失败同样真实:过度对齐的模型会拒绝一半正常请求,用户三天就弃用了。这不是一个能同时最大化的双目标,你必须显式地选一个位置。本章给你一个红队推演:调节安全强度,看越狱成功率与过度拒绝率此消彼长,并测试提示注入这类结构性攻击。",
      en: "Fine-tuning destabilises the safety behaviour a model arrived with — the harder you train on your own data, the more likely the base model's refusal boundary washes out. The opposite failure is just as real: an over-aligned model refuses half of legitimate requests and users abandon it within days. These two objectives cannot both be maximised; you must explicitly choose a point. This chapter gives you a red-team simulation: tune safety strength and watch jailbreak success trade against over-refusal, then test structural attacks like prompt injection.",
    },
    objectives: [
      { zh: "解释微调如何削弱基座模型的安全行为", en: "Explain how fine-tuning erodes base-model safety" },
      { zh: "度量过度拒绝率并说明它的业务代价", en: "Measure over-refusal and state its business cost" },
      { zh: "区分越狱与提示注入两类攻击", en: "Distinguish jailbreaks from prompt injection" },
      { zh: "设计一个覆盖四类风险的红队清单", en: "Design a red-team checklist covering four risk classes" },
    ],
    outline: [
      { zh: "微调对安全行为的侵蚀", en: "How fine-tuning erodes safety behaviour" },
      { zh: "两类攻击:说服模型 vs 欺骗系统", en: "Two attack classes: persuade the model vs deceive the system" },
      { zh: "过度拒绝:另一半的失败", en: "Over-refusal: the other half of the failure" },
      { zh: "红队流程与它的产出物", en: "The red-team process and its deliverables" },
    ],
  },
  {
    id: "lm24", code: "EV3", moduleId: "l8", difficulty: 2, hours: 5, prereq: ["lm23"], viz: "prodCost",
    props: ["单次成本", "P95 延迟", "模型路由 / routing", "级联 / cascade", "缓存与批处理"],
    title: { zh: "上线:延迟、成本与路由", en: "Production: Latency, Cost and Routing" },
    summary: {
      zh: "把模型上线之后,你面对的是三个互相拉扯的指标:质量、延迟、单次成本。最有效的手段往往不是换更大的模型,而是分流:简单请求交给你微调过的小模型,难的升级给大模型,重复的直接命中缓存。一个设计得好的级联系统,常常能用 30% 的成本拿到 95% 的质量。本章给你一个生产成本沙盘:调节流量分布、路由阈值与缓存命中率,看月账单、P95 延迟与整体质量三方联动。",
      en: "Once live you face three metrics pulling against each other: quality, latency, cost per call. The most effective lever is usually not a bigger model but triage: easy requests to your fine-tuned small model, hard ones escalated to a large one, repeats served from cache. A well-designed cascade routinely buys 95% of the quality for 30% of the cost. This chapter gives you a production sandbox: tune traffic mix, routing threshold and cache hit rate, and watch the monthly bill, P95 latency and overall quality negotiate.",
    },
    objectives: [
      { zh: "估算一个 LLM 服务的月度成本", en: "Estimate the monthly cost of an LLM service" },
      { zh: "设计一个两级路由/级联方案并算出收益", en: "Design a two-tier cascade and compute its saving" },
      { zh: "区分首 token 延迟与整体延迟的优化手段", en: "Separate time-to-first-token from total-latency optimisation" },
      { zh: "设计上线后必须持续监控的四个指标", en: "Define the four metrics to monitor after launch" },
    ],
    outline: [
      { zh: "三个互斥指标:质量、延迟、成本", en: "Three competing metrics: quality, latency, cost" },
      { zh: "路由与级联:让小模型承担大部分流量", en: "Routing and cascades: small models take the bulk" },
      { zh: "缓存:被低估的最大优化", en: "Caching: the most underrated optimisation" },
      { zh: "上线后的四个监控指标与漂移检测", en: "Four post-launch monitors and drift detection" },
    ],
  },
];

/* Derived stats used on the home page */
const TOTAL_HOURS = CHAPTERS.reduce((s, c) => s + c.hours, 0);
const DEMO_COUNT = CHAPTERS.filter((c) => c.viz).length;
const ALL_PROPS = [...new Set(CHAPTERS.flatMap((c) => c.props || []))];

window.MODULES = MODULES;
window.CHAPTERS = CHAPTERS;
window.TOTAL_HOURS = TOTAL_HOURS;
window.DEMO_COUNT = DEMO_COUNT;
window.ALL_PROPS = ALL_PROPS;
