/* =========================================================
   viz2.jsx — interactive experiments for L4 (prompting) and
   L5–L6 (fine-tuning foundations + PEFT).
   ---------------------------------------------------------
   Depends on the shared helpers defined in viz.jsx
   (useL / Slider / Choice / Seg / Kpi / Bar / VizHead /
    LinePlot / Legend / clamp / nf / pct / big / gb).
   index.html loads viz.jsx → viz2.jsx → viz3.jsx.
   ========================================================= */

/* =========================================================
   PR1 · promptLab — which prompt ingredients actually pay
   ========================================================= */
const PROMPT_PARTS = [
  { k: "task", zh: "明确任务描述", en: "Explicit task statement", acc: 0.18, cons: 0.10, tok: 40,
    why: { zh: "最基础也最有效的一条。「抽取到期日」和「帮我看看这份合同」的准确率差距通常在 20 个点以上。", en: "The most basic and most effective single item. 'Extract the expiry date' versus 'take a look at this contract' routinely differs by 20 points." } },
  { k: "format", zh: "钉死输出格式", en: "Pinned output format", acc: 0.09, cons: 0.24, tok: 60,
    why: { zh: "对一致性的贡献远大于对准确性的贡献——它主要在消除「同一个问题两种格式」这类下游解析失败。", en: "Contributes far more to consistency than to accuracy — it mostly eliminates downstream parse failures from one question answered two ways." } },
  { k: "shots", zh: "3 个少样本示例", en: "Three few-shot examples", acc: 0.14, cons: 0.16, tok: 320,
    why: { zh: "示例传达的是「你想要的答案长什么样」,这件事用自然语言描述往往更长也更不准。注意示例顺序会引入偏见。", en: "Examples convey what a wanted answer looks like — usually longer and less precise to describe in prose. Beware: example order induces bias." } },
  { k: "cot", zh: "要求分步推理", en: "Ask for step-by-step reasoning", acc: 0.11, cons: -0.05, tok: 240,
    why: { zh: "只对需要多步计算或多条件判断的任务有效。对抽取、分类这类一步任务,它增加成本、拉长延迟,还引入额外的出错机会。", en: "Only helps tasks needing multi-step computation or multi-condition judgement. On one-step extraction it adds cost, latency and fresh chances to go wrong." } },
  { k: "constraint", zh: "边界与拒答规则", en: "Boundaries and refusal rules", acc: 0.07, cons: 0.12, tok: 90,
    why: { zh: "「如果合同里没写到期日,输出 null,不要猜」——这一句常常比任何提示技巧都更能降低幻觉率。", en: "'If the contract states no expiry date, output null; do not guess' — one sentence that usually cuts hallucination more than any prompt trick." } },
  { k: "role", zh: "角色扮演开场", en: "Role-play preamble", acc: 0.01, cons: 0.01, tok: 35,
    why: { zh: "「你是一位资深法务专家」几乎不改变现代模型在客观任务上的准确率,主要影响语气。别把它当技术手段。", en: "'You are a senior legal expert' barely changes accuracy on objective tasks with modern models; it mostly shifts tone. Not a technique." } },
  { k: "polite", zh: "礼貌用语与强调", en: "Politeness and emphasis", acc: 0.0, cons: 0.0, tok: 45,
    why: { zh: "「这非常重要」「请务必认真」对现代模型没有可测量的收益,只是在花钱买 token。", en: "'This is very important', 'please be careful' — no measurable benefit on modern models. You are buying tokens." } },
];
const PromptLabViz = () => {
  const L = useL();
  const lang = useLang();
  const [on, setOn] = React.useState({ task: true, format: true });
  const [multi, setMulti] = React.useState(true);
  const [price, setPrice] = React.useState(3);

  const chosen = PROMPT_PARTS.filter((p) => on[p.k]);
  let acc = 0.42 + chosen.reduce((s, p) => s + p.acc, 0);
  let cons = 0.40 + chosen.reduce((s, p) => s + p.cons, 0);
  if (on.cot && !multi) acc -= 0.14;   // CoT only pays on genuinely multi-step tasks
  if (!on.task) cons -= 0.15;
  acc = clamp(acc, 0.05, 0.97); cons = clamp(cons, 0.05, 0.99);
  const tokens = 120 + chosen.reduce((s, p) => s + p.tok, 0);
  const outTok = on.cot ? 260 : 40;
  const monthly = ((tokens + outTok) / 1e6) * price * 30 * 20000;

  return (
    <div>
      <VizHead idx="PR1" title={L("提示打分台:哪些成分真的付钱,哪些只是安慰", "Prompt bench: which ingredients pay, which only comfort you")} />
      <div className="viz-ctrl">
        <label><span>{L("任务类型", "Task type")}</span>
          <Seg value={multi ? "m" : "s"} onChange={(v) => setMulti(v === "m")}
            options={[{ v: "s", l: L("一步(抽取/分类)", "one-step (extract)") }, { v: "m", l: L("多步(推理/计算)", "multi-step (reasoning)") }]} /></label>
        <Slider label={L("单价 $/1M", "Price $/1M")} min={0.2} max={20} step={0.2} value={price} onChange={setPrice} />
      </div>

      <span className="lm-label" style={{ marginTop: 12 }}>{L("勾选提示成分", "Toggle prompt ingredients")}</span>
      <div className="lm-check">
        {PROMPT_PARTS.map((p) => (
          <div key={p.k} className={`c-item ${on[p.k] ? "done" : ""} ${p.acc <= 0.01 && on[p.k] ? "now" : ""}`}
            onClick={() => setOn((o) => ({ ...o, [p.k]: !o[p.k] }))}>
            <span className="c-box">{on[p.k] ? "✓" : ""}</span>
            <div>
              <div className="c-name">{pick(lang, p)} <span className="lm-mono" style={{ fontSize: 11, color: "var(--muted)" }}>+{p.tok} tok</span></div>
              <div className="c-sub">{pick(lang, p.why)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("预估准确率", "Projected accuracy")} value={pct(acc)} tone={acc > 0.8 ? "ok" : acc < 0.55 ? "warn" : "acc"} />
        <Kpi label={L("一致性", "Consistency")} value={pct(cons)} tone={cons > 0.8 ? "ok" : cons < 0.5 ? "warn" : ""}
          hint={L("同题重问的稳定度", "stability on a repeat ask")} />
        <Kpi label={L("提示长度", "Prompt length")} value={tokens} unit=" tok" />
        <Kpi label={L("月成本(2 万次/天)", "Monthly (20k/day)")} value={`$${nf(monthly, 0)}`} />
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        {!on.task && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L("你还没写清任务。这是唯一一条无论如何都不能省的成分——其他所有技巧的收益都建立在模型知道你要它干什么之上。",
              "You have not stated the task. It is the one ingredient that can never be skipped — every other technique's payoff assumes the model knows what you want.")}
          </div></div>
        )}
        {on.cot && !multi && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L("一步任务上要求分步推理是净损失:准确率下降(多了出错环节)、延迟翻倍、成本上涨。思维链只在真正需要多步时有效。",
              "Chain-of-thought on a one-step task is a net loss: accuracy falls, latency doubles, cost rises. It pays only where the task genuinely needs multiple steps.")}
          </div></div>
        )}
        {(on.role || on.polite) && (
          <div className="lm-step now"><span className="sn">i</span><div>
            {L(`角色扮演与礼貌用语一共花了 ${(on.role ? 35 : 0) + (on.polite ? 45 : 0)} 个 token,换来约 1 个点的准确率。它们不有害,但当你优化提示词时,应该先看真正有杠杆的成分。`,
              `Role-play and politeness together cost ${(on.role ? 35 : 0) + (on.polite ? 45 : 0)} tokens for roughly one point of accuracy. Not harmful — just the wrong place to look first.`)}
          </div></div>
        )}
        {acc > 0.82 && (
          <div className="lm-step"><span className="sn">✓</span><div>
            {L(`${pct(acc)} 的准确率意味着:在考虑微调之前,先确认这个数字离你的验收标准还差多少。差 5 个点通常靠数据清洗和格式约束就能补上;差 25 个点才是微调该出场的地方。`,
              `At ${pct(acc)}, establish how far that is from your acceptance bar before considering a fine-tune. A 5-point gap usually closes with cleaner data and tighter constraints; a 25-point gap is where fine-tuning belongs.`)}
          </div></div>
        )}
      </div>

      <p className="viz-caption">
        {L("这里的数字是示意性的,但排序是真实且被反复复现的:说清任务 > 给格式 > 给示例 > 该用时用思维链 > 角色扮演 ≈ 礼貌用语。提示工程必须先做,不是因为它效果最好,而是因为它的迭代周期是秒级——你在微调上花的每一小时,本来可以试二十版提示词。而且你需要一个提示词基线,否则微调之后你根本说不清那个提升是从哪来的。",
          "The numbers here are illustrative but the ordering is real and repeatedly reproduced: state the task > pin the format > give examples > use chain-of-thought where warranted > role-play ≈ politeness. Prompting comes first not because it is the most powerful lever but because its loop is seconds long — every hour spent fine-tuning could have tested twenty prompts. And you need a prompt baseline, or after fine-tuning you cannot say where the gain came from.")}
      </p>
    </div>
  );
};

/* =========================================================
   PR2 · toolCall — the think/call/observe/answer loop
   ========================================================= */
