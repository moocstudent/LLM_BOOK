/* =========================================================
   i18n — Chinese / English switching
   ---------------------------------------------------------
   UI            : dictionary of interface strings { key: {zh, en} }
   LangContext   : current language ("zh" | "en")
   useLangState(): App-level state hook (persists to localStorage)
   useLang()     : read current language inside any component
   useT()        : returns t(key) -> localized UI string
   pick(lang,obj): localize a content object { zh, en } (or a plain string)
   ========================================================= */

const LANG_KEY = "llm_book_lang";

const LangContext = React.createContext("zh");

function useLangState() {
  const [lang, setLangRaw] = React.useState(() => {
    try { return localStorage.getItem(LANG_KEY) || "zh"; } catch (e) { return "zh"; }
  });
  React.useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
    document.documentElement.setAttribute("data-lang", lang);
  }, [lang]);
  const setLang = (l) => {
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    setLangRaw(l);
  };
  const toggle = () => setLang(lang === "zh" ? "en" : "zh");
  return [lang, setLang, toggle];
}

function useLang() { return React.useContext(LangContext); }

function useT() {
  const lang = React.useContext(LangContext);
  return (key) => {
    const e = UI[key];
    if (e === undefined) return key;
    if (typeof e === "object") return e[lang] !== undefined ? e[lang] : e.zh;
    return e;
  };
}

// Localize a { zh, en } object; a bare string is returned as-is.
function pick(lang, obj) {
  if (obj == null) return "";
  if (typeof obj === "string") return obj;
  return obj[lang] !== undefined ? obj[lang] : (obj.zh !== undefined ? obj.zh : obj.en);
}
// The "other" language for a content object (used for the sub-title lines).
function other(lang, obj) { return pick(lang === "zh" ? "en" : "zh", obj); }

// "{n} 章" -> fmt("{n} 章", {n: 3})
function fmt(str, map) {
  return String(str).replace(/\{(\w+)\}/g, (_, k) => (map[k] !== undefined ? map[k] : `{${k}}`));
}

