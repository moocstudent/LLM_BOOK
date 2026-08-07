/* =========================================================
   figures2.jsx — lecture figures for lm9–lm16
   (IN3 量化 · PR1–PR3 提示/工具/RAG · FT1–FT3 微调 · PE1 LoRA)
   Primitives (FigFrame / FT / FB / FA / FAP / FBars / fpath)
   come from figures.jsx, which index.html loads first.
   ========================================================= */

/* =========================================================
   IN3 · lm9 — 量化与蒸馏
   ========================================================= */

FIGN["lm9-bits"] = ({ idx }) => {
  const L = useL();
  const line = (y, n, lab, k) => (
    <g>
      <line x1={90} y1={y} x2={470} y2={y} className="axis" />
      {Array.from({ length: n }).map((_, i) => (
        <line key={i} x1={90 + (i / (n - 1)) * 380} y1={y - 7} x2={90 + (i / (n - 1)) * 380} y2={y + 7}
          className={k === "a" ? "ln a" : "ln p"} />
      ))}
      <FT x={82} y={y + 4} c="tm" a="end">{lab}</FT>
    </g>
  );
  return (
    <FigFrame h={238} idx={idx}
      cap={L("量化就是把一段连续的权重值域压到很少的几个格子上。4 bit 只有 16 个格子,所以必须分组:每 64–128 个权重共享一组缩放系数,否则一个离群值就会把整组的分辨率吃光。",
        "Quantization squeezes a continuous range of weights onto very few slots. Four bits give sixteen, so grouping is mandatory: 64–128 weights share a scale, otherwise one outlier eats the whole group's resolution.")}>
      <FT x={16} y={24} c="tt">{L("同一段权重,三种精度", "one range of weights, three precisions")}</FT>
      {line(58, 33, "FP16", "p")}
      <FT x={488} y={62} c="tn" w={156}>{L("≈ 连续 · 2 字节/权重", "≈ continuous · 2 B/weight")}</FT>
      {line(98, 17, "INT8", "p")}
      <FT x={488} y={102} c="tn" w={156}>{L("256 级 · 1 字节", "256 levels · 1 B")}</FT>
      {line(138, 9, "INT4", "a")}
      <FT x={488} y={142} c="tn" w={156}>{L("16 级 · 0.5 字节", "16 levels · 0.5 B")}</FT>

      <FB x={90} y={172} w={126} h={40} k="m" t={L("组 1 · 64 权重", "group 1 · 64 weights")} s="scale s₁" tc="tm" />
      <FB x={222} y={172} w={126} h={40} k="m" t={L("组 2 · 64 权重", "group 2 · 64 weights")} s="scale s₂" tc="tm" />
      <FB x={354} y={172} w={126} h={40} k="a" t={L("组 3 · 有离群值", "group 3 · has an outlier")} s="scale s₃ ≫" tc="tm" />
      <FT x={496} y={188} c="tn" w={148}>{L("分组越细 → 误差越小,但 scale 本身也要存",
        "finer groups → smaller error, but the scales cost bytes too")}</FT>
      <FT x={16} y={230} c="tn" w={628}>{L("敏感度排序:代码与数学 > 长链推理 > 多语言 > 闲聊摘要。先量化,再用你的评测集量差距。",
        "Sensitivity order: code and maths > long-chain reasoning > multilingual > chat and summarisation. Quantize first, then measure the gap on your own eval set.")}</FT>
    </FigFrame>
  );
};