const TOOL_STEPS = [
  { k: "think", zh: "思考", en: "Think", role: "model",
    body: { zh: "用户问「诚川科技这个月的退款总额」。我没有这个数据,需要查数据库。", en: "The user asks for this month's refund total. I do not have that data; I need the database." } },
  { k: "call", zh: "工具调用", en: "Tool call", role: "model",
    body: { zh: 'query_orders({ "customer": "诚川科技", "month": "2026-07", "type": "refund" })', en: 'query_orders({ "customer": "Chengchuan", "month": "2026-07", "type": "refund" })' } },
  { k: "obs", zh: "观察结果", en: "Observation", role: "tool",
    body: { zh: '{ "rows": 3, "total": -18420.50, "currency": "CNY" }', en: '{ "rows": 3, "total": -18420.50, "currency": "CNY" }' } },
  { k: "think2", zh: "再思考", en: "Think again", role: "model",
    body: { zh: "拿到了。金额是负数(系统里退款记为负),回答时要转成正数并说明口径。", en: "Got it. The amount is negative (refunds are stored as negatives); present it positive and state the convention." } },
  { k: "answer", zh: "回答", en: "Answer", role: "model",
    body: { zh: "该客户 2026 年 7 月共 3 笔退款,合计 18,420.50 元。", en: "The customer had 3 refunds in July 2026 totalling CNY 18,420.50." } },
];
const TOOL_FAULTS = [
  { k: "none", zh: "无故障", en: "No fault" },
  { k: "arg", zh: "幻觉参数", en: "Hallucinated argument" },
  { k: "loop", zh: "死循环", en: "Infinite loop" },
  { k: "empty", zh: "空结果", en: "Empty result" },
  { k: "scope", zh: "越权调用", en: "Out-of-scope call" },
];
const ToolCallViz = () => {
  const L = useL();
  const lang = useLang();
  const [step, setStep] = React.useState(0);
  const [fault, setFault] = React.useState("none");
  const [mode, setMode] = React.useState("schema");

  const faultInfo = {
    arg: { zh: "模型把客户名写成了数据库里不存在的写法。工具返回 0 行,而模型往往把「0 行」当成「没有退款」直接回答,而不是怀疑自己的参数。防御:参数值必须来自可枚举的实体列表,不能让模型自由生成。", en: "The model wrote a customer name that does not exist in the database. The tool returns zero rows, and the model typically reports 'no refunds' rather than doubting its own argument. Defence: argument values come from an enumerable entity list, never free generation." },
    loop: { zh: "工具返回了一个模型看不懂的错误,于是它换个参数再试、再试、再试。没有最大轮次限制的智能体会一直烧钱到超时。防御:硬性轮次上限 + 同一工具重复调用检测。", en: "The tool returned an error the model cannot interpret, so it retries with a tweaked argument, again and again. An agent with no turn cap burns money until timeout. Defence: a hard turn limit plus repeat-call detection." },
    empty: { zh: "查询合法但确实没有数据。这是最危险的一种,因为模型有强烈的「填空」倾向——它可能凭上下文编一个数字。防御:提示里明确要求空结果原样报告,并在评估集里专门测这一类。", en: "The query was valid and there genuinely is no data. The most dangerous case, because the model is strongly inclined to fill the blank with a plausible number. Defence: require empty results to be reported verbatim, and test this class explicitly." },
    scope: { zh: "模型调用了 update_orders 而不是 query_orders。在只读场景里这是一次真实的事故。防御:权限不能靠提示词约束,必须在工具层面做——只把只读工具暴露给模型。", en: "The model called update_orders instead of query_orders. In a read-only setting that is a real incident. Defence: permissions cannot be enforced by prompt — expose only read-only tools." },
  }[fault];

  const reliability = { prompt: 0.72, schema: 0.94, constrain: 0.998 }[mode];
  const overhead = { prompt: 0, schema: 12, constrain: 3 }[mode];

  return (
    <div>
      <VizHead idx="PR2" title={L("工具调用循环:一步一步走,并注入故障", "The tool loop: step through it, then inject a fault")} />
      <div className="viz-ctrl">
        <label><span>{L("格式可靠性手段", "Format reliability")}</span>
          <Seg value={mode} onChange={setMode} options={[
            { v: "prompt", l: L("提示里要求 JSON", "ask in prompt") },
            { v: "schema", l: L("schema 校验重试", "validate + retry") },
            { v: "constrain", l: L("约束解码", "constrained decoding") },
          ]} /></label>
        <Choice label={L("注入故障", "Inject fault")} value={fault} onChange={setFault}
          options={TOOL_FAULTS.map((f) => ({ v: f.k, l: pick(lang, f) }))} />
      </div>

      <div className="lm-steps" style={{ marginTop: 14 }}>
        {TOOL_STEPS.map((s, i) => (
          <div key={s.k} className={`lm-step ${i === step ? "now" : ""}`}
            style={{ cursor: "pointer", opacity: i > step ? 0.45 : 1 }} onClick={() => setStep(i)}>
            <span className="sn">{i + 1}</span>
            <div>
              <div><span className={`lm-tag ${s.role === "tool" ? "pri" : "acc"}`}>{s.role === "tool" ? L("工具", "tool") : L("模型", "model")}</span> {pick(lang, s)}</div>
              <div className="lm-code" style={{ marginTop: 6 }}>{pick(lang, s.body)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="lm-btnrow" style={{ marginTop: 10 }}>
        <button className="viz-btn lm-minibtn" onClick={() => setStep((s) => Math.max(0, s - 1))}>← {L("上一步", "Back")}</button>
        <button className="viz-btn lm-minibtn" onClick={() => setStep((s) => Math.min(TOOL_STEPS.length - 1, s + 1))}>{L("下一步", "Next")} →</button>
        <button className="viz-btn lm-minibtn" onClick={() => setStep(0)}>{L("重置", "Reset")}</button>
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(3, 1fr)" }}>
        <Kpi label={L("格式合法率", "Valid-format rate")} value={pct(reliability)} tone={reliability > 0.99 ? "ok" : reliability < 0.8 ? "warn" : "acc"} />
        <Kpi label={L("额外延迟", "Extra latency")} value={`+${overhead}%`} hint={L("重试或约束的代价", "cost of retry or constraint")} />
        <Kpi label={L("循环轮次", "Loop turns")} value={fault === "loop" ? "∞" : "1"} tone={fault === "loop" ? "warn" : "ok"} />
      </div>

      {faultInfo && (
        <div className="lm-steps" style={{ marginTop: 12 }}>
          <div className="lm-step now"><span className="sn">!</span><div>{pick(lang, faultInfo)}</div></div>
        </div>
      )}

      <p className="viz-caption">
        {L("工具调用把模型从「回答问题的人」变成「决定调用什么的人」,这是所有智能体的基本循环:思考 → 调用 → 观察 → 再思考 → 回答。可靠性有三级手段,成本与效果同时递增:提示里要求 JSON(约七成合法)、给 schema 并失败重试(约九成半)、解码时直接屏蔽非法 token(几乎百分百)。但格式合法只解决一半问题,另一半是语义:参数是不是幻觉出来的、空结果有没有被如实报告、模型有没有调用它不该调用的工具。这一半必须靠工具层的权限和评估集,提示词管不住。",
          "Tool use turns the model from something that answers questions into something that decides what to call — the basic loop of every agent: think, call, observe, think again, answer. Reliability comes in three tiers of rising cost and rising effect: ask for JSON in the prompt (about 70% valid), supply a schema and retry on failure (about 95%), or mask illegal tokens during decoding (effectively 100%). But valid format is half the problem. The other half is semantic: whether the argument was hallucinated, whether an empty result was reported honestly, whether the model called a tool it should not have. That half lives in the tool layer and the eval set — prompts cannot hold it.")}
      </p>
    </div>
  );
};

/* =========================================================
   PR3 · ragVsFt — a computable routing criterion
   ========================================================= */
const RagVsFtViz = () => {
  const L = useL();
  const [churn, setChurn] = React.useState(60);
  const [format, setFormat] = React.useState(40);
  const [examples, setExamples] = React.useState(300);
  const [latency, setLatency] = React.useState(50);
  const [cite, setCite] = React.useState(true);

  const ragScore = clamp(0.18 + churn / 200 + (cite ? 0.22 : 0) - format / 400 - latency / 500, 0, 1);
  const ftScore = clamp(0.10 + format / 160 + Math.min(examples, 3000) / 6000 + latency / 320 - churn / 260 - (cite ? 0.12 : 0), 0, 1);
  const gap = ftScore - ragScore;
  const verdict = Math.abs(gap) < 0.08 ? "both" : gap > 0 ? "ft" : "rag";

  const ragCost = { setup: 6, monthly: 900 + churn * 6, latency: 380 + (cite ? 90 : 0) };
  const ftCost = { setup: 18 + Math.round(examples / 60), monthly: 240 + Math.round(churn / 8) * 180, latency: 140 };

  const V = {
    rag: { zh: "用检索。你缺的是知识而不是行为:知识变化快、需要引用出处、需要按权限过滤——这三件事微调都做不到。微调过的模型无法告诉你答案来自哪份文档,也无法在周三吸收一条新政策。", en: "Use retrieval. What you lack is knowledge, not behaviour: it changes fast, needs citations, needs access filtering — none of which fine-tuning can do. A fine-tuned model cannot say which document an answer came from, nor absorb a policy change on Wednesday." },
    ft: { zh: "微调。你缺的是行为:一种特定的输出方式、领域判断套路或格式纪律,它无法用提示词稳定描述,或者塞进提示词后成本与延迟不可接受。注意:微调之后知识仍然要靠检索。", en: "Fine-tune. What you lack is behaviour: an output style, a domain judgement pattern, or format discipline that cannot be stably described in a prompt — or that costs too much latency once stuffed into one. Note: knowledge still comes from retrieval afterwards." },
    both: { zh: "两条路得分接近,答案是混合方案:微调格式与语气,检索事实与引用。这在实践中也是最常见的正确答案——大多数真实项目既需要稳定的输出行为,又需要每天更新的知识。", en: "The two scores are close, so the answer is the hybrid: fine-tune the format and tone, retrieve the facts and citations. In practice this is also the commonest right answer — most real projects need both stable behaviour and knowledge that updates daily." },
  }[verdict];

  return (
    <div>
      <VizHead idx="PR3" title={L("决策矩阵:你缺的是知识,还是行为", "Decision matrix: do you lack knowledge, or behaviour")} />
      <div className="viz-ctrl">
        <Slider label={L("知识变化速度", "Knowledge churn")} min={0} max={100} step={5} value={churn} onChange={setChurn}
          fmt={(v) => (v > 70 ? L("每天", "daily") : v > 35 ? L("每月", "monthly") : L("每年", "yearly"))} />
        <Slider label={L("行为特异度", "Behaviour idiosyncrasy")} min={0} max={100} step={5} value={format} onChange={setFormat} unit="%" />
        <Slider label={L("可用标注样本", "Labelled examples")} min={0} max={5000} step={100} value={examples} onChange={setExamples} />
        <Slider label={L("延迟/成本压力", "Latency & cost pressure")} min={0} max={100} step={5} value={latency} onChange={setLatency} unit="%" />
        <label><span>{L("必须给出处", "Citations required")}</span>
          <Seg value={cite ? "y" : "n"} onChange={(v) => setCite(v === "y")}
            options={[{ v: "y", l: L("是", "yes") }, { v: "n", l: L("否", "no") }]} /></label>
      </div>

      <div className="lm-bars" style={{ marginTop: 14 }}>
        <Bar label={L("检索增强 (RAG) 得分", "Retrieval (RAG) score")} value={ragScore} max={1} tone={verdict === "rag" ? "acc" : ""} valText={pct(ragScore)} />
        <Bar label={L("微调 (SFT) 得分", "Fine-tuning score")} value={ftScore} max={1} tone={verdict === "ft" ? "acc" : ""} valText={pct(ftScore)} />
      </div>

      <div className="lm-grid2" style={{ marginTop: 14, alignItems: "start" }}>
        <div>
          <span className="lm-label">{L("一年总成本对比(示意)", "One-year total cost (illustrative)")}</span>
          <table className="lm-table">
            <thead><tr><th></th><th>{L("检索", "RAG")}</th><th>{L("微调", "Fine-tune")}</th></tr></thead>
            <tbody>
              <tr><td>{L("搭建(人日)", "Setup (person-days)")}</td><td>{ragCost.setup}</td><td>{ftCost.setup}</td></tr>
              <tr><td>{L("月度维护 ($)", "Monthly upkeep ($)")}</td><td>{nf(ragCost.monthly, 0)}</td><td>{nf(ftCost.monthly, 0)}</td></tr>
              <tr><td>{L("单次延迟 (ms)", "Per-call latency (ms)")}</td><td>{ragCost.latency}</td><td className="pos">{ftCost.latency}</td></tr>
              <tr className="hl"><td>{L("一年合计 ($)", "One-year total ($)")}</td>
                <td>{nf(ragCost.setup * 800 + ragCost.monthly * 12, 0)}</td>
                <td>{nf(ftCost.setup * 800 + ftCost.monthly * 12, 0)}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <span className="lm-label">{L("能力对照", "Capability comparison")}</span>
          <table className="lm-table">
            <thead><tr><th>{L("能力", "Capability")}</th><th>RAG</th><th>SFT</th></tr></thead>
            <tbody>
              {[
                [L("当天更新知识", "Same-day knowledge update"), "✓", "✕"],
                [L("给出可核验出处", "Verifiable citations"), "✓", "✕"],
                [L("按用户权限过滤", "Per-user access filtering"), "✓", "✕"],
                [L("稳定的输出格式", "Stable output format"), "△", "✓"],
                [L("领域判断套路", "Domain judgement patterns"), "△", "✓"],
                [L("短提示、低延迟", "Short prompt, low latency"), "✕", "✓"],
                [L("压进小模型", "Compress into a small model"), "✕", "✓"],
              ].map((r, i) => (
                <tr key={i}><td>{r[0]}</td>
                  <td className={r[1] === "✓" ? "pos" : r[1] === "✕" ? "neg" : ""}>{r[1]}</td>
                  <td className={r[2] === "✓" ? "pos" : r[2] === "✕" ? "neg" : ""}>{r[2]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        <div className="lm-step now"><span className="sn">→</span><div>
          <div><span className="lm-tag acc">{verdict === "both" ? L("混合", "Hybrid") : verdict === "ft" ? L("微调", "Fine-tune") : L("检索", "Retrieval")}</span></div>
          <div style={{ marginTop: 6 }}>{L(V.zh, V.en)}</div>
        </div></div>
        {examples < 200 && ftScore > 0.4 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`你只有 ${examples} 条标注样本。即使判定倾向微调,也先把数据凑到 500–1000 条高一致性样本再动手——用 100 条数据微调出来的模型,几乎一定不如一个写好的提示词。`,
              `You have only ${examples} labelled examples. Even if the verdict leans toward fine-tuning, get to 500–1,000 highly consistent examples first — a model tuned on 100 rows almost always loses to a well-written prompt.`)}
          </div></div>
        )}
      </div>

      <p className="viz-caption">
        {L("这是整个大模型工程里最常被问错的问题,而分界线其实很干净:缺知识用检索,缺行为用微调。「让模型知道我们公司的产品」是知识——用检索,便宜、可更新、能给出处;「让模型按我们审核员的口径写结论」是行为——用微调,因为这种口径你写不进提示词。画错这条线的代价是几天算力换一个仍然会胡说、还多了一层无法更新的知识的模型。现实里最好的答案往往是两个都要:微调管形状,检索管内容。",
          "This is the most frequently misanswered question in LLM engineering, and the boundary is clean: missing knowledge calls for retrieval, missing behaviour calls for fine-tuning. 'Make it know our products' is knowledge — retrieval: cheap, updatable, citable. 'Make it write conclusions the way our reviewers judge' is behaviour — fine-tuning, because that judgement will not fit in a prompt. Getting it wrong costs days of compute for a model that still fabricates and now carries knowledge you cannot update. In reality the best answer is usually both: fine-tune the shape, retrieve the content.")}
      </p>
    </div>
  );
};

/* =========================================================
   FT1 · ftDecision — the three legitimate reasons
   ========================================================= */
const FT_SCENARIOS = [
  {
    k: "products", zh: "「让模型知道我们全部产品的规格和价格」", en: "'Make it know all our product specs and prices'",
    verdict: "rag", reason: {
      zh: "这是知识,而且是每周都在变的知识。微调注入事实的样本效率极低(同一个事实要重复几十次才记得住),而且一旦价格改了你必须重训。更糟的是它记住了却不知道自己记得对不对,也无法给出处。用检索。",
      en: "This is knowledge, and knowledge that changes weekly. Fine-tuning facts is wildly sample-inefficient (a fact needs dozens of repetitions to stick), and a price change forces a retrain. Worse, the model cannot tell whether what it memorised is still right, and cannot cite. Use retrieval.",
    },
  },
  {
    k: "style", zh: "「让模型按我们审核员的口径写风险结论」", en: "'Make it write risk conclusions the way our reviewers do'",
    verdict: "ft", reason: {
      zh: "这是行为,而且是一种你写不进提示词的判断口径:审核员在什么情况下用「建议关注」而不是「存在风险」、什么细节必须点名、什么结论必须留余地。这类隐性规范只能从几百条真实样本里学。这是微调最正当的用途。",
      en: "This is behaviour — and a judgement convention you cannot write into a prompt: when a reviewer says 'worth monitoring' rather than 'presents risk', which details must be named, which conclusions must stay hedged. Tacit norms like these can only be learned from a few hundred real examples. This is fine-tuning's most legitimate use.",
    },
  },
  {
    k: "compress", zh: "「用大模型的效果,但只付小模型的钱」", en: "'Large-model quality at small-model cost'",
    verdict: "ft", reason: {
      zh: "这是蒸馏式微调:用大模型生成高质量输出,再用它训一个小模型。在任务窄而明确时,7B 微调后经常能追上通用大模型,而单次成本降一到两个数量级。这是第二个正当理由。",
      en: "This is distillation-style fine-tuning: generate high-quality outputs with a large model, then train a small one on them. On a narrow, well-defined task a fine-tuned 7B routinely catches a general large model at one or two orders of magnitude less cost per call. This is the second legitimate reason.",
    },
  },
  {
    k: "latency", zh: "「提示词里有 3000 token 的规则和示例,太慢太贵」", en: "'Our prompt carries 3,000 tokens of rules and examples — too slow, too expensive'",
    verdict: "ft", reason: {
      zh: "这是第三个正当理由:把提示词里的稳定部分「烧进」权重。效果通常持平甚至更好,而每次调用省掉 3000 个输入 token——在高并发下这是巨大的成本与延迟改善。前提是那些规则确实稳定,不会每月改。",
      en: "The third legitimate reason: bake the stable part of the prompt into the weights. Quality usually holds or improves while every call saves 3,000 input tokens — a large cost and latency win at volume. The precondition is that those rules really are stable and not revised monthly.",
    },
  },
  {
    k: "hallu", zh: "「模型总是胡说,微调能治好吗」", en: "'It keeps making things up — will fine-tuning fix that?'",
    verdict: "no", reason: {
      zh: "通常不能,而且可能更糟。幻觉的来源有三种:解码温度太高(改参数)、上下文里根本没有答案(用检索)、以及模型不知道自己不知道(用拒答规则和评估集)。微调只会让它更自信地说出你训练数据里的那种话——如果你的数据里没有「我不确定」,它就永远不会说这句。",
      en: "Usually not, and it may get worse. Hallucination has three sources: too high a decoding temperature (change the parameter), the answer simply not being in context (use retrieval), and the model not knowing what it does not know (use refusal rules and an eval set). Fine-tuning only makes it say the kind of thing in your training data more confidently — and if your data never says 'I am not sure', it never will.",
    },
  },
  {
    k: "multi", zh: "「一个模型要同时服务 30 个客户的不同口径」", en: "'One model must serve 30 customers with different conventions'",
    verdict: "ft", reason: {
      zh: "适合微调,而且适合 LoRA:一个基座权重 + 30 个几十 MB 的适配器,按客户动态加载。这是参数高效微调在商业上最有说服力的场景,全参微调 30 份权重在成本上根本不成立。",
      en: "A fine-tuning case, and specifically a LoRA one: one base model plus thirty adapters of tens of megabytes each, loaded per customer. This is parameter-efficient fine-tuning's most commercially compelling scenario — thirty full sets of weights would never pencil out.",
    },
  },
];
const FtDecisionViz = () => {
  const L = useL();
  const lang = useLang();
  const [sel, setSel] = React.useState("style");
  const s = FT_SCENARIOS.find((x) => x.k === sel);
  const tag = { rag: L("改用检索", "Use retrieval instead"), ft: L("该微调", "Fine-tune"), no: L("微调解决不了", "Fine-tuning cannot fix this") }[s.verdict];

  return (
    <div>
      <VizHead idx="FT1" title={L("决策推演:六个真实需求,判定与理由", "Decision drill: six real requests, verdict and reasoning")} />
      <span className="lm-label" style={{ marginTop: 4 }}>{L("点选一个需求", "Pick a request")}</span>
      <div className="lm-check">
        {FT_SCENARIOS.map((x) => (
          <div key={x.k} className={`c-item ${sel === x.k ? "now" : ""}`} onClick={() => setSel(x.k)}>
            <span className="c-box">{sel === x.k ? "●" : ""}</span>
            <div><div className="c-name">{pick(lang, x)}</div></div>
          </div>
        ))}
      </div>

      <div className="lm-steps" style={{ marginTop: 14 }}>
        <div className="lm-step now"><span className="sn">{s.verdict === "ft" ? "✓" : "!"}</span><div>
          <div><span className={`lm-tag ${s.verdict === "ft" ? "pri" : "acc"}`}>{tag}</span></div>
          <div style={{ marginTop: 6 }}>{pick(lang, s.reason)}</div>
        </div></div>
      </div>

      <div className="lm-grid3" style={{ marginTop: 14 }}>
        {[
          { h: L("正当理由一:行为无法描述", "Reason 1: undescribable behaviour"), b: L("一种隐性的输出口径、判断套路或格式纪律,你能给出几百个例子,但写不成规则。", "A tacit output convention, judgement pattern or format discipline you can exemplify hundreds of times but cannot write as rules.") },
          { h: L("正当理由二:压进小模型", "Reason 2: compress into a small model"), b: L("任务窄而明确时,微调后的小模型能追上通用大模型,单次成本降一两个数量级。", "On a narrow task a fine-tuned small model catches a general large one at one or two orders of magnitude less cost.") },
          { h: L("正当理由三:省掉长提示", "Reason 3: retire a long prompt"), b: L("把稳定的规则与示例烧进权重,每次调用省下几千个输入 token 和相应延迟。", "Bake stable rules and examples into the weights, saving thousands of input tokens and the matching latency on every call.") },
        ].map((c, i) => (
          <div key={i} className="lm-kpi" style={{ cursor: "default" }}>
            <div className="k-label">{c.h}</div>
            <div className="k-hint" style={{ marginTop: 8 }}>{c.b}</div>
          </div>
        ))}
      </div>

      <p className="viz-caption">
        {L("请把这三个理由当成一道门禁:如果你的动机不在其中,那它大概率是「缺知识」而被误诊成「缺能力」。还有一个必须先做的动作——基线。在动手微调之前,你必须有一个提示词方案的分数写在纸上,否则微调结束后你无法回答那个最基本的问题:它到底提升了多少?没有基线的微调不是工程,是许愿。",
          "Treat those three reasons as a gate: if your motive is not among them, it is probably a knowledge gap misdiagnosed as a capability gap. And one action must come first — the baseline. Before you fine-tune, the score of a prompt-only solution must be written down, or afterwards you cannot answer the most basic question: how much did it actually improve? Fine-tuning without a baseline is not engineering, it is wishing.")}
      </p>
    </div>
  );
};

/* =========================================================
   FT2 · sftData — size vs diversity vs consistency vs noise
   ========================================================= */
const SftDataViz = () => {
  const L = useL();
  const [size, setSize] = React.useState(1000);
  const [diversity, setDiversity] = React.useState(70);
  const [consistency, setConsistency] = React.useState(75);
  const [noise, setNoise] = React.useState(6);
  const [synth, setSynth] = React.useState(0);

  // Returns diminish in log(size); consistency and noise act as hard multipliers.
  const sizeTerm = clamp(Math.log10(Math.max(50, size)) / 4.2, 0, 1);
  const consMul = 0.35 + 0.65 * (consistency / 100);
  const noiseMul = clamp(1 - Math.pow(noise / 100, 0.7) * 1.9, 0.15, 1);
  const divTerm = 0.35 + 0.65 * (diversity / 100);
  const synthPenalty = 1 - Math.pow(synth / 100, 2) * 0.35;
  const quality = clamp(sizeTerm * divTerm * consMul * noiseMul * synthPenalty * 1.28, 0, 0.98);
  const generalise = clamp(quality * (0.5 + 0.5 * (diversity / 100)) * 1.05, 0, 0.98);
  const annotDays = Math.round((size * (1 - synth / 100)) / 60);

  const curve = [];
  for (let i = 0; i <= 40; i++) {
    const n = Math.pow(10, 1.7 + (i / 40) * 3.3);
    curve.push(clamp((Math.log10(n) / 4.2) * divTerm * consMul * noiseMul * synthPenalty * 1.28, 0, 1));
  }
  const markerIdx = Math.round(((Math.log10(Math.max(50, size)) - 1.7) / 3.3) * 40);

  return (
    <div>
      <VizHead idx="FT2" title={L("数据集构建台:哪一个维度真正决定效果", "Dataset bench: which dimension actually decides the outcome")} />
      <div className="viz-ctrl">
        <Slider label={L("样本条数", "Examples")} min={50} max={50000} step={50} value={size} onChange={setSize} fmt={(v) => big(v)} />
        <Slider label={L("多样性", "Diversity")} min={10} max={100} step={5} value={diversity} onChange={setDiversity} unit="%" />
        <Slider label={L("标注一致性", "Annotation consistency")} min={20} max={100} step={5} value={consistency} onChange={setConsistency} unit="%" />
        <Slider label={L("错标率", "Label noise")} min={0} max={30} step={1} value={noise} onChange={setNoise} unit="%" />
        <Slider label={L("合成数据占比", "Synthetic share")} min={0} max={100} step={5} value={synth} onChange={setSynth} unit="%" />
      </div>

      <div style={{ marginTop: 14 }}>
        <LinePlot series={[{ pts: curve, color: "var(--accent)" }]} marker={markerIdx} yMax={1}
          xLabel={L("样本条数(对数)→", "examples (log) →")} yLabel={L("预估效果", "projected quality")} h={200} />
        <Legend items={[{ color: "var(--accent)", label: L("在当前的多样性、一致性与噪声水平下", "at your current diversity, consistency and noise") }]} />
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 12, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("预估任务效果", "Projected task quality")} value={pct(quality)} tone={quality > 0.75 ? "ok" : quality < 0.45 ? "warn" : "acc"} />
        <Kpi label={L("泛化能力", "Generalisation")} value={pct(generalise)} tone={generalise < 0.5 ? "warn" : ""}
          hint={L("换个问法还行不行", "does it survive a rephrasing")} />
        <Kpi label={L("标注工作量", "Annotation effort")} value={annotDays} unit={L(" 人日", " person-days")} />
        <Kpi label={L("每条样本边际收益", "Marginal value per item")} value={size > 3000 ? L("很低", "very low") : size > 800 ? L("中", "moderate") : L("很高", "very high")}
          tone={size > 3000 ? "warn" : "ok"} />
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        {consistency < 60 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`一致性只有 ${consistency}%,这是最致命的一项。两个标注员风格不同时,模型学到的是两者之间的平均值——而这个平均值往往两边都不像。补救办法不是加数据,是先写标注规范、交叉复核、把不一致的样本重标。加一万条不一致的数据只会让模型更稳定地输出那个四不像。`,
              `Consistency is only ${consistency}% — the most lethal of the four. When two annotators differ in style, the model learns the average, and that average resembles neither. The fix is not more data: write the annotation guideline, cross-review, relabel the inconsistent rows. Ten thousand more inconsistent examples only make the model reliably produce the mush.`)}
          </div></div>
        )}
        {noise > 12 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`${noise}% 的错标率会被模型忠实地学下来。经验规则:清掉 100 条错标样本,通常比新增 1000 条正确样本更有效——因为错标不只是「少学一点」,它在主动教模型错的东西。`,
              `A ${noise}% label error rate will be faithfully learned. Rule of thumb: removing 100 mislabelled examples usually beats adding 1,000 correct ones — mislabels do not merely fail to teach, they actively teach the wrong thing.`)}
          </div></div>
        )}
        {diversity < 45 && (
          <div className="lm-step now"><span className="sn">i</span><div>
            {L(`多样性 ${diversity}% 意味着你的样本形态太集中。任务效果可能看起来还行,但泛化只有 ${pct(generalise)}——换一种问法、换一个客户的表述习惯就崩。多样性优先于数量:200 条覆盖 20 种输入形态,胜过 2000 条全是同一种。`,
              `At ${diversity}% diversity your examples are too concentrated. Task quality may look acceptable while generalisation sits at ${pct(generalise)} — one rephrasing or one customer's different phrasing breaks it. Diversity outranks volume: 200 examples covering 20 input shapes beat 2,000 of the same shape.`)}
          </div></div>
        )}
        {synth > 60 && (
          <div className="lm-step now"><span className="sn">i</span><div>
            {L(`合成数据占 ${synth}% 时开始出现自我强化:模型学的是另一个模型的偏好和错误,包括它的措辞习惯和它不会的东西。合成数据适合扩充覆盖面,不适合定义标准——标准必须来自人。`,
              `At ${synth}% synthetic you enter self-reinforcement: the model learns another model's preferences and errors, including its phrasing tics and its blind spots. Synthetic data is good for broadening coverage, not for defining the standard — the standard must come from people.`)}
          </div></div>
        )}
        {size > 5000 && quality < 0.7 && (
          <div className="lm-step"><span className="sn">→</span><div>
            {L(`你已经有 ${big(size)} 条数据但效果仍只有 ${pct(quality)}。这几乎一定不是数量问题。停止标注,去抽 100 条样本人工过一遍:你会发现问题在一致性或者噪声上。`,
              `You already have ${big(size)} examples and quality is still ${pct(quality)}. This is almost certainly not a volume problem. Stop annotating and hand-review 100 rows: the problem will be consistency or noise.`)}
          </div></div>
        )}
      </div>

      <p className="viz-caption">
        {L("这条曲线是对数的,这一点值得反复强调:从 100 条到 1000 条的提升,远大于从 1000 条到 10000 条。所以正确的顺序是先做对再做多——先写标注规范让一致性上去,再清掉错标,再补足多样性,最后才考虑加量。「1000 条精品胜过 10 万条垃圾」不是一句励志口号,它是这三个乘法因子共同作用的结果:一致性和噪声是乘在总分上的,再多的数据也乘不回来。",
          "This curve is logarithmic, and that deserves repeating: going from 100 to 1,000 examples helps far more than 1,000 to 10,000. So the right order is correct before plentiful — write the guideline to raise consistency, purge the mislabels, fill in the diversity gaps, and only then add volume. '1,000 good beats 100,000 bad' is not a motivational slogan; it follows from the multiplicative structure above: consistency and noise multiply the whole score, and no amount of extra data multiplies it back.")}
      </p>
    </div>
  );
};