const UI = {
  /* nav */
  nav_home:    { zh: "首页", en: "Home" },
  nav_about:   { zh: "关于", en: "About" },
  nav_modules: { zh: "模块", en: "Modules" },
  lang_title:  { zh: "切换语言", en: "Switch language" },
  theme_title: { zh: "切换主题", en: "Toggle theme" },

  /* hero */
  hero_badge:  { zh: "开源 · 中英双语 · 大模型与微调自学", en: "Open · bilingual · LLMs & fine-tuning" },
  hero_l1:     { zh: "先在训练场里试,", en: "First run the experiment," },
  hero_l2a:    { zh: "再讲清", en: "then nail the" },
  hero_l2b:    { zh: "原理。", en: "mechanics." },
  hero_sub:    {
    zh: "一站式大语言模型自学地图,重点讲透微调:注意力与分词、缩放定律、预训练与算力预算、解码与量化推理、提示与上下文工程、SFT 数据与超参、LoRA/QLoRA 与显存账本、RLHF 与 DPO 对齐、评估与上线成本。共 {M} 个模块、{C} 章,每章开头都是一个可交互的训练场实验。",
    en: "A self-study map for large language models with a deep focus on fine-tuning: attention and tokenization, scaling laws, pretraining and compute budgets, decoding and quantized inference, prompting and context engineering, SFT data and hyperparameters, LoRA/QLoRA and the VRAM ledger, RLHF and DPO alignment, evaluation and production cost. {M} modules, {C} chapters — each opening with an interactive experiment.",
  },
  cta_start:   { zh: "从第一章开始 →", en: "Start chapter 1 →" },
  cta_howto:   { zh: "如何使用", en: "How it works" },
  cta_roadmap: { zh: "查看路线图", en: "See the roadmap" },

  meta_modules:  { zh: "模块", en: "Modules" },
  meta_chapters: { zh: "章", en: "Chapters" },
  meta_demos:    { zh: "训练场实验", en: "Experiments" },
  meta_hours:    { zh: "小时", en: "Hours" },

  your_progress: { zh: "你的进度", en: "Your progress" },
  synced:        { zh: "本地保存 · 无需登录", en: "Saved locally · no login" },

  /* sections */
  sec01:       { zh: "学习路线图", en: "Learning roadmap" },
  sec01_aside: { zh: "从一个 token 走到一次上线的微调", en: "From one token to a fine-tune in production" },
  sec02:       { zh: "课程模块", en: "Course modules" },
  sec02_aside: { zh: "点击进入任意模块", en: "Click any module to enter" },
  sec03:       { zh: "学习方法", en: "The method" },
  sec03_aside: { zh: "先实验,再解释,后复算", en: "Experiment, explain, then recompute" },

  rm_notstarted: { zh: "未开始", en: "Not started" },
  rm_done:       { zh: "已完成", en: "Done" },

  hours_unit:    { zh: "小时", en: "h" },
  modules_count: { zh: "章", en: "chapters" },
  done_word:     { zh: "完成", en: "done" },
  enter_word:    { zh: "进入 →", en: "Enter →" },

  phil1_zh: { zh: "先做实验", en: "Run the experiment" },
  phil1_b:  {
    zh: "每一章开头就是一个可交互的训练场:调温度看采样分布怎么坍缩、拖 LoRA 的秩看可训练参数与显存怎么变、加 epoch 看验证损失什么时候开始上翘、调 DPO 的 β 看模型离参考模型漂多远。这些直觉不是背出来的,是「拖」出来的。",
    en: "Every chapter opens with an interactive lab: raise the temperature and watch the sampling distribution collapse, drag LoRA's rank and watch trainable parameters and VRAM move, add epochs and watch validation loss turn upward, tune DPO's β and watch the policy drift from its reference. These intuitions are not memorised — they are dragged into place.",
  },
  phil2_zh: { zh: "再读解释", en: "Read the explanation" },
  phil2_b:  {
    zh: "实验背后是原理:为什么注意力是 softmax 加权求和、为什么 20 倍 token 数是 Chinchilla 的答案、为什么 LoRA 只训 0.1% 参数却常常够用、为什么 DPO 能省掉奖励模型、为什么「感觉变好了」是最贵的一句话。「解释」部分把每个公式和每条经验的动机讲清楚。",
    en: "Behind each experiment sits the mechanism: why attention is a softmax-weighted sum, why 20 tokens per parameter is Chinchilla's answer, why training 0.1% of the weights with LoRA is often enough, why DPO removes the reward model, why 'it feels better now' is the most expensive sentence in the room. The explanation motivates every formula and every hard-won rule.",
  },
  phil3_zh: { zh: "最后复算", en: "Recompute it yourself" },
  phil3_b:  {
    zh: "每章的练习都要求你脱离本站动手:用纸笔算一次 7B 模型全参微调需要多少显存、给你手上的任务写 50 条评估样本、把同一份数据分别用 LoRA 和全参跑一次对比、把你上一次「效果变好了」的改动补一份回归测试。能算清代价,才算真的学会。",
    en: "Every chapter's exercises send you away from this site: compute on paper how much VRAM a full fine-tune of a 7B model needs, write 50 eval items for your own task, train the same dataset once with LoRA and once fully and compare, and give your last 'it got better' change the regression test it never had. You have learned it when you can price it.",
  },

  footer_tag:  { zh: "weights & tokens · 大模型与微调自学 · 2026", en: "weights & tokens · LLMs & fine-tuning · 2026" },
  footer_sync: { zh: "进度本地保存", en: "progress saved locally" },

  /* module page */
  bc_home:    { zh: "首页", en: "Home" },
  bc_modules: { zh: "模块", en: "Modules" },
  module_word:{ zh: "模块", en: "Module" },
  of_word:    { zh: "共", en: "of" },
  m_meta_chapters: { zh: "章数", en: "Chapters" },
  m_meta_hours:    { zh: "预计小时", en: "Est. hours" },
  m_meta_level:    { zh: "难度", en: "Level" },
  m_meta_progress: { zh: "进度", en: "Progress" },
  chapter_list: { zh: "本模块章节", en: "Chapters in this module" },
  click_enter:  { zh: "点击任意章节进入", en: "Click a chapter to enter" },
  no_prereq:    { zh: "无先修", en: "No prereq" },
  prereq_n:     { zh: "{n} 项先修", en: "{n} prereq" },
  not_found_m:  { zh: "未找到该模块。", en: "Module not found." },

  diff_1: { zh: "入门", en: "Intro" },
  diff_2: { zh: "进阶", en: "Core" },
  diff_3: { zh: "挑战", en: "Advanced" },

  /* chapter page */
  ch_sec_intro:   { zh: "本章导读", en: "Overview" },
  ch_sec_obj:     { zh: "学习目标", en: "Objectives" },
  ch_sec_outline: { zh: "内容大纲", en: "Outline" },
  ch_sec_viz:     { zh: "训练场 · 可交互实验", en: "The lab · live experiment" },
  ch_sec_notes:   { zh: "解释 · 核心讲义", en: "The explanation · core notes" },
  viz_hint:     { zh: "改动参数,亲眼看注意力、损失、显存与成本如何联动;这里的每一个数字都是活的,大胆试。", en: "Change the parameters and watch attention, loss, VRAM and cost move together; every number here is live — experiment freely." },
  key_badge:    { zh: "重点", en: "Key" },
  loading_notes:{ zh: "正在加载讲义……", en: "Loading notes…" },
  notes_soon:   { zh: "本章深度讲义正在编写中。以上目标与大纲即为本章脉络,先把上面的实验玩透。", en: "The deep-dive notes for this chapter are being written. Use the objectives and outline above as your map — and play with the experiment first." },
  back_to:      { zh: "返回", en: "Back to" },
  est_word:     { zh: "预计", en: "Est." },
  level_word:   { zh: "难度", en: "Level" },
  props_word:   { zh: "关键概念", en: "Key concepts" },
  mark_done_btn:{ zh: "标记为已完成", en: "Mark as complete" },
  marked_done:  { zh: "已完成", en: "Completed" },
  not_found_c:  { zh: "未找到该章节。", en: "Chapter not found." },

  /* about */
  about_kicker: { zh: "关于本站", en: "About" },
  about_q:      { zh: "为什么造这个站?", en: "Why this site?" },
  about_sub:    { zh: "把大模型讲成「实验 + 解释」,而不是论文摘要或者调包教程。", en: "Teach large models as experiment plus explanation — not paper abstracts, not copy-paste recipes." },
  about_h1: { zh: "这是什么", en: "What this is" },
  about_p1: {
    zh: "一个面向自学者的大语言模型课程,共 {M} 个模块、{C} 章,重点在微调。从注意力机制、分词与缩放定律,到预训练算力、解码与量化推理、提示与上下文工程,再到 SFT 数据构建、LoRA/QLoRA 显存账本、RLHF 与 DPO 对齐、评估与上线成本——覆盖你想搞懂「一个通用大模型怎样变成你自己任务上可用的模型」所需的全部骨架。",
    en: "A self-study course on large language models — {M} modules, {C} chapters — centred on fine-tuning. From attention, tokenization and scaling laws, through pretraining compute, decoding and quantized inference, prompting and context engineering, to SFT data curation, the LoRA/QLoRA VRAM ledger, RLHF and DPO alignment, evaluation and production cost — the full skeleton you need to understand how a general model becomes a model that works on your task.",
  },
  about_p1b: { zh: "全部内容中英双语,支持浅色/深色主题,进度保存在你自己的浏览器里,无需注册。", en: "Everything is bilingual (Chinese/English), supports light and dark themes, and keeps your progress in your own browser — no signup." },
  about_h2: { zh: "「训练场与解释」是什么意思", en: "What 'the lab & the explanation' means" },
  about_p2: {
    zh: "关于大模型的内容大多走两个极端:要么是充满求和符号、不给任何直觉的论文;要么是「三行代码微调你的模型」这类跑通即结束、一换任务就崩的教程。本站每章都拆成两半:「训练场」是一个可交互实验,你调温度、拖秩、加 epoch、改 β,就能看到后果;「解释」讲清背后的机制:为什么会这样、代价是什么、什么时候这条结论不成立。看得见的因果 + 讲得清的原理,才构成能力。",
    en: "Most material about large models runs to two extremes: papers full of summation signs offering no intuition, or 'fine-tune your model in three lines' tutorials that end the moment the script runs and collapse the moment the task changes. Every chapter here splits in two. The lab is an interactive experiment where changing temperature, rank, epochs or β shows you the consequence. The explanation covers the mechanism underneath: why it behaves this way, what it costs, and when the conclusion stops holding. Visible cause-and-effect plus clear mechanics is what capability is made of.",
  },
  about_h3: { zh: "不绑定任何框架或厂商", en: "Framework- and vendor-neutral" },
  about_p3: {
    zh: "本站不教某个具体库的 API,也不推荐特定的云平台或模型供应商。训练框架每半年换一次名字,但注意力的形状、显存的构成、过拟合的信号、偏好优化的目标函数不会变。我们讲的是这些不变量,以及它们在任何框架里都成立的算法。所有公式都给出可手算的量级估计,你可以用它检查任何工具给你的数字。",
    en: "This site teaches no library's API and endorses no cloud or model vendor. Training frameworks change names every six months, but the shape of attention, the composition of VRAM, the signature of overfitting and the objective of preference optimisation do not. What we teach are those invariants, and arithmetic that holds in any framework. Every formula comes with a hand-computable order-of-magnitude estimate you can use to sanity-check whatever number a tool hands you.",
  },
  about_h4: { zh: "如何使用", en: "How to use it" },
  about_p4: {
    zh: "按路线图学:模型基础 → 预训练 → 推理与部署 → 提示与上下文 → 微调基础 → 参数高效微调 → 对齐与偏好优化 → 评估与上线。如果你只想解决「我要微调一个模型」这一件事,可以直接从模块 V 开始,但读完模块 IV 的「RAG 还是微调」再动手,通常能省掉一整轮无用的训练。",
    en: "Follow the roadmap: foundations → pretraining → inference → prompting and context → fine-tuning foundations → parameter-efficient fine-tuning → alignment → evaluation and production. If your only goal is 'I need to fine-tune a model', start at module V — but reading module IV's 'RAG or fine-tune?' first usually saves you a whole wasted training run.",
  },
};

window.LangContext = LangContext;
window.useLangState = useLangState;
window.useLang = useLang;
window.useT = useT;
window.pick = pick;
window.other = other;
window.fmt = fmt;
window.UI = UI;