FIGN["lm9-ptq-qat"] = ({ idx }) => {
  const L = useL();
  return (
    <FigFrame h={206} idx={idx}
      cap={L("PTQ 事后压一遍,几十分钟就能出结果,是绝大多数场景的正确起点;QAT 在训练里就让模型适应低精度,质量更好但要重跑训练。蒸馏则是第三条路:换一个更小的模型去学大模型的输出分布。",
        "PTQ compresses after the fact — minutes of work and the right starting point for almost everyone; QAT makes the model adapt to low precision during training, better quality but a full training run. Distillation is the third road: a smaller model learns the big one's output distribution.")}>
      <FT x={16} y={24} c="tt">{L("三条压缩路径", "three compression routes")}</FT>

      <FT x={16} y={54} c="tp" w={628}>PTQ · {L("训练后量化", "post-training")}</FT>
      <FB x={16} y={62} w={110} h={36} k="m" t={L("训练好的模型", "trained model")} tc="ts" />
      <FA x1={128} y1={80} x2={152} y2={80} />
      <FB x={154} y={62} w={124} h={36} k="p" t={L("校准 128 条样本", "calibrate on ~128 samples")} tc="ts" />
      <FA x1={280} y1={80} x2={304} y2={80} />
      <FB x={306} y={62} w={104} h={36} k="p" t={L("4/8 bit 权重", "4/8-bit weights")} tc="ts" />
      <FT x={424} y={76} c="tn" w={220}>{L("几十分钟 · 无需训练", "minutes · no training")}</FT>
      <FT x={424} y={92} c="tn" w={220}>{L("典型损失 1–3%", "typical loss 1–3%")}</FT>

      <FT x={16} y={128} c="ta" w={628}>QAT · {L("量化感知训练", "quantization-aware")}</FT>
      <FB x={16} y={136} w={110} h={36} k="m" t={L("训练循环内", "inside training")} tc="ts" />
      <FA x1={128} y1={154} x2={152} y2={154} k="a" />
      <FB x={154} y={136} w={124} h={36} k="a" t={L("前向假量化", "fake-quantize forward")} tc="ts" />
      <FA x1={280} y1={154} x2={304} y2={154} k="a" />
      <FB x={306} y={136} w={104} h={36} k="a" t={L("低精度友好权重", "low-precision-friendly")} tc="ts" />
      <FT x={424} y={150} c="tn" w={220}>{L("要重跑训练 · 贵", "needs a training run · costly")}</FT>
      <FT x={424} y={166} c="tn" w={220}>{L("4 bit 以下才值得", "worth it below 4 bits")}</FT>
      <FT x={16} y={196} c="tn" w={628}>{L("蒸馏:大模型出 soft label,小模型学分布——省的是参数,不是精度。",
        "Distillation: the big model emits soft labels and a small one fits the distribution — it saves parameters, not precision.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   PR1 · lm10 — 提示工程
   ========================================================= */

FIGN["lm10-anatomy"] = ({ idx }) => {
  const L = useL();
  const parts = [
    { t: L("任务说明", "task instruction"), n: L("动词 + 对象 + 约束", "verb + object + constraint"), lev: 1.0 },
    { t: L("输出格式", "output format"), n: L("给 schema,不要给形容词", "give a schema, not adjectives"), lev: 0.88 },
    { t: L("上下文材料", "context material"), n: L("放最相关的,别全塞", "the relevant part, not everything"), lev: 0.7 },
    { t: L("少样本示例", "few-shot examples"), n: L("2–5 条,覆盖边界情况", "2–5, covering edge cases"), lev: 0.45 },
    { t: L("角色设定", "persona"), n: L("杠杆最小,常被高估", "the least leverage, most overrated"), lev: 0.16 },
  ];
  return (
    <FigFrame h={252} idx={idx}
      cap={L("提示里的五个成分杠杆差得很远。把时间花在把任务说清楚、把输出格式钉死上;「你是一位资深专家」这类角色设定的收益,在现代模型上已经接近噪声。",
        "The five ingredients of a prompt have wildly different leverage. Spend the time on stating the task precisely and nailing the output format; on modern models the payoff from \"you are a senior expert\" personas is close to noise.")}>
      <FT x={16} y={24} c="tt">{L("按杠杆排序的五个成分", "five ingredients, ordered by leverage")}</FT>
      <FT x={430} y={24} c="tn">{L("相对收益", "relative payoff")}</FT>
      {parts.map((p, i) => {
        const y = 44 + i * 40;
        return (
          <g key={i}>
            <FB x={16} y={y} w={200} h={32} k={i < 2 ? "a" : i < 4 ? "p" : "m"} t={p.t} tc="t" />
            <FT x={226} y={y + 20} c="tn">{p.n}</FT>
            <rect x={430} y={y + 9} width={190} height={14} rx={2} className="fm" fillOpacity={0.3} />
            <rect x={430} y={y + 9} width={190 * p.lev} height={14} rx={2}
              className={i < 2 ? "fa" : "fp"} fillOpacity={0.9} />
          </g>
        );
      })}
      <FT x={16} y={238} c="tn" w={628}>{L("先把 20 个失败样例摆出来,再改提示;凭感觉改提示是提示工程里最贵的习惯。",
        "Lay out 20 failing cases before editing the prompt; editing by feel is the most expensive habit in prompt engineering.")}</FT>
    </FigFrame>
  );
};

FIGN["lm10-cot"] = ({ idx }) => {
  const L = useL();
  return (
    <FigFrame h={214} idx={idx}
      cap={L("思维链的作用是让模型把中间结果写进上下文,于是后面的步骤可以读取它——本质是拿 token 换计算深度。所以它只在多步任务上有收益,在分类、抽取这类一步任务上纯属浪费。",
        "Chain-of-thought works by writing intermediate results into the context so later steps can read them — it trades tokens for computational depth. That is why it pays off on multi-step tasks and is pure waste on one-step ones like classification or extraction.")}>
      <FT x={16} y={24} c="tt">{L("思维链 = 用 token 换深度", "chain-of-thought = tokens bought with depth")}</FT>

      <FT x={16} y={56} c="tm" w={628}>{L("直接回答", "direct")}</FT>
      <FB x={16} y={64} w={112} h={38} k="m" t={L("问题", "question")} tc="ts" />
      <FA x1={130} y1={83} x2={182} y2={83} />
      <FB x={184} y={64} w={112} h={38} k="a" t={L("答案(常错)", "answer (often wrong)")} tc="ts" />
      <FT x={310} y={78} c="tn" w={334}>{L("一次前向 · 没有中间状态可写", "one pass · nowhere to store intermediates")}</FT>
      <FT x={310} y={94} c="tn" w={334}>{L("多步算术、推理题几乎必错", "multi-step arithmetic and reasoning fail")}</FT>

      <FT x={16} y={134} c="tp" w={628}>{L("逐步推理", "step by step")}</FT>
      {[L("拆解", "decompose"), L("中间量", "intermediate"), L("检查", "check"), L("答案", "answer")].map((t, i) => (
        <g key={i}>
          <FB x={16 + i * 104} y={142} w={92} h={38} k={i === 3 ? "p" : "m"} t={t} tc="ts" />
          {i < 3 && <FA x1={110 + i * 104} y1={161} x2={116 + i * 104} y2={161} k="p" />}
        </g>
      ))}
      <FT x={444} y={150} c="tn" w={200}>{L("每一步都写回上下文;代价是延迟与 token 数上升",
        "each step is written back into context — at the cost of latency and tokens")}</FT>
      <FT x={16} y={202} c="tn" w={628}>{L("判断标准:这道题人类需要打草稿吗?需要就用 CoT,不需要就别用。",
        "The test: would a human need scratch paper? If yes, use CoT; if not, don't.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   PR2 · lm11 — 工具调用
   ========================================================= */

FIGN["lm11-loop"] = ({ idx }) => {
  const L = useL();
  return (
    <FigFrame h={248} idx={idx}
      cap={L("工具调用是一个循环,不是一次请求:模型产生调用 → 你的代码执行 → 观测结果写回上下文 → 模型决定继续还是收尾。你必须显式限制轮数和总耗时,否则循环不会自己停。",
        "Tool calling is a loop, not a request: the model emits a call, your code executes it, the observation is written back into the context, and the model decides whether to continue or finish. You must cap turns and wall-clock time explicitly — the loop will not stop itself.")}>
      <FT x={16} y={24} c="tt">{L("工具调用循环", "the tool-calling loop")}</FT>

      <FB x={20} y={92} w={110} h={52} k="m" t={L("用户请求", "user request")} tc="ts" />
      <FA x1={132} y1={118} x2={164} y2={118} />
      <FB x={166} y={82} w={124} h={72} k="p" t={L("模型", "model")} s={L("决定:调用还是回答", "decide: call or answer")} tc="tt" />
      <FA x1={292} y1={104} x2={340} y2={104} />
      <FT x={316} y={96} c="tn" a="middle">{L("调用", "call")}</FT>
      <FB x={342} y={82} w={124} h={44} k="a" t={L("你的代码执行工具", "your code runs the tool")} tc="ts" />
      <FA x1={468} y1={104} x2={510} y2={104} k="a" />
      <FB x={512} y={82} w={124} h={44} k="m" t={L("观测结果", "observation")} tc="ts" />

      <FAP d="M574 128 C574 194 300 210 228 176 L228 158" k="a" />
      <FT x={400} y={208} c="ta" a="middle">{L("结果写回上下文,进入下一轮", "the result is appended to the context — next turn")}</FT>

      <FA x1={228} y1={78} x2={228} y2={58} k="p" />
      <FB x={150} y={30} w={156} h={28} k="p" t={L("最终回答", "final answer")} tc="ts" />
      <FT x={318} y={48} c="tn" w={326}>{L("模型判断信息已足够时才走这条边", "taken only when the model judges it has enough")}</FT>

      <FT x={16} y={236} c="tn" w={628}>{L("硬性护栏:最大轮数、总超时、每个工具的重试上限、以及一份可回放的轨迹日志。",
        "Hard guardrails: max turns, total timeout, a retry cap per tool, and a replayable trace log.")}</FT>
    </FigFrame>
  );
};

FIGN["lm11-fails"] = ({ idx }) => {
  const L = useL();
  const cards = [
    { t: L("幻觉参数", "hallucinated arguments"), n: L("填了不存在的 id / 枚举值", "invents ids or enum values"), f: L("→ 服务端校验 + 明确报错回灌", "→ validate server-side, feed the error back") },
    { t: L("该调不调", "should have called"), n: L("凭记忆答了实时问题", "answers a live question from memory"), f: L("→ 系统提示写死触发条件", "→ pin the trigger condition in the system prompt") },
    { t: L("死循环", "infinite loop"), n: L("反复调同一个工具", "calls the same tool forever"), f: L("→ 轮数上限 + 重复检测", "→ turn cap + repeat detection") },
    { t: L("忽略错误", "ignores the error"), n: L("拿到报错仍继续编", "keeps fabricating after a failure"), f: L("→ 错误信息要可读、要带修复建议", "→ make errors readable and actionable") },
  ];
  return (
    <FigFrame h={206} idx={idx}
      cap={L("四类失败模式各有各的防线,而且防线几乎都在你的代码里而不是提示里:schema 校验、轮数上限、可读的错误回灌。提示只能降低概率,工程才能设上界。",
        "Each failure mode has its own defence, and nearly all of them live in your code rather than the prompt: schema validation, turn caps, readable errors fed back. A prompt lowers the probability; engineering sets the bound.")}>
      <FT x={16} y={24} c="tt">{L("四类失败模式与对应防线", "four failure modes and their defences")}</FT>
      {cards.map((c, i) => (
        <g key={i}>
          <rect x={16 + i * 160} y={40} width={148} height={124} rx={3} className="bx m" />
          <rect x={16 + i * 160} y={40} width={148} height={4} rx={2} className="fa" />
          <FT x={90 + i * 160} y={70} c="tk" a="middle" w={138}>{c.t}</FT>
          <FT x={90 + i * 160} y={98} c="tn" a="middle" w={138}>{c.n}</FT>
          <FT x={90 + i * 160} y={134} c="tp" a="middle" w={138}>{c.f}</FT>
        </g>
      ))}
      <FT x={16} y={190} c="tn" w={628}>{L("可靠性分三级:自然语言 → JSON schema 约束 → 约束解码。能上一级就上一级。",
        "Three tiers of reliability: free text → JSON-schema constrained → constrained decoding. Climb as high as your stack allows.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   PR3 · lm12 — RAG vs 微调
   ========================================================= */

FIGN["lm12-matrix"] = ({ idx }) => {
  const L = useL();
  const cells = [
    { x: 0, y: 0, t: L("提示工程", "prompt engineering"), n: L("行为稳定 · 知识静态", "stable behaviour · static knowledge"), k: "m" },
    { x: 1, y: 0, t: "RAG", n: L("知识会变、要引用、要溯源", "knowledge changes · needs citation"), k: "p" },
    { x: 0, y: 1, t: L("微调", "fine-tuning"), n: L("固定格式、语气、领域套路", "fixed format, tone, domain habits"), k: "a" },
    { x: 1, y: 1, t: L("两个都要", "both"), n: L("绝大多数真实产品在这一格", "where most real products land"), k: "a" },
  ];
  return (
    <FigFrame h={252} idx={idx}
      cap={L("唯一有用的分界线是「缺知识还是缺行为」。知识会过期、要溯源,就用检索;行为要稳定、要省 token,就用微调。真实产品几乎总是落在右下角:检索取事实,微调定形式。",
        "The only useful boundary is knowledge versus behaviour. Knowledge that expires or needs citation calls for retrieval; behaviour that must be stable and cheap in tokens calls for fine-tuning. Real products almost always land bottom-right: retrieve the facts, fine-tune the form.")}>
      <FT x={16} y={24} c="tt">{L("缺的是知识,还是行为?", "is it knowledge you lack, or behaviour?")}</FT>
      {cells.map((c, i) => (
        <g key={i}>
          <rect x={120 + c.x * 250} y={54 + c.y * 88} width={240} height={80} rx={3} className={`bx ${c.k}`} />
          <FT x={240 + c.x * 250} y={90 + c.y * 88} c="tt" a="middle">{c.t}</FT>
          <FT x={240 + c.x * 250} y={112 + c.y * 88} c="tn" a="middle">{c.n}</FT>
        </g>
      ))}
      <FT x={240} y={44} c="tm" a="middle">{L("知识静态", "knowledge static")}</FT>
      <FT x={490} y={44} c="tm" a="middle">{L("知识会变", "knowledge moves")}</FT>
      <FT x={112} y={94} c="tm" a="end">{L("行为默认", "default behaviour")}</FT>
      <FT x={112} y={182} c="tm" a="end" w={104}>{L("行为要改", "behaviour must change")}</FT>
      <FT x={16} y={216} c="ta" w={628}>{L("微调注入知识为什么危险:一条事实要几十上百个样本才记得住,改一次要重训,而且模型不会说「我不知道」——它会用同样的语气编。微调也修不了的三类:模型压根没有的能力、需要实时数据的问题、需要可验证引用的场景。",
        "Why injecting knowledge by fine-tuning is dangerous: one fact needs dozens of examples to stick, any change means retraining, and the model never says \"I don't know\" — it fabricates in the same confident tone. Nor can fine-tuning fix capability the model never had, questions needing live data, or answers needing verifiable citations.")}</FT>
    </FigFrame>
  );
};

FIGN["lm12-hybrid"] = ({ idx }) => {
  const L = useL();
  return (
    <FigFrame h={200} idx={idx}
      cap={L("混合方案的分工非常干净:检索负责「说什么」,微调负责「怎么说」。知识更新只动索引不动权重,格式或语气要改才重训适配器。",
        "The hybrid splits the job cleanly: retrieval decides what is said, fine-tuning decides how. Updating knowledge touches the index only; retraining an adapter happens only when the format or tone must change.")}>
      <FT x={16} y={24} c="tt">{L("最常见的正确答案:检索取事实,微调定形式", "the commonest right answer: retrieve facts, fine-tune form")}</FT>

      <FB x={16} y={72} w={96} h={44} k="m" t={L("用户问题", "user question")} tc="ts" />
      <FA x1={114} y1={94} x2={142} y2={94} />
      <FB x={144} y={72} w={110} h={44} k="p" t={L("检索器", "retriever")} s={L("向量 + 关键词", "vector + keyword")} tc="ts" />
      <FA x1={256} y1={94} x2={284} y2={94} />
      <FB x={286} y={72} w={110} h={44} k="p" t={L("Top-k 片段", "top-k passages")} s={L("带来源", "with sources")} tc="ts" />
      <FA x1={398} y1={94} x2={426} y2={94} />
      <FB x={428} y={62} w={124} h={64} k="a" t={L("微调过的模型", "fine-tuned model")} s={L("格式 / 语气 / 领域套路", "format · tone · domain habits")} tc="tt" />
      <FA x1={554} y1={94} x2={582} y2={94} k="a" />
      <FB x={584} y={72} w={60} h={44} k="a" t={L("回答", "answer")} tc="ts" />

      <FB x={144} y={140} w={252} h={30} k="g" t={L("知识层:改索引即可,不动权重", "knowledge layer: edit the index, never the weights")} tc="tn" />
      <FB x={428} y={140} w={216} h={30} k="g" t={L("行为层:改行为才重训适配器", "behaviour layer: retrain the adapter only for behaviour")} tc="tn" />
      <FT x={16} y={190} c="tn" w={628}>{L("先做 RAG 基线,再判断微调是否还有增量——顺序反了会白花很多钱。",
        "Build the RAG baseline first, then ask whether fine-tuning still adds anything — the reverse order wastes a lot of money.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   FT1 · lm13 — 微调基础
   ========================================================= */

FIGN["lm13-delta"] = ({ idx }) => {
  const L = useL();
  return (
    <FigFrame h={226} idx={idx}
      cap={L("微调不是往模型里「加知识」,而是在已有权重上叠一个很小的位移,把已经存在的能力重新加权。所以它擅长改格式、语气、任务套路,不擅长塞进模型从没见过的事实。",
        "Fine-tuning does not add knowledge; it lays a small displacement over existing weights and re-weights capabilities the model already has. Hence it excels at format, tone and task habits, and is poor at inserting facts the model never saw.")}>
      <FT x={16} y={24} c="tt">{L("W′ = W + ΔW,而 ΔW 很小", "W′ = W + ΔW, and ΔW is tiny")}</FT>

      <FT x={16} y={58} c="tm" w={628}>{L("预训练权重 W", "pretrained W")}</FT>
      {Array.from({ length: 24 }).map((_, i) => (
        <rect key={i} x={16 + i * 25} y={68} width={21} height={40} className="fp"
          fillOpacity={0.25 + ((i * 37) % 11) / 22} />
      ))}
      <FT x={16} y={124} c="tn" w={628}>{L("几十亿个数,编码了语言、世界知识、推理套路", "billions of numbers encoding language, world knowledge, reasoning habits")}</FT>

      <FT x={16} y={158} c="ta" w={628}>{L("微调位移 ΔW", "fine-tuning ΔW")}</FT>
      {Array.from({ length: 24 }).map((_, i) => (
        <rect key={i} x={16 + i * 25} y={166} width={21} height={20} className="fa"
          fillOpacity={0.15 + ((i * 53) % 7) / 20} />
      ))}
      <FT x={16} y={202} c="tn" w={628}>{L("范数通常只有 W 的百分之几 —— 下一章 LoRA 正是押注它还是低秩的。",
        "Its norm is typically a few percent of W — and LoRA, next chapter, bets that it is also low-rank.")}</FT>
      <FT x={628} y={92} c="tn" a="end">{L("← 24 层示意", "← 24 layers, schematic")}</FT>
    </FigFrame>
  );
};

FIGN["lm13-forget"] = ({ idx }) => {
  const L = useL();
  const X = (u) => 70 + u * 500;
  const Y = (v) => 176 - v * 122;
  const task = (u) => 0.18 + 0.72 * (1 - Math.exp(-4.2 * u));
  const gen = (u) => 0.92 - 0.62 * Math.pow(u, 1.9);
  return (
    <FigFrame h={240} idx={idx}
      cap={L("目标任务的分数很快涨上去,通用能力却在同一根轴上悄悄掉下来——这就是灾难性遗忘。它不会出现在你的训练曲线里,只有保留一组「与任务无关」的评测题才看得见。",
        "The target task climbs quickly while general ability quietly falls along the same axis — that is catastrophic forgetting. It never shows up in your training curve; only a held-out set of task-irrelevant evals reveals it.")}>
      <FT x={16} y={24} c="tt">{L("灾难性遗忘:两条反向的曲线", "catastrophic forgetting: two curves in opposition")}</FT>
      <line x1={70} y1={176} x2={594} y2={176} className="axis" />
      <line x1={70} y1={44} x2={70} y2={176} className="axis" />
      <FT x={330} y={210} c="tn" a="middle">{L("训练步数 / 轮数", "training steps / epochs")}</FT>
      <FT x={16} y={42} c="tn" w={628}>{L("能力", "ability")}</FT>

      <rect x={X(0.22)} y={44} width={X(0.42) - X(0.22)} height={132} className="areap" />
      <FT x={X(0.32)} y={62} c="tp" a="middle">{L("可用区间", "the usable window")}</FT>

      <polyline className="cv" points={fpath(61, (i) => X(i / 60), (i) => Y(task(i / 60)))} />
      <polyline className="cv a" points={fpath(61, (i) => X(i / 60), (i) => Y(gen(i / 60)))} />
      <FT x={X(0.62)} y={Y(task(0.62)) - 10} c="tp">{L("目标任务分数 ↑", "target-task score ↑")}</FT>
      <FT x={X(0.62)} y={Y(gen(0.62)) + 18} c="ta">{L("通用能力 ↓(遗忘)", "general ability ↓ (forgetting)")}</FT>
      <FT x={16} y={230} c="tn" w={628}>{L("缓解手段:更低学习率、更少轮数、LoRA(不动原权重)、混入 5–15% 通用数据。",
        "Mitigations: lower LR, fewer epochs, LoRA (base weights untouched), and mixing in 5–15% general data.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   FT2 · lm14 — SFT 数据
   ========================================================= */

FIGN["lm14-quality"] = ({ idx }) => {
  const L = useL();
  const axis = (i, lab, good, bad) => {
    const y = 62 + i * 52;
    return (
      <g>
        <FT x={16} y={y + 5} c="tk">{lab}</FT>
        <line x1={150} y1={y} x2={560} y2={y} className="axis" />
        <FT x={150} y={y + 20} c="tn">{bad}</FT>
        <FT x={560} y={y + 20} c="tn" a="end">{good}</FT>
        <circle cx={210} cy={y} r={6} className="fm" fillOpacity={0.8} />
        <circle cx={498} cy={y} r={6} className="fa" />
      </g>
    );
  };
  return (
    <FigFrame h={244} idx={idx}
      cap={L("SFT 数据的三个维度里,一致性最重要:一千条风格统一的样本,胜过一万条彼此打架的样本。模型学的是「这种输入对应这种输出」这个映射,矛盾的样本直接互相抵消。",
        "Of the three dimensions of SFT data, consistency matters most: a thousand stylistically uniform examples beat ten thousand that contradict each other. The model learns a mapping, and contradictory examples simply cancel out.")}>
      <FT x={16} y={24} c="tt">{L("三个质量维度(灰点=常见现状,橙点=目标)", "three quality dimensions (grey = typical, orange = target)")}</FT>
      {axis(0, L("一致性", "consistency"), L("同类输入 → 同种格式与语气", "same input class → same format and tone"), L("每条各写各的", "every example its own style"))}
      {axis(1, L("多样性", "diversity"), L("覆盖真实分布与边界", "covers the real distribution and edges"), L("全是同一种问法", "one phrasing repeated"))}
      {axis(2, L("难度", "difficulty"), L("含模型现在做不好的样本", "includes what the model gets wrong today"), L("全是模型已经会的", "all things it already does"))}
      <FT x={16} y={228} c="tn" w={628}>{L("必须清掉的四类:与任务无关、答案本身错误、风格自相矛盾、以及从更弱模型生成又没人工校对的样本。",
        "Four kinds to purge: off-task, factually wrong, stylistically contradictory, and generated by a weaker model without human review.")}</FT>
    </FigFrame>
  );
};

FIGN["lm14-logcurve"] = ({ idx }) => {
  const L = useL();
  const marks = [50, 500, 5000, 50000];
  const X = (n) => 74 + (Math.log10(n) - 1.4) / (5.0 - 1.4) * 500;
  const Y = (v) => 176 - v * 122;
  const perf = (n) => 0.16 + 0.2 * (Math.log10(n) - 1.4);
  return (
    <FigFrame h={238} idx={idx}
      cap={L("质量随样本量的对数增长,不是随样本量增长:50 → 500 条是质变,5,000 → 50,000 条往往只剩几个点。所以先做 500 条高质量样本跑完整条链路,再决定要不要扩。",
        "Quality grows with the logarithm of the sample count, not the count: 50 → 500 is transformative, 5,000 → 50,000 often buys a few points. So build 500 good examples, run the whole loop, and only then decide whether to scale.")}>
      <FT x={16} y={24} c="tt">{L("回报随对数增长", "returns are logarithmic")}</FT>
      <line x1={70} y1={176} x2={600} y2={176} className="axis" />
      <line x1={70} y1={44} x2={70} y2={176} className="axis" />
      <FT x={330} y={212} c="tn" a="middle">{L("样本数(对数轴)", "examples (log scale)")}</FT>
      <FT x={16} y={42} c="tn" w={628}>{L("任务质量", "task quality")}</FT>

      <polyline className="cv" points={fpath(61, (i) => 74 + (i / 60) * 500, (i) => Y(perf(Math.pow(10, 1.4 + (i / 60) * 3.6))))} />
      {marks.map((m, i) => (
        <g key={m}>
          <line x1={X(m)} y1={44} x2={X(m)} y2={176} className="grid" />
          <circle cx={X(m)} cy={Y(perf(m))} r={4.5} className="fa" />
          <FT x={X(m)} y={192} c="tn" a="middle">{m.toLocaleString("en-US")}</FT>
        </g>
      ))}
      <FT x={X(50) + 8} y={Y(perf(50)) + 22} c="tn">{L("能看出方向", "shows a direction")}</FT>
      <FT x={X(500) + 8} y={Y(perf(500)) - 10} c="ta">{L("多数任务的甜点", "the sweet spot for most tasks")}</FT>
      <FT x={X(50000) - 8} y={Y(perf(50000)) - 12} c="tn" a="end">{L("收益已经很薄", "returns are thin here")}</FT>
      <FT x={16} y={228} c="tn" w={628}>{L("横轴每前进一格是 10 倍标注成本,纵轴只涨一个固定增量——这就是为什么数据清洗比数据扩充划算。",
        "Each step right is 10× the labelling cost for one fixed step up — which is why cleaning beats collecting.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   FT3 · lm15 — 超参
   ========================================================= */

FIGN["lm15-three"] = ({ idx }) => {
  const L = useL();
  const dial = (x0, name, lo, hi, ok, note) => (
    <g>
      <FB x={x0} y={44} w={196} h={26} k="p" t={name} tc="tm" />
      <line x1={x0 + 16} y1={104} x2={x0 + 180} y2={104} className="axis" />
      <rect x={x0 + 70} y={96} width={56} height={16} rx={2} className="fa" fillOpacity={0.85} />
      <FT x={x0 + 98} y={90} c="ta" a="middle">{ok}</FT>
      <FT x={x0 + 16} y={126} c="tn">{lo}</FT>
      <FT x={x0 + 180} y={126} c="tn" a="end">{hi}</FT>
      <FT x={x0 + 98} y={158} c="tn" a="middle">{note}</FT>
    </g>
  );
  return (
    <FigFrame h={228} idx={idx}
      cap={L("真正重要的超参只有三个,而且都是「两头都错、中间有一段对」的形状。学习率是其中最敏感的:全参微调比预训练低一到两个数量级,LoRA 反而要高一个数量级。",
        "Only three hyperparameters really matter, and each has the same shape: wrong at both ends, right in a band. The learning rate is the most sensitive — full fine-tuning wants one or two orders of magnitude below pretraining, while LoRA wants one order above.")}>
      <FT x={16} y={24} c="tt">{L("三个旋钮,三段可用区间", "three dials, three usable bands")}</FT>
      {dial(16, L("学习率", "learning rate"), L("学不动", "nothing moves"), L("发散 / 遗忘", "diverges"),
        L("1e-5 全参 · 1e-4 LoRA", "1e-5 full · 1e-4 LoRA"), L("最敏感,先调它", "most sensitive — tune first"))}
      {dial(232, L("轮数 epochs", "epochs"), L("欠拟合", "underfit"), L("背诵训练集", "memorises the set"),
        "2 – 3", L("小数据集尤其容易过", "small sets overfit fastest"))}
      {dial(448, L("有效批量", "effective batch"), L("噪声大", "noisy"), L("步数太少", "too few steps"),
        "16 – 64", L("靠梯度累积凑", "reached via accumulation"))}
      <FT x={16} y={196} c="tn" w={628}>{L("起点配置:LoRA r=16 α=32,lr 1e-4,2 轮,batch 32,warmup 3%,余下的时间花在数据上。每次只改一个,并且每次都跑同一套评测——否则你分不清是谁的功劳。",
        "A starting point: LoRA r=16 α=32, lr 1e-4, 2 epochs, batch 32, 3% warm-up — then spend the rest of your time on the data. Change one at a time and run the same eval every time, or you cannot tell what helped.")}</FT>
    </FigFrame>
  );
};

FIGN["lm15-degrade"] = ({ idx }) => {
  const L = useL();
  const panel = (x0, title, tr, va, note, tone) => {
    const X = (u) => x0 + 44 + u * 226;
    const Y = (v) => 168 - v * 96;
    return (
      <g>
        <FB x={x0} y={42} w={292} h={26} k={tone} t={title} tc="tm" />
        <line x1={x0 + 42} y1={168} x2={x0 + 278} y2={168} className="axis" />
        <line x1={x0 + 42} y1={78} x2={x0 + 42} y2={168} className="axis" />
        <polyline className="cv" points={fpath(41, (i) => X(i / 40), (i) => Y(tr(i / 40)))} />
        <polyline className="cv a" points={fpath(41, (i) => X(i / 40), (i) => Y(va(i / 40)))} />
        <FT x={x0 + 146} y={192} c="tn" a="middle">{note}</FT>
      </g>
    );
  };
  return (
    <FigFrame h={236} idx={idx}
      cap={L("两种退化长得完全不一样:欠拟合是两条线一起停在高位,过拟合是训练继续降而验证掉头向上。看错了就会把加轮数用在本该加数据的地方。",
        "The two degradations look nothing alike: underfitting leaves both lines stalled high, overfitting has train still falling while validation turns up. Misread it and you add epochs where you needed data.")}>
      <FT x={16} y={24} c="tt">{L("欠拟合 vs 过拟合", "underfitting vs overfitting")}</FT>
      {panel(16, L("欠拟合:两条线都下不去", "underfit: neither line drops"),
        (u) => 0.86 - 0.18 * u, (u) => 0.9 - 0.15 * u,
        L("→ 加学习率 / 加轮数 / 加数据量", "→ raise LR, add epochs, add data"), "m")}
      {panel(352, L("过拟合:验证掉头", "overfit: validation turns up"),
        (u) => 0.86 - 0.72 * Math.pow(u, 0.7), (u) => 0.7 - 0.34 * Math.min(u / 0.35, 1) + 0.5 * Math.max(0, u - 0.4),
        L("→ 减轮数 / 早停 / 加数据多样性", "→ fewer epochs, early stop, more diverse data"), "a")}
      <FT x={16} y={224} c="tn" w={628}>{L("实线 = 训练损失,橙线 = 验证损失;停手的依据永远是橙线的最低点。",
        "Solid = training loss, orange = validation loss; the stopping point is always the orange minimum.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   PE1 · lm16 — LoRA
   ========================================================= */

FIGN["lm16-lowrank"] = ({ idx }) => {
  const L = useL();
  return (
    <FigFrame h={244} idx={idx}
      cap={L("LoRA 押的注是:微调带来的位移 ΔW 本身是低秩的,所以可以写成两个瘦矩阵的乘积。d=4096、r=16 时,4096² ≈ 1,678 万个参数被 2×4096×16 ≈ 13 万个取代,只有 0.78%。",
        "LoRA's bet is that the fine-tuning displacement ΔW is itself low-rank, so it factorises into two thin matrices. At d=4096, r=16, the 4096² ≈ 16.8M parameters are replaced by 2×4096×16 ≈ 131k — 0.78% of them.")}>
      <FT x={16} y={24} c="tt">{L("ΔW = B · A,秩 r 决定一切", "ΔW = B · A, and r decides everything")}</FT>

      <rect x={40} y={54} width={140} height={140} rx={2} className="bx m" />
      <FT x={110} y={118} c="tt" a="middle">W</FT>
      <FT x={110} y={138} c="tn" a="middle">d × d</FT>
      <FT x={110} y={212} c="tn" a="middle">{L("冻结 · 一个字节都不改", "frozen · never touched")}</FT>

      <FT x={200} y={130} c="tt" a="middle">+</FT>

      <rect x={222} y={54} width={34} height={140} rx={2} className="bx a" />
      <FT x={239} y={128} c="tk" a="middle">B</FT>
      <FT x={239} y={212} c="tn" a="middle">d × r</FT>
      <FT x={276} y={130} c="tt" a="middle">·</FT>
      <rect x={296} y={54} width={140} height={34} rx={2} className="bx a" />
      <FT x={366} y={76} c="tk" a="middle">A</FT>
      <FT x={366} y={104} c="tn" a="middle">r × d</FT>

      <FT x={470} y={70} c="tk" w={174}>d = 4096, r = 16</FT>
      <rect x={470} y={82} width={158} height={16} rx={2} className="fm" fillOpacity={0.35} />
      <rect x={470} y={82} width={158} height={16} rx={2} className="fp" fillOpacity={0.9} />
      <FT x={470} y={114} c="tn" w={174}>{L("全参 W:16,777,216", "full W: 16,777,216")}</FT>
      <rect x={470} y={124} width={158} height={16} rx={2} className="fm" fillOpacity={0.35} />
      <rect x={470} y={124} width={1.3} height={16} rx={1} className="fa" />
      <FT x={470} y={156} c="ta" w={174}>{L("LoRA:131,072(0.78%)", "LoRA: 131,072 (0.78%)")}</FT>
      <FT x={470} y={178} c="tn" w={174}>{L("参数量对 r 严格线性:", "strictly linear in r:")}</FT>
      <FT x={470} y={194} c="tk" w={174}>{L("2 · d · r · 模块数", "2 · d · r · n_modules")}</FT>
      <FT x={470} y={214} c="tn" w={174}>{L("r 翻倍 → 参数翻倍", "double r → double params")}</FT>
    </FigFrame>
  );
};

FIGN["lm16-alpha"] = ({ idx }) => {
  const L = useL();
  return (
    <FigFrame h={202} idx={idx}
      cap={L("实际生效的不是 r 本身,而是 α/r 这个缩放系数:前向计算里加的是 (α/r)·B·A·x。所以调大 r 却不动 α,等于同时把每一步的更新幅度调小了——两个参数必须一起看。",
        "What actually takes effect is not r but the ratio α/r: the forward pass adds (α/r)·B·A·x. So raising r without touching α silently shrinks the update magnitude — the two must be read together.")}>
      <FT x={16} y={24} c="tt">{L("α 与 r 必须一起调", "α and r must move together")}</FT>
      <FT x={16} y={52} c="tk" w={628}>h = W·x + (α / r) · B · A · x</FT>

      {[
        { r: 8, a: 16, s: "2.0", n: L("常用起点", "the usual starting point") },
        { r: 16, a: 32, s: "2.0", n: L("同样的缩放,容量更大", "same scaling, more capacity") },
        { r: 64, a: 32, s: "0.5", n: L("容量大了,幅度反而变小", "more capacity, smaller steps") },
        { r: 64, a: 128, s: "2.0", n: L("容量与幅度都跟上", "capacity and magnitude both scale") },
      ].map((row, i) => (
        <g key={i}>
          <FB x={16} y={72 + i * 30} w={70} h={24} k="m" t={`r = ${row.r}`} tc="tm" />
          <FB x={92} y={72 + i * 30} w={78} h={24} k="m" t={`α = ${row.a}`} tc="tm" />
          <FB x={176} y={72 + i * 30} w={86} h={24} k={row.s === "2.0" ? "p" : "a"} t={`α/r = ${row.s}`} tc="tm" />
          <rect x={272} y={78 + i * 30} width={parseFloat(row.s) * 60} height={12} rx={2}
            className={row.s === "2.0" ? "fp" : "fa"} fillOpacity={0.85} />
          <FT x={404} y={89 + i * 30} c="tn">{row.n}</FT>
        </g>
      ))}
      <FT x={16} y={192} c="tn" w={628}>{L("经验:先固定 α = 2r,只调 r;确认容量不够再单独抬 α。", "Rule of thumb: fix α = 2r and tune r alone; raise α separately only once capacity is proven short.")}</FT>
    </FigFrame>
  );
};

FIGN["lm16-modules"] = ({ idx }) => {
  const L = useL();
  const mod = (x, y, w, name, on, note) => (
    <g>
      <rect x={x} y={y} width={w} height={40} rx={3} className={on ? "bx a" : "bx m"} />
      <FT x={x + w / 2} y={y + 18} c="tk" a="middle">{name}</FT>
      <FT x={x + w / 2} y={y + 32} c="tn" a="middle">{note}</FT>
    </g>
  );
  return (
    <FigFrame h={232} idx={idx}
      cap={L("最早的做法只给 q 和 v 加适配器;后来发现把 4 个注意力投影全加上,再加上 MLP,收益明显更好——代价是参数量翻好几倍。MLP 存着大部分「知识」,所以任务越偏离原领域,越该带上它。",
        "The earliest recipe adapted only q and v; adapting all four attention projections plus the MLP turned out clearly better — at several times the parameters. The MLP holds most of the knowledge, so the further your task drifts from the base domain, the more it needs to be included.")}>
      <FT x={16} y={24} c="tt">{L("该给哪些模块加适配器", "which modules to adapt")}</FT>
      <rect x={16} y={44} width={400} height={132} rx={3} className="bx g" />
      <FT x={28} y={62} c="tn" w={616}>{L("一个 Transformer block", "one Transformer block")}</FT>
      {mod(30, 72, 84, "q_proj", true, L("必加", "always"))}
      {mod(122, 72, 84, "k_proj", true, L("推荐", "recommended"))}
      {mod(214, 72, 84, "v_proj", true, L("必加", "always"))}
      {mod(306, 72, 84, "o_proj", true, L("推荐", "recommended"))}
      {mod(30, 124, 176, L("MLP 上投影", "MLP up-proj"), true, L("知识主要在这里", "most knowledge lives here"))}
      {mod(214, 124, 176, L("MLP 下投影", "MLP down-proj"), true, L("同上", "same"))}

      <FT x={434} y={62} c="tk" w={210}>{L("覆盖范围 → 参数量", "coverage → parameters")}</FT>
      {[
        { n: "q, v", p: 0.22, t: L("最省,弱任务够用", "cheapest, fine for light tasks") },
        { n: "q, k, v, o", p: 0.45, t: L("默认推荐", "the default recommendation") },
        { n: L("全部 + MLP", "all + MLP"), p: 1.0, t: L("跨领域时才值", "worth it when the domain shifts") },
      ].map((r, i) => (
        <g key={i}>
          <FT x={434} y={88 + i * 40} c="tk">{r.n}</FT>
          <rect x={434} y={94 + i * 40} width={190 * r.p} height={10} rx={2} className="fa" fillOpacity={0.85} />
          <FT x={434} y={118 + i * 40} c="tn" w={192}>{r.t}</FT>
        </g>
      ))}
      <FT x={16} y={232} c="tn" w={628}>{L("LoRA 的局限:它改的是行为分布,注入大量新知识、或需要真正改变模型内部表征时,全参微调仍然更强。",
        "LoRA's limit: it reshapes behaviour. When large amounts of new knowledge or genuine representational change are needed, full fine-tuning is still stronger.")}</FT>
    </FigFrame>
  );
};