/* =========================================================
   FT3 · hyperLab — LR, epochs, batch and what breaks
   ========================================================= */
const HyperLabViz = () => {
  const L = useL();
  const [logLr, setLogLr] = React.useState(-4);
  const [epochs, setEpochs] = React.useState(3);
  const [batch, setBatch] = React.useState(16);
  const [size, setSize] = React.useState(1000);
  const [method, setMethod] = React.useState("lora");

  const lr = Math.pow(10, logLr);
  // Full fine-tuning tolerates roughly an order of magnitude less LR than LoRA.
  const lrSweet = method === "full" ? 2e-5 : 2e-4;
  const lrRatio = lr / lrSweet;
  const STEPS = 60;
  const stepsPerEpoch = STEPS / epochs;
  const stepsTotal = Math.max(1, Math.round((size * epochs) / batch));

  const speed = clamp(Math.pow(lrRatio, 0.5), 0.2, 2.6);
  const overfitPressure = clamp((epochs * 900) / size, 0, 7);
  const train = [], val = [];
  for (let i = 0; i < STEPS; i++) {
    const prog = i / STEPS;
    const noise = lrRatio > 3 ? 0.08 * Math.sin(i * 2.1) * (lrRatio / 3) : 0;
    const t = clamp(0.42 + 1.5 * Math.exp(-3.4 * speed * prog) + noise, 0.03, 3);
    const ep = i / stepsPerEpoch;
    const v = clamp(t + 0.07 + Math.max(0, ep - 1) * 0.085 * overfitPressure, 0.03, 3.2);
    train.push(t); val.push(v);
  }
  const bestIdx = val.indexOf(Math.min(...val));
  const bestEpoch = round1(bestIdx / stepsPerEpoch);
  const forgetting = clamp(Math.max(0, lrRatio - 0.8) * 0.22 + (method === "full" ? 0.18 : 0.04) + Math.max(0, epochs - 3) * 0.05, 0, 1);
  const taskGain = clamp(0.62 - Math.abs(Math.log10(Math.max(0.05, lrRatio))) * 0.28 + Math.min(epochs, 3) * 0.07 - Math.max(0, epochs - 4) * 0.05, 0.05, 0.95);

  return (
    <div>
      <VizHead idx="FT3" title={L("超参实验台:过拟合与灾难性遗忘长什么样", "Hyperparameter bench: what overfitting and forgetting look like")} />
      <div className="viz-ctrl">
        <label><span>{L("微调方式", "Method")}</span>
          <Seg value={method} onChange={setMethod} options={[{ v: "lora", l: "LoRA" }, { v: "full", l: L("全参", "full") }]} /></label>
        <Slider label={L("学习率", "Learning rate")} min={-6} max={-3} step={0.05} value={logLr} onChange={setLogLr}
          fmt={(v) => Math.pow(10, v).toExponential(1)} />
        <Slider label={L("epoch 数", "Epochs")} min={1} max={10} step={1} value={epochs} onChange={setEpochs} />
        <Slider label={L("有效批大小", "Effective batch")} min={1} max={128} step={1} value={batch} onChange={setBatch} />
        <Slider label={L("数据条数", "Dataset size")} min={100} max={20000} step={100} value={size} onChange={setSize} fmt={(v) => big(v)} />
      </div>

      <div style={{ marginTop: 14 }}>
        <LinePlot series={[
          { pts: train, color: "var(--primary)" },
          { pts: val, color: "var(--accent)", dash: "5 4" },
        ]} marker={bestIdx} xLabel={L("训练步 →", "steps →")} yLabel={L("损失", "loss")} yMax={3.2} />
        <Legend items={[
          { color: "var(--primary)", label: L("训练损失", "train loss") },
          { color: "var(--accent)", label: L("验证损失(虚线)", "validation loss (dashed)") },
        ]} />
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 12, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("目标任务提升", "Target-task gain")} value={pct(taskGain)} tone={taskGain > 0.7 ? "ok" : taskGain < 0.4 ? "warn" : "acc"} />
        <Kpi label={L("通用能力损失", "General-ability loss")} value={pct(forgetting)} tone={forgetting > 0.5 ? "warn" : forgetting < 0.2 ? "ok" : ""}
          hint={L("灾难性遗忘", "catastrophic forgetting")} />
        <Kpi label={L("最佳 epoch", "Best epoch")} value={bestEpoch} hint={L("早停点", "stop here")} />
        <Kpi label={L("总训练步", "Total steps")} value={big(stepsTotal)} hint={L("size × epoch ÷ batch", "size × epochs ÷ batch")} />
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        {lrRatio > 5 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`学习率是${method === "full" ? "全参" : "LoRA"}甜点值的 ${nf(lrRatio, 1)} 倍。这里最危险的不是曲线震荡,而是通用能力损失已经到 ${pct(forgetting)}:你的验证集(同分布)可能看起来还行,而模型在其他所有任务上都变笨了。必须用一个保留的通用评估集去测这件事。`,
              `The learning rate is ${nf(lrRatio, 1)}× the sweet spot for ${method === "full" ? "full" : "LoRA"} tuning. The danger is not the oscillation but the ${pct(forgetting)} general-ability loss: your in-distribution validation set may look fine while the model got measurably worse at everything else. You need a held-out general eval to see it.`)}
          </div></div>
        )}
        {lrRatio < 0.15 && (
          <div className="lm-step now"><span className="sn">i</span><div>
            {L("学习率太小:训完之后模型几乎没变,而这最常被误诊成「数据不够」。先把学习率调到甜点量级再讨论数据。",
              "The learning rate is too small: after training the model has barely changed — a state most often misdiagnosed as 'not enough data'. Get the rate into the right order of magnitude before discussing data.")}
          </div></div>
        )}
        {epochs > 4 && overfitPressure > 2 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`${epochs} 个 epoch 配 ${big(size)} 条数据已经在背题:验证损失在第 ${bestEpoch} 个 epoch 就见底了。小数据集上 2–3 个 epoch 通常就是上限,继续训只会让模型记住训练集的措辞。`,
              `${epochs} epochs on ${big(size)} examples is memorising the exam: validation loss bottomed at epoch ${bestEpoch}. On small datasets 2–3 epochs is usually the ceiling; more only teaches the training set's exact wording.`)}
          </div></div>
        )}
        {method === "full" && (
          <div className="lm-step"><span className="sn">i</span><div>
            {L("全参微调的学习率要比 LoRA 低一个数量级左右,而且遗忘风险天生更高——你在改动所有权重,包括那些承载通用能力的。这也是多数人应该从 LoRA 开始的原因之一。",
              "Full fine-tuning wants a learning rate about an order of magnitude below LoRA's, and carries inherently higher forgetting risk — you are moving every weight, including the ones carrying general ability. One more reason most people should start with LoRA.")}
          </div></div>
        )}
        {forgetting < 0.2 && taskGain > 0.7 && (
          <div className="lm-step"><span className="sn">✓</span><div>
            {L("这是一个健康的配置:目标任务提升明显,通用能力几乎没有损失。把这一组超参记下来作为你的起点,以后换数据集时只需微调学习率。",
              "A healthy configuration: clear target-task gain with almost no general-ability loss. Record this set as your starting point; when the dataset changes you will usually only need to nudge the learning rate.")}
          </div></div>
        )}
      </div>

      <p className="viz-caption">
        {L("微调的超参空间小得令人愉快,真正重要的只有三个:学习率、epoch 数、有效批大小(= 批 × 梯度累积 × 卡数)。但请注意本实验里那个第二个指标——通用能力损失。这是微调最阴险的失败模式:你的验证集来自同一份数据分布,所以它看不见遗忘;模型在你的任务上分数上升,在其他一切上悄悄下降,而你要等到上线后用户问了一个稍微偏离的问题才发现。所以你的评估必须包含一份与训练数据无关的保留集。",
          "Fine-tuning's hyperparameter space is pleasantly small: learning rate, epochs, and effective batch size (batch × gradient accumulation × devices). But note the second metric here — general-ability loss. This is fine-tuning's most insidious failure: your validation set is drawn from the same distribution, so it cannot see forgetting. The score rises on your task while quietly falling on everything else, and you find out in production when a user asks something slightly off-distribution. Your evaluation must therefore include a held-out set unrelated to your training data.")}
      </p>
    </div>
  );
};

/* =========================================================
   PE1 · loraRank — why low rank is enough
   ========================================================= */
const PE_MODELS = [
  { v: "1b", l: "1.5B", params: 1.5e9, layers: 28, hidden: 2048, ffn: 5632 },
  { v: "7b", l: "7B", params: 7e9, layers: 32, hidden: 4096, ffn: 11008 },
  { v: "13b", l: "13B", params: 13e9, layers: 40, hidden: 5120, ffn: 13824 },
  { v: "70b", l: "70B", params: 70e9, layers: 80, hidden: 8192, ffn: 28672 },
];
const LoraRankViz = () => {
  const L = useL();
  const [mv, setMv] = React.useState("7b");
  const [rank, setRank] = React.useState(8);
  const [alpha, setAlpha] = React.useState(16);
  const [targets, setTargets] = React.useState({ q: true, v: true, k: false, o: false, mlp: false });

  const m = PE_MODELS.find((x) => x.v === mv);
  // Per-layer LoRA parameter count: 2·r·(in+out) summed over adapted projections.
  const projs = {
    q: { l: "q_proj", d: m.hidden * 2 },
    k: { l: "k_proj", d: m.hidden * 2 },
    v: { l: "v_proj", d: m.hidden * 2 },
    o: { l: "o_proj", d: m.hidden * 2 },
    mlp: { l: "gate/up/down", d: (m.hidden + m.ffn) * 3 },
  };
  const activeKeys = Object.keys(targets).filter((k) => targets[k]);
  const perLayer = activeKeys.reduce((s, k) => s + rank * projs[k].d, 0);
  const trainable = perLayer * m.layers;
  const share = trainable / m.params;
  const adapterMB = (trainable * 2) / 1024 ** 2;
  const scale = alpha / rank;
  // Capacity heuristic: quality saturates in rank, and coverage of modules matters more.
  const coverage = clamp(activeKeys.length / 5 + (targets.mlp ? 0.25 : 0), 0, 1);
  const capacity = clamp((Math.log2(rank) / 8) * 0.55 + coverage * 0.62, 0, 1);
  const quality = clamp(0.34 + capacity * 0.62, 0, 0.98);

  return (
    <div>
      <VizHead idx="PE1" title={L("LoRA 实验台:秩、缩放与作用层", "LoRA bench: rank, scaling and target modules")} />
      <div className="viz-ctrl">
        <Choice label={L("基座模型", "Base model")} value={mv} onChange={setMv} options={PE_MODELS} />
        <Slider label={L("秩 r", "Rank r")} min={1} max={256} step={1} value={rank} onChange={setRank} />
        <Slider label="alpha α" min={1} max={256} step={1} value={alpha} onChange={setAlpha} />
      </div>

      <span className="lm-label" style={{ marginTop: 12 }}>{L("给哪些投影加 LoRA", "Which projections get an adapter")}</span>
      <div className="lm-pills">
        {Object.keys(projs).map((k) => (
          <button key={k} className={`lm-pill click ${targets[k] ? "on" : ""}`}
            onClick={() => setTargets((t) => ({ ...t, [k]: !t[k] }))}>{projs[k].l}</button>
        ))}
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("可训练参数", "Trainable params")} value={big(trainable)} tone="acc" />
        <Kpi label={L("占全模型", "Share of model")} value={`${nf(share * 100, share < 0.01 ? 3 : 2)}%`}
          tone={share < 0.01 ? "ok" : ""} />
        <Kpi label={L("适配器体积", "Adapter size")} value={nf(adapterMB, adapterMB < 10 ? 2 : 0)} unit=" MB"
          hint={L("可以按客户分发", "shippable per customer")} />
        <Kpi label={L("预估效果", "Projected quality")} value={pct(quality)} tone={quality > 0.8 ? "ok" : ""} />
      </div>

      <div className="lm-grid2" style={{ marginTop: 14, alignItems: "start" }}>
        <div>
          <span className="lm-label">{L("秩与参数量:线性关系", "Rank vs parameters: strictly linear")}</span>
          <table className="lm-table">
            <thead><tr><th>r</th><th>{L("可训练参数", "Trainable")}</th><th>{L("占比", "Share")}</th><th>{L("体积", "Size")}</th></tr></thead>
            <tbody>
              {[4, 8, 16, 32, 64, 128].map((r) => {
                const tp = activeKeys.reduce((s, k) => s + r * projs[k].d, 0) * m.layers;
                return (
                  <tr key={r} className={r === rank ? "hl" : ""}>
                    <td>{r}</td><td>{big(tp)}</td><td>{nf((tp / m.params) * 100, 3)}%</td><td>{nf((tp * 2) / 1024 ** 2, 1)} MB</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div>
          <span className="lm-label">{L("低秩分解在算什么", "What the low-rank factorisation does")}</span>
          <div className="lm-code" style={{ marginTop: 4 }}>
            {`W' = W + (α/r)·B·A
W : ${m.hidden}×${m.hidden}  = ${big(m.hidden * m.hidden)} ${L("参数(冻结)", "params (frozen)")}
A : r×${m.hidden}      = ${big(rank * m.hidden)}
B : ${m.hidden}×r      = ${big(rank * m.hidden)}
${L("缩放", "scale")} α/r = ${nf(scale, 2)}`}
          </div>
          <div className="lm-note">
            {L(`一个 ${m.hidden}×${m.hidden} 的权重矩阵有 ${big(m.hidden * m.hidden)} 个参数,而秩 ${rank} 的 LoRA 只用 ${big(2 * rank * m.hidden)} 个就能表示它的更新方向——压缩比 ${nf((m.hidden * m.hidden) / (2 * rank * m.hidden), 0)} 倍。这只在一个前提下成立:微调造成的 ΔW 确实是低秩的。经验上,对于「学一种行为」这类任务,它确实是。`,
              `A ${m.hidden}×${m.hidden} weight matrix holds ${big(m.hidden * m.hidden)} parameters; a rank-${rank} LoRA represents its update direction with ${big(2 * rank * m.hidden)} — a ${nf((m.hidden * m.hidden) / (2 * rank * m.hidden), 0)}× compression. This holds on one assumption: that the ΔW induced by fine-tuning really is low-rank. Empirically, for tasks that amount to learning a behaviour, it is.`)}
          </div>
        </div>
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        {!targets.mlp && activeKeys.length <= 2 && (
          <div className="lm-step now"><span className="sn">i</span><div>
            {L("只给 q 和 v 加是最经典的省钱配置,对「调语气、调格式」够用。但如果你的任务需要模型学会新的领域推理套路,通常必须把 MLP 也加上——那里存着更多「知道怎么做」的东西。覆盖面比秩更重要:r=8 全模块通常胜过 r=64 只加 q/v。",
              "Adapting only q and v is the classic economical setup and suffices for tone and format. If your task requires new domain reasoning patterns, you usually need the MLP as well — more of the 'knowing how' lives there. Coverage matters more than rank: r=8 on all modules usually beats r=64 on q/v alone.")}
          </div></div>
        )}
        {rank > 64 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`r=${rank} 在多数任务上是浪费:效果早就饱和了,而你多付了显存和过拟合风险。高秩只在两种情况下值得——数据量很大(上万条),或者你在教模型一种真正新的能力而不是一种风格。`,
              `r=${rank} is wasteful on most tasks: quality saturated long ago while you pay extra memory and overfitting risk. High rank earns its keep in two cases only — a genuinely large dataset (tens of thousands of rows), or teaching a genuinely new capability rather than a style.`)}
          </div></div>
        )}
        {alpha / rank > 4 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`α/r = ${nf(scale, 1)} 偏大,等价于把 LoRA 分支的学习率放大了 ${nf(scale, 1)} 倍,容易训崩。常见做法是 α = r 或 α = 2r;改了 r 之后记得同步改 α,否则你实际上是在偷偷改学习率。`,
              `α/r = ${nf(scale, 1)} is high — equivalent to scaling the LoRA branch's learning rate by ${nf(scale, 1)}×, which destabilises training. Common practice is α = r or α = 2r; when you change r, change α with it, or you are silently changing the learning rate.`)}
          </div></div>
        )}
        {share < 0.005 && quality > 0.75 && (
          <div className="lm-step"><span className="sn">✓</span><div>
            {L(`你在只训练 ${nf(share * 100, 3)}% 的参数的情况下拿到了 ${pct(quality)} 的预估效果,而适配器只有 ${nf(adapterMB, 1)} MB——小到可以放进 git、按客户分发、在服务里动态加载。这就是 LoRA 真正改变的东西。`,
              `You are training ${nf(share * 100, 3)}% of the parameters for a projected ${pct(quality)}, and the adapter is ${nf(adapterMB, 1)} MB — small enough to commit to git, ship per customer, and hot-load in a server. That is what LoRA actually changed.`)}
          </div></div>
        )}
      </div>

      <p className="viz-caption">
        {L("LoRA 的全部数学就在右边那个方框里:冻结原权重 W,只训练两个瘦矩阵 A 和 B,把它们的乘积当作权重的更新量。参数量是 2·r·d,与秩线性相关,与原矩阵大小只是一次方关系——这就是压缩比能到几百倍的原因。有两条实践经验值得单独记住:一是覆盖的模块比秩更重要,二是 α 和 r 必须一起调。而 LoRA 最被低估的价值不在训练侧而在部署侧:几十 MB 的适配器让「一个基座 + 每个客户一份微调」第一次在经济上成立。",
          "All of LoRA's mathematics sits in the box on the right: freeze W, train two thin matrices A and B, and treat their product as the weight update. Parameter count is 2·r·d — linear in rank and only first-order in matrix size, which is why the compression reaches hundreds of times. Two practical lessons are worth memorising: module coverage matters more than rank, and α must be tuned alongside r. And LoRA's most underrated value is not in training but in deployment: adapters of tens of megabytes make 'one base model plus one fine-tune per customer' economically possible for the first time.")}
      </p>
    </div>
  );
};

/* =========================================================
   PE2 · vramLedger — what fits in your GPU
   ========================================================= */
const VramLedgerViz = () => {
  const L = useL();
  const [mv, setMv] = React.useState("7b");
  const [method, setMethod] = React.useState("lora");
  const [wBits, setWBits] = React.useState(16);
  const [optim, setOptim] = React.useState("adamw");
  const [batch, setBatch] = React.useState(4);
  const [seqK, setSeqK] = React.useState(2);
  const [ckpt, setCkpt] = React.useState(true);
  const [gpuMem, setGpuMem] = React.useState(24);

  const m = PE_MODELS.find((x) => x.v === mv);
  const effWBits = method === "qlora" ? 4 : wBits;
  const trainableShare = method === "full" ? 1 : 0.002;   // ~0.2% for a typical LoRA config
  const weights = m.params * (effWBits / 8);
  const grads = m.params * trainableShare * 2;             // bf16 gradients
  const optimMul = { adamw: 8, adam8: 2, sgd: 0, adafactor: 1 }[optim];  // bytes per trainable param
  const optState = m.params * trainableShare * optimMul;
  const seq = seqK * 1024;
  const actFull = batch * seq * m.hidden * m.layers * 2 * 3.2;
  const activations = ckpt ? actFull * 0.16 : actFull;
  const total = weights + grads + optState + activations;
  const budget = gpuMem * 1024 ** 3;
  const fits = total <= budget;
  const stack = [
    { l: L("权重", "Weights"), v: weights, c: "var(--ink)" },
    { l: L("梯度", "Gradients"), v: grads, c: "var(--primary)" },
    { l: L("优化器状态", "Optimizer"), v: optState, c: "var(--accent)" },
    { l: L("激活", "Activations"), v: activations, c: "var(--muted)" },
  ];

  return (
    <div>
      <VizHead idx="PE2" title={L("显存账本:这张卡到底能训多大", "VRAM ledger: what this card can actually train")} />
      <div className="viz-ctrl">
        <Choice label={L("模型", "Model")} value={mv} onChange={setMv} options={PE_MODELS} />
        <label><span>{L("方式", "Method")}</span>
          <Seg value={method} onChange={setMethod} options={[
            { v: "full", l: L("全参", "full") }, { v: "lora", l: "LoRA" }, { v: "qlora", l: "QLoRA" }]} /></label>
        <Slider label={L("权重精度", "Weight bits")} min={4} max={32} step={4} value={wBits} onChange={setWBits} unit=" bit" />
        <Choice label={L("优化器", "Optimizer")} value={optim} onChange={setOptim} options={[
          { v: "adamw", l: "AdamW (fp32)" }, { v: "adam8", l: "8-bit Adam" }, { v: "adafactor", l: "Adafactor" }, { v: "sgd", l: "SGD" }]} />
        <Slider label={L("批大小", "Batch")} min={1} max={64} step={1} value={batch} onChange={setBatch} />
        <Slider label={L("序列长度", "Sequence length")} min={1} max={32} step={1} value={seqK} onChange={setSeqK} fmt={(v) => `${v}K`} />
        <label><span>{L("激活重算", "Checkpointing")}</span>
          <Seg value={ckpt ? "y" : "n"} onChange={(v) => setCkpt(v === "y")}
            options={[{ v: "y", l: L("开", "on") }, { v: "n", l: L("关", "off") }]} /></label>
        <Slider label={L("显存", "GPU memory")} min={8} max={640} step={8} value={gpuMem} onChange={setGpuMem} unit=" GB" />
      </div>

      <div className="lm-stack" style={{ marginTop: 14 }}>
        {stack.map((s, i) => (
          <div key={i} style={{ width: `${clamp((s.v / Math.max(total, budget)) * 100, 0, 100)}%`, background: s.c }}>
            {s.v / Math.max(total, budget) > 0.12 ? `${gb(s.v)}G` : ""}
          </div>
        ))}
        <div style={{ width: `${clamp(((Math.max(0, budget - total)) / Math.max(total, budget)) * 100, 0, 100)}%`, background: "var(--surface-2)" }} />
      </div>
      <Legend items={stack.map((s) => ({ color: s.c, label: `${s.l} ${gb(s.v)} GB` }))} />

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("总显存需求", "Total VRAM")} value={gb(total)} unit=" GB" tone={fits ? "ok" : "warn"} />
        <Kpi label={L("可训练参数", "Trainable params")} value={big(m.params * trainableShare)}
          hint={`${nf(trainableShare * 100, 2)}%`} />
        <Kpi label={L("是否装得下", "Fits?")} value={fits ? L("装得下", "yes") : L("爆显存", "OOM")} tone={fits ? "ok" : "warn"}
          hint={`${gb(total)} / ${gpuMem} GB`} />
        <Kpi label={L("训练吞吐代价", "Throughput cost")} value={ckpt ? "-30%" : "0%"} hint={L("激活重算换显存", "checkpointing trades speed")} />
      </div>

      <span className="lm-label" style={{ marginTop: 14 }}>{L("三种方式在同一张卡上的对比", "The three methods on this same card")}</span>
      <table className="lm-table">
        <thead><tr><th>{L("方式", "Method")}</th><th>{L("权重", "Weights")}</th><th>{L("梯度+优化器", "Grad+optim")}</th><th>{L("合计", "Total")}</th><th>{L("结果", "Verdict")}</th></tr></thead>
        <tbody>
          {[
            { k: "full", l: L("全参 bf16 + AdamW", "Full bf16 + AdamW"), w: m.params * 2, t: 1, o: 8 },
            { k: "lora", l: "LoRA bf16", w: m.params * 2, t: 0.002, o: 8 },
            { k: "qlora", l: "QLoRA 4-bit", w: m.params * 0.5, t: 0.002, o: 8 },
          ].map((r) => {
            const go = m.params * r.t * (2 + r.o);
            const tot = r.w + go + activations;
            return (
              <tr key={r.k} className={r.k === method ? "hl" : ""}>
                <td>{r.l}</td><td>{gb(r.w)} GB</td><td>{gb(go)} GB</td><td>{gb(tot)} GB</td>
                <td className={tot <= budget ? "pos" : "neg"}>{tot <= budget ? L("装得下", "fits") : L("爆", "OOM")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        {!fits && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`超出 ${gb(total - budget)} GB。按性价比顺序试:①改用 QLoRA(权重降到四分之一)②开激活重算(激活降到六分之一,换 30% 速度)③批大小降到 1 并用梯度累积保持有效批大小 ④缩短序列长度。这四步通常足以把 7B 塞进 24 GB。`,
              `Over by ${gb(total - budget)} GB. In order of return: (1) switch to QLoRA (weights to a quarter), (2) enable checkpointing (activations to a sixth, costing 30% speed), (3) drop batch to 1 and keep the effective batch with gradient accumulation, (4) shorten the sequence. These four usually fit 7B into 24 GB.`)}
          </div></div>
        )}
        {method === "full" && (
          <div className="lm-step now"><span className="sn">i</span><div>
            {L(`看清这笔账:全参微调时,梯度和优化器状态一共是权重的 ${nf((grads + optState) / weights, 1)} 倍。AdamW 要为每个参数存一份 fp32 动量和一份 fp32 方差,合计 8 字节——这就是「7B 模型需要 100 GB」的来源,而不是模型本身大。`,
              `Look at the arithmetic: with full fine-tuning, gradients plus optimizer state come to ${nf((grads + optState) / weights, 1)}× the weights. AdamW stores an fp32 momentum and an fp32 variance per parameter, 8 bytes in total — that, not model size, is where '7B needs 100 GB' comes from.`)}
          </div></div>
        )}
        {method === "qlora" && (
          <div className="lm-step"><span className="sn">✓</span><div>
            {L("QLoRA 的三个关键点:把冻结的基座权重量化到 4 bit(NF4,一种针对正态分布权重优化的数据类型)、对量化常数再量化一次(双重量化)、以及在显存紧张时把优化器状态分页到内存。它的巧妙之处在于:反向传播时把 4 bit 权重临时反量化成 bf16 参与计算,所以梯度精度并没有被牺牲。",
              "QLoRA's three ingredients: quantize the frozen base weights to 4 bits (NF4, a data type fitted to normally distributed weights), quantize the quantization constants again (double quantization), and page optimizer state to host memory under pressure. The elegance is that the 4-bit weights are dequantized to bf16 on the fly during backpropagation, so gradient precision is not sacrificed.")}
          </div></div>
        )}
        {optim === "adamw" && method !== "full" && (
          <div className="lm-step"><span className="sn">i</span><div>
            {L("注意 LoRA 下优化器状态已经很小了(只有可训练参数才有状态),所以这里换 8-bit Adam 的收益远不如全参微调时明显。省显存要对症下药:LoRA 的大头是权重和激活,不是优化器。",
              "Note that under LoRA the optimizer state is already tiny (only trainable parameters carry state), so switching to 8-bit Adam here helps far less than it does for full fine-tuning. Target the right term: under LoRA the bulk is weights and activations, not the optimizer.")}
          </div></div>
        )}
      </div>

      <p className="viz-caption">
        {L("这张账本值得你记住它的结构,因为它能回答一整类问题:「我这张卡能训什么」「为什么爆显存了」「该省哪一项」。四项加数各有各的省法:权重靠量化,梯度和优化器状态靠只训一小部分参数,激活靠重算和批大小。它们的相对大小随配置剧烈变化——全参微调时优化器状态是最大项,LoRA 时权重是最大项,长序列时激活是最大项。别背结论,记住这个加法。",
          "Memorise the structure of this ledger, because it answers a whole class of questions: what can this card train, why did it OOM, which term should I cut. Each of the four has its own lever: weights via quantization, gradients and optimizer state via training only a small subset, activations via checkpointing and batch size. Their relative sizes shift dramatically with configuration — optimizer state dominates full fine-tuning, weights dominate LoRA, activations dominate long sequences. Do not memorise conclusions; memorise the addition.")}
      </p>
    </div>
  );
};

/* =========================================================
   PE3 · peftCompare — methods, merging, multi-adapter serving
   ========================================================= */
const PEFT_METHODS = [
  {
    k: "full", zh: "全参微调", en: "Full fine-tuning",
    quality: 1.0, mem: 1.0, infer: 0, compose: 0, size: 1.0,
    note: { zh: "上限最高,尤其在数据量大、要学新能力时。代价是显存、每个任务一份完整权重、以及最高的遗忘风险。", en: "Highest ceiling, especially with large data and genuinely new capabilities. The price is memory, one full set of weights per task, and the highest forgetting risk." },
  },
  {
    k: "lora", zh: "LoRA", en: "LoRA",
    quality: 0.95, mem: 0.18, infer: 0.03, compose: 0.9, size: 0.002,
    note: { zh: "当前的默认选择:效果接近全参,显存降一个数量级,适配器几十 MB,可合并也可动态加载。", en: "Today's default: near-full quality, an order of magnitude less memory, adapters of tens of megabytes, mergeable or hot-loadable." },
  },
  {
    k: "qlora", zh: "QLoRA", en: "QLoRA",
    quality: 0.93, mem: 0.08, infer: 0.03, compose: 0.9, size: 0.002,
    note: { zh: "在 LoRA 之上把基座量化到 4 bit,单卡就能训 70B 级别。质量损失通常在 1–2 个点,训练速度慢一些。", en: "LoRA with a 4-bit base, putting 70B-class training on one card. Quality loss is usually one to two points; training is somewhat slower." },
  },
  {
    k: "prefix", zh: "前缀微调", en: "Prefix tuning",
    quality: 0.78, mem: 0.12, infer: 0.12, compose: 0.5, size: 0.0006,
    note: { zh: "只训一小段虚拟 token 的表示。参数最少,但它吃掉了一部分上下文窗口,而且在难任务上明显不如 LoRA。", en: "Trains only a short run of virtual token representations. Fewest parameters, but it consumes part of the context window and clearly trails LoRA on hard tasks." },
  },
  {
    k: "adapter", zh: "适配器层", en: "Adapter layers",
    quality: 0.9, mem: 0.2, infer: 0.15, compose: 0.6, size: 0.01,
    note: { zh: "在层间插入小网络。效果不错,但它改变了计算图,推理时有无法消除的额外延迟——这是 LoRA 后来胜出的关键。", en: "Inserts small networks between layers. Solid quality, but it changes the computation graph and adds inference latency that cannot be merged away — the key reason LoRA won." },
  },
];
const PeftCompareViz = () => {
  const L = useL();
  const lang = useLang();
  const [sel, setSel] = React.useState("lora");
  const [tenants, setTenants] = React.useState(30);
  const [merged, setMerged] = React.useState(false);

  const m = PEFT_METHODS.find((x) => x.k === sel);
  const baseGB = 14; // 7B bf16
  const perTenantGB = merged ? baseGB : baseGB * m.size;
  const totalGB = merged ? baseGB * tenants : baseGB + baseGB * m.size * tenants;
  const naiveGB = baseGB * tenants;
  const saving = 1 - totalGB / naiveGB;

  return (
    <div>
      <VizHead idx="PE3" title={L("方法对比与多适配器服务", "Comparing methods and serving many adapters")} />
      <span className="lm-label">{L("点选一种方法", "Pick a method")}</span>
      <div className="lm-pills">
        {PEFT_METHODS.map((x) => (
          <button key={x.k} className={`lm-pill click ${sel === x.k ? "on" : ""}`} onClick={() => setSel(x.k)}>{pick(lang, x)}</button>
        ))}
      </div>

      <table className="lm-matrix" style={{ marginTop: 12 }}>
        <thead>
          <tr>
            <th>{L("方法", "Method")}</th><th>{L("效果上限", "Quality")}</th><th>{L("训练显存", "Train VRAM")}</th>
            <th>{L("推理开销", "Inference cost")}</th><th>{L("可组合性", "Composability")}</th><th>{L("产物体积", "Artefact size")}</th>
          </tr>
        </thead>
        <tbody>
          {PEFT_METHODS.map((x) => (
            <tr key={x.k}>
              <td className={`rowh ${x.k === sel ? "on" : ""}`}>{pick(lang, x)}</td>
              <td className={x.k === sel ? "on" : ""}>{pct(x.quality)}</td>
              <td className={x.k === sel ? "on" : ""}>{pct(x.mem)}</td>
              <td className={x.k === sel ? "on" : ""}>{x.infer === 0 ? "0" : `+${pct(x.infer)}`}</td>
              <td className={x.k === sel ? "on" : ""}>{pct(x.compose)}</td>
              <td className={x.k === sel ? "on" : ""}>{x.size >= 1 ? "13 GB" : `${nf(13000 * x.size, 0)} MB`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="lm-note">{pick(lang, m.note)}</div>

      <span className="lm-label" style={{ marginTop: 16 }}>{L("多客户服务推演", "Multi-tenant serving simulation")}</span>
      <div className="viz-ctrl">
        <Slider label={L("客户数(每人一份微调)", "Tenants (one fine-tune each)")} min={1} max={200} step={1} value={tenants} onChange={setTenants} />
        <label><span>{L("部署方式", "Deployment")}</span>
          <Seg value={merged ? "m" : "d"} onChange={(v) => setMerged(v === "m")}
            options={[{ v: "d", l: L("动态加载适配器", "load adapters") }, { v: "m", l: L("合并回权重", "merge into weights") }]} /></label>
      </div>

      <div className="lm-bars" style={{ marginTop: 12 }}>
        <Bar label={L("每客户增量", "Per-tenant increment")} value={perTenantGB} max={Math.max(naiveGB, 1)} valText={`${nf(perTenantGB, perTenantGB < 1 ? 3 : 1)} GB`} />
        <Bar label={L("你的方案总占用", "Your total footprint")} value={totalGB} max={Math.max(naiveGB, 1)} tone="acc" valText={`${nf(totalGB, 1)} GB`} />
        <Bar label={L("每客户一份完整模型", "One full model per tenant")} value={naiveGB} max={Math.max(naiveGB, 1)} tone="warn" valText={`${nf(naiveGB, 0)} GB`} />
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(3, 1fr)" }}>
        <Kpi label={L("显存节省", "Memory saved")} value={pct(Math.max(0, saving))} tone={saving > 0.8 ? "ok" : saving <= 0 ? "warn" : ""} />
        <Kpi label={L("推理额外延迟", "Extra latency")} value={merged ? "0%" : `+${pct(m.infer)}`} tone={merged ? "ok" : ""} />
        <Kpi label={L("切换客户耗时", "Tenant switch")} value={merged ? L("需重新加载模型", "full model reload") : L("毫秒级", "milliseconds")}
          tone={merged ? "warn" : "ok"} />
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        <div className="lm-step now"><span className="sn">→</span><div>
          {merged
            ? L(`合并把 (α/r)·B·A 直接加回 W,推理时和一个普通模型完全一样——零额外延迟,任何推理框架都能跑。代价是失去了共享:${tenants} 个客户就是 ${nf(naiveGB, 0)} GB 权重,而且换客户要重新加载整个模型。合并适合「一个模型服务所有人」或者要交付给客户自己部署的场景。`,
              `Merging adds (α/r)·B·A straight back into W, so inference is indistinguishable from a plain model — zero added latency, runs in any framework. The cost is losing sharing: ${tenants} tenants means ${nf(naiveGB, 0)} GB of weights, and switching tenants reloads the whole model. Merge when one model serves everyone, or when you hand the weights to the customer.`)
            : L(`动态加载让 ${tenants} 个客户共享同一份基座,总占用只有 ${nf(totalGB, 1)} GB,比每人一份模型省 ${pct(saving)}。切换客户只是换一个几十 MB 的矩阵,毫秒级。代价是每次前向多算一个低秩分支(约 +${pct(m.infer)} 延迟),而且需要支持这件事的推理框架。`,
              `Dynamic loading lets ${tenants} tenants share one base, for a total of ${nf(totalGB, 1)} GB — ${pct(saving)} less than a model each. Switching tenants swaps a matrix of tens of megabytes, in milliseconds. The cost is one extra low-rank branch per forward pass (about +${pct(m.infer)} latency) and an inference stack that supports it.`)}
        </div></div>
        <div className="lm-step"><span className="sn">!</span><div>
          {L("关于「把两个 LoRA 叠起来同时用」:通常不奏效。两个适配器各自是在基座模型上训出来的,它们的更新方向没有理由正交,直接相加常常互相干扰,得到一个两边都不如的模型。要同时具备两种能力,正确做法是用两种能力的混合数据重新训一个。",
            "On stacking two LoRAs to get both behaviours: it usually does not work. Each adapter was trained against the base model and there is no reason their update directions are orthogonal; summing them typically produces interference and a model worse at both. To get both behaviours, retrain one adapter on a mixture of both datasets.")}
        </div></div>
      </div>

      <p className="viz-caption">
        {L("表格里最值得注意的一列是「推理开销」。适配器层和前缀微调都有一个无法消除的推理代价,而 LoRA 因为形式上就是一个加到权重上的低秩项,可以在部署时合并进 W,变成一个完全普通的模型——这个性质决定了它赢了这场竞赛。而下半部分的推演展示了它的另一面:不合并时,一个基座可以同时挂几十个适配器,让「每个客户一份专属模型」从一个成本上的笑话变成一个标准做法。这两种部署形态不是优劣,是两种不同的业务形状。",
          "The most consequential column is 'inference cost'. Adapter layers and prefix tuning both carry an unremovable inference penalty, while LoRA — being literally a low-rank term added to the weights — can be merged into W at deployment and become an entirely ordinary model. That property is why it won. The lower half shows the other side: unmerged, one base can carry dozens of adapters, turning 'a dedicated model per customer' from a cost joke into standard practice. These two deployment shapes are not better and worse; they are two different business shapes.")}
      </p>
    </div>
  );
};
