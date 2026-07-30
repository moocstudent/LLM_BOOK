/* =========================================================
   viz.jsx — interactive experiments ("训练场实验") for L1–L4
   ---------------------------------------------------------
   Dependency-free. Each chapter sets `viz: "<name>"` in
   data.jsx; the chapter page renders <Viz name={...} />.
   Every experiment computes its numbers live from its controls.
   L5–L8 experiments + the registry + <Viz> live in viz2.jsx,
   which index.html loads AFTER this file.
   ========================================================= */

/* ---------------- shared helpers ---------------- */
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const round1 = (x) => Math.round(x * 10) / 10;
const nf = (n, d = 2) => {
  if (!isFinite(n)) return "∞";
  const r = Math.abs(n) >= 1000 ? Math.round(n) : Math.round(n * 10 ** d) / 10 ** d;
  return r.toLocaleString("en-US", { maximumFractionDigits: d });
};
const pct = (x) => `${Math.round(x * 100)}%`;
// Compact byte / count formatting used by most of the memory experiments.
const gb = (bytes) => `${nf(bytes / 1024 ** 3, bytes / 1024 ** 3 < 10 ? 2 : 1)}`;
const big = (n) => {
  if (n >= 1e12) return `${nf(n / 1e12, 2)}T`;
  if (n >= 1e9) return `${nf(n / 1e9, 2)}B`;
  if (n >= 1e6) return `${nf(n / 1e6, 2)}M`;
  if (n >= 1e3) return `${nf(n / 1e3, 1)}K`;
  return nf(n, 0);
};
const softmax = (logits) => {
  const m = Math.max(...logits);
  const ex = logits.map((l) => Math.exp(l - m));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / s);
};
const entropy = (p) => 0 - p.reduce((s, x) => s + (x > 1e-12 ? x * Math.log2(x) : 0), 0);

// site language → inline bilingual label helper
function useL() {
  const lang = useLang();
  return (zh, en) => (lang === "zh" ? zh : en);
}

// A labelled slider (renders a <label>; wrap rows in .viz-ctrl).
function Slider({ label, min, max, step, value, onChange, unit, fmt }) {
  return (
    <label>
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step || 1} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} />
      <span className="val">{fmt ? fmt(value) : value}{unit || ""}</span>
    </label>
  );
}
// A labelled <select>. options: ["a"] or [{v,l}]
function Choice({ label, value, onChange, options }) {
  return (
    <label>
      <span>{label}</span>
      <select className="lm-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === "object" ? o.v : o;
          const l = typeof o === "object" ? o.l : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </label>
  );
}
// Segmented control. options: [{v,l}]
function Seg({ value, onChange, options }) {
  return (
    <div className="lm-seg">
      {options.map((o) => (
        <button key={o.v} className={value === o.v ? "on" : ""} onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}
function Big({ label, value, unit, tone }) {
  return (
    <div>
      <span className="lm-label">{label}</span>
      <span className={`lm-big ${tone || ""}`}>{value}{unit ? <span className="u">{unit}</span> : null}</span>
    </div>
  );
}
function Kpi({ label, value, unit, hint, tone, sel, onClick }) {
  return (
    <div className={`lm-kpi ${tone || ""} ${sel ? "sel" : ""}`} onClick={onClick}>
      <div className="k-label">{label}</div>
      <div className="k-val">{value}{unit ? <span className="k-unit">{unit}</span> : null}</div>
      {hint ? <div className="k-hint">{hint}</div> : null}
    </div>
  );
}
function Bar({ label, value, max, tone, valText }) {
  const w = clamp((value / (max || 1)) * 100, 0, 100);
  return (
    <div className="lm-bar-row">
      <span>{label}</span>
      <div className="b-track"><div className={`b-fill ${tone || ""}`} style={{ width: `${w}%` }} /></div>
      <span className="b-val">{valText !== undefined ? valText : nf(value, 1)}</span>
    </div>
  );
}
function VizHead({ idx, title }) {
  return <div className="viz-title"><span className="viz-title-idx">{idx}</span><span>{title}</span></div>;
}
// A small multi-series line plot on a 0..1 normalised y axis.
function LinePlot({ series, xLabel, yLabel, w = 560, h = 220, yMax, marker }) {
  const padL = 44, padB = 26, padT = 12, padR = 12;
  const n = Math.max(...series.map((s) => s.pts.length));
  const ymax = yMax || Math.max(...series.flatMap((s) => s.pts)) * 1.08 || 1;
  const X = (i) => padL + (i / Math.max(1, n - 1)) * (w - padL - padR);
  const Y = (v) => h - padB - (clamp(v / ymax, 0, 1)) * (h - padB - padT);
  return (
    <svg className="lm-svg" viewBox={`0 0 ${w} ${h}`} width="100%">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={padL} x2={w - padR} y1={Y(ymax * f)} y2={Y(ymax * f)} className="grid" />
          <text x={padL - 6} y={Y(ymax * f) + 4} textAnchor="end" className="lab">{nf(ymax * f, 2)}</text>
        </g>
      ))}
      {marker !== undefined && marker !== null && (
        <line x1={X(marker)} x2={X(marker)} y1={padT} y2={h - padB} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 3" />
      )}
      {series.map((s, si) => (
        <polyline key={si} fill="none" stroke={s.color} strokeWidth={s.width || 2}
          strokeDasharray={s.dash || "none"}
          points={s.pts.map((v, i) => `${X(i)},${Y(v)}`).join(" ")} />
      ))}
      <line x1={padL} x2={w - padR} y1={h - padB} y2={h - padB} stroke="var(--hairline)" />
      <text x={w - padR} y={h - 6} textAnchor="end" className="lab">{xLabel}</text>
      <text x={padL} y={padT + 2} className="lab">{yLabel}</text>
    </svg>
  );
}
function Legend({ items }) {
  return (
    <div className="lm-legend">
      {items.map((it, i) => (
        <span key={i}><span className="sw" style={{ background: it.color }} />{it.label}</span>
      ))}
    </div>
  );
}

/* =========================================================
   FM1 · attentionLab — softmax attention over one sentence
   ========================================================= */
const ATT_TOKENS = [
  { zh: "那只", en: "The" }, { zh: "猫", en: "cat" }, { zh: "追过", en: "that" },
  { zh: "老鼠", en: "chased" }, { zh: ",", en: "the" }, { zh: "它", en: "mouse" },
  { zh: "累了", en: "was" }, { zh: "。", en: "tired" },
];
// Hand-authored affinity a_ij in [0,5]: "how much does query i want key j".
// Row 5 ("它"/"mouse"→coreference) deliberately points back at the subject.
const ATT_AFF = [
  [2.0, 3.2, 0.6, 0.5, 0.3, 0.4, 0.5, 0.2],
  [1.8, 2.4, 1.2, 2.6, 0.4, 1.0, 1.4, 0.2],
  [0.5, 2.8, 1.4, 2.2, 0.6, 1.6, 0.6, 0.2],
  [0.6, 3.0, 1.6, 1.8, 0.8, 3.2, 0.7, 0.2],
  [0.4, 0.8, 0.5, 1.2, 1.0, 1.6, 0.6, 0.3],
  [0.9, 3.4, 0.8, 1.2, 0.5, 1.8, 1.2, 0.3],
  [0.7, 2.6, 0.6, 1.0, 0.4, 1.4, 1.8, 0.3],
  [0.5, 1.2, 0.4, 0.8, 0.4, 0.9, 1.6, 1.4],
];

const AttentionLabViz = () => {
  const L = useL();
  const lang = useLang();
  const [q, setQ] = React.useState(5);
  const [d, setD] = React.useState(64);
  const [scaled, setScaled] = React.useState(true);
  const [causal, setCausal] = React.useState(true);

  const row = ATT_AFF[q].map((a, j) => {
    if (causal && j > q) return -Infinity;
    // Raw dot products of d-dimensional vectors grow like √d; scaling divides it back out.
    return a * (scaled ? 1 : Math.sqrt(d));
  });
  const wts = softMaxSafe(row);
  const H = entropy(wts.filter((x) => x > 0));
  const maxW = Math.max(...wts);
  const effective = Math.pow(2, H); // effective number of positions attended

  return (
    <div>
      <VizHead idx="FM1" title={L("注意力热力图:一个 token 从哪里取信息", "Attention heat map: where one token fetches information")} />
      <div className="viz-ctrl">
        <Slider label={L("头维度 d", "Head dim d")} min={16} max={1024} step={16} value={d} onChange={setD} />
        <label><span>{L("除以 √d", "Divide by √d")}</span><Seg value={scaled ? "y" : "n"} onChange={(v) => setScaled(v === "y")}
          options={[{ v: "y", l: L("缩放", "scaled") }, { v: "n", l: L("不缩放", "raw") }]} /></label>
        <label><span>{L("因果掩码", "Causal mask")}</span><Seg value={causal ? "y" : "n"} onChange={(v) => setCausal(v === "y")}
          options={[{ v: "y", l: L("开", "on") }, { v: "n", l: L("关", "off") }]} /></label>
      </div>

      <span className="lm-label" style={{ marginTop: 12 }}>{L("点选查询 token(Q)", "Pick the query token (Q)")}</span>
      <div className="lm-pills">
        {ATT_TOKENS.map((t, i) => (
          <button key={i} className={`lm-pill ${i === q ? "on" : ""}`} onClick={() => setQ(i)}>{pick(lang, t)}</button>
        ))}
      </div>

      <div className="lm-bars" style={{ marginTop: 14 }}>
        {ATT_TOKENS.map((t, j) => (
          <Bar key={j} label={pick(lang, t)} value={wts[j] || 0} max={1}
            tone={wts[j] === maxW ? "acc" : (causal && j > q ? "mut" : "")}
            valText={causal && j > q ? "—" : pct(wts[j] || 0)} />
        ))}
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("最大权重", "Peak weight")} value={pct(maxW)} tone={maxW > 0.95 ? "warn" : "ok"} />
        <Kpi label={L("熵 (bits)", "Entropy (bits)")} value={nf(H, 2)} hint={L("越高越分散", "higher = more spread")} />
        <Kpi label={L("有效关注位置", "Effective positions")} value={nf(effective, 1)} hint={L("2^熵", "2^entropy")} />
        <Kpi label={L("可见位置", "Visible positions")} value={causal ? q + 1 : ATT_TOKENS.length} unit={`/${ATT_TOKENS.length}`} />
      </div>

      {!scaled && d > 128 && (
        <div className="lm-steps" style={{ marginTop: 12 }}>
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`不缩放时,d=${d} 让点积的量级放大约 √d≈${nf(Math.sqrt(d), 1)} 倍,softmax 直接坍缩成接近 one-hot:最大权重 ${pct(maxW)}。此时几乎所有位置的梯度都是 0,模型学不动——这就是 Transformer 论文里那个 1/√d 存在的唯一理由。`,
              `Unscaled, d=${d} inflates the dot products by about √d≈${nf(Math.sqrt(d), 1)}, so softmax collapses to near one-hot: peak weight ${pct(maxW)}. Gradients at almost every position go to zero and learning stalls — the sole reason the 1/√d factor exists in the Transformer paper.`)}
          </div></div>
        </div>
      )}

      <p className="viz-caption">
        {L("这里的相关性分数是手写的,但结构是真的:注意力就是「用 Q 和每个 K 的点积当分数,softmax 成权重,再对 V 加权求和」。选中「它 / mouse」这一行你会看到权重压倒性地落在主语上——这就是指代消解在模型内部的样子,没有任何语法规则,只有一次加权平均。因果掩码把未来的位置设成 -∞,保证预测第 n 个 token 时看不到第 n+1 个,否则训练时模型会直接抄答案。",
          "The affinity numbers here are hand-authored, but the structure is real: attention scores Q against every K by dot product, softmaxes them into weights, and returns a weighted sum of V. Select the coreference row and the weight lands overwhelmingly on the subject — that is what coreference resolution looks like inside the model: no grammar rules, just one weighted average. The causal mask sets future positions to -∞ so that predicting token n cannot see token n+1; without it the model simply copies the answer during training.")}
      </p>
    </div>
  );
};
// softmax that tolerates -Infinity (masked) entries
function softMaxSafe(logits) {
  const finite = logits.filter((x) => isFinite(x));
  const m = finite.length ? Math.max(...finite) : 0;
  const ex = logits.map((l) => (isFinite(l) ? Math.exp(l - m) : 0));
  const s = ex.reduce((a, b) => a + b, 0) || 1;
  return ex.map((e) => e / s);
}

/* =========================================================
   FM2 · tokenizerLab — how text becomes token ids
   ========================================================= */
const TOK_SAMPLES = [
  { k: "zh", zh: "中文", en: "Chinese", text: "大模型的微调不是往里灌知识,而是教它以什么方式回答问题。" },
  { k: "en", zh: "英文", en: "English", text: "Fine-tuning does not install knowledge; it teaches the model how to answer." },
  { k: "code", zh: "代码", en: "Code", text: "for i, (x, y) in enumerate(loader):\n    loss = model(x).log_softmax(-1)" },
  { k: "num", zh: "数字与专名", en: "Numbers & names", text: "订单 SO-20260731-004821 金额 1284736.55 元,负责人 Chengchuan。" },
];
// Heuristic tokenizer: runs of CJK / letters / digits / punctuation, merged by a
// vocabulary-size-dependent rule. Not a real BPE — the point is the ratios.
function tokenize(text, vocabK) {
  const out = [];
  const cjkMerge = vocabK >= 100 ? 2 : 1;          // bigger vocab merges CJK pairs
  const wordChunk = vocabK >= 100 ? 5 : vocabK >= 50 ? 4 : 3;
  const re = /([一-鿿]+)|([A-Za-z]+)|([0-9]+)|(\s+)|([^\s])/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m[1]) {
      for (let i = 0; i < m[1].length; i += cjkMerge) out.push({ t: m[1].slice(i, i + cjkMerge), k: "cjk" });
    } else if (m[2]) {
      const w = m[2];
      if (w.length <= wordChunk) out.push({ t: w, k: "word" });
      else for (let i = 0; i < w.length; i += wordChunk) out.push({ t: w.slice(i, i + wordChunk), k: "sub" });
    } else if (m[3]) {
      for (let i = 0; i < m[3].length; i += 3) out.push({ t: m[3].slice(i, i + 3), k: "num" });
    } else if (m[4]) {
      if (m[4].includes("\n")) out.push({ t: "⏎", k: "ws" });
    } else if (m[5]) {
      out.push({ t: m[5], k: "punc" });
    }
  }
  return out;
}

const TokenizerLabViz = () => {
  const L = useL();
  const lang = useLang();
  const [sample, setSample] = React.useState("zh");
  const [text, setText] = React.useState(TOK_SAMPLES[0].text);
  const [vocabK, setVocabK] = React.useState(100);
  const [price, setPrice] = React.useState(3);

  const pickSample = (k) => {
    setSample(k);
    const s = TOK_SAMPLES.find((x) => x.k === k);
    if (s) setText(s.text);
  };
  const toks = tokenize(text, vocabK);
  const chars = [...text.replace(/\s/g, "")].length;
  const ratio = toks.length ? chars / toks.length : 0;
  const monthly = (toks.length / 1e6) * price * 30 * 10000; // 10k calls/day
  const embedParams = vocabK * 1000 * 4096;

  return (
    <div>
      <VizHead idx="FM2" title={L("分词实验台:同一段话,几种语言几种账单", "Tokenization bench: one passage, several languages, several bills")} />
      <div className="viz-ctrl">
        <label><span>{L("样例", "Sample")}</span>
          <Seg value={sample} onChange={pickSample} options={TOK_SAMPLES.map((s) => ({ v: s.k, l: pick(lang, s) }))} />
        </label>
        <Slider label={L("词表大小", "Vocab size")} min={30} max={200} step={10} value={vocabK} onChange={setVocabK} fmt={(v) => `${v}K`} />
        <Slider label={L("单价 $/1M token", "Price $/1M tok")} min={0.2} max={20} step={0.2} value={price} onChange={setPrice} />
      </div>

      <textarea className="lm-input" style={{ width: "100%", minHeight: 70, marginTop: 12 }}
        value={text} onChange={(e) => setText(e.target.value)} />

      <span className="lm-label" style={{ marginTop: 12 }}>{L(`切分结果(${toks.length} 个 token)`, `Split result (${toks.length} tokens)`)}</span>
      <div className="lm-pills">
        {toks.slice(0, 120).map((t, i) => (
          <span key={i} className={`lm-pill mini ${t.k === "sub" ? "warn" : t.k === "cjk" ? "on" : ""}`}
            title={t.k}>{t.t === " " ? "␣" : t.t}</span>
        ))}
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("字符数", "Characters")} value={chars} />
        <Kpi label={L("token 数", "Tokens")} value={toks.length} tone="acc" />
        <Kpi label={L("字符/token", "Chars per token")} value={nf(ratio, 2)}
          tone={ratio < 1.2 ? "warn" : ratio > 3 ? "ok" : ""} hint={L("越高越省钱", "higher = cheaper")} />
        <Kpi label={L("月成本(1 万次/天)", "Monthly (10k calls/day)")} value={`$${nf(monthly, 0)}`} />
      </div>
      <div className="lm-note">
        {L(`词表 ${vocabK}K 时,嵌入矩阵本身就占 ${big(embedParams)} 参数(按 hidden=4096 算)——词表越大压缩率越好,但模型的输入输出层也越胖,这就是词表大小的取舍。`,
          `At ${vocabK}K vocabulary the embedding matrix alone holds ${big(embedParams)} parameters (hidden=4096) — a bigger vocabulary compresses better but fattens the model's input and output layers. That is the whole trade-off.`)}
      </div>

      <p className="viz-caption">
        {L("这个切分器是启发式的,但比例是真实的:同样信息量的中文和英文,token 数可以差一倍;代码里的缩进、括号、下划线会被切得很碎;长数字被按三位切开,所以模型算不准大数的加法。这也解释了那个著名的「数不清 strawberry 里有几个 r」——模型看到的不是字母序列,而是两三个不透明的整数编号。你的第一个成本估算永远从这里开始:token 数 × 单价 × 调用量。",
          "This splitter is heuristic, but the ratios are real: Chinese and English carrying the same information can differ twofold in token count; code gets shredded by indentation, brackets and underscores; long numbers split every three digits, which is why the model cannot add large numbers reliably. It also explains the famous failure to count the r's in 'strawberry' — the model sees not a letter sequence but two or three opaque integers. Every cost estimate you make starts here: tokens × price × volume.")}
      </p>
    </div>
  );
};

/* =========================================================
   FM3 · scalingLaw — parameters vs data vs compute
   ========================================================= */
const ScalingLawViz = () => {
  const L = useL();
  const [logN, setLogN] = React.useState(9.85);   // 7B
  const [logD, setLogD] = React.useState(12.15);  // ~1.4T
  const N = Math.pow(10, logN), D = Math.pow(10, logD);
  // Chinchilla-style parametric fit: L = E + A/N^a + B/D^b
  const lossOf = (n, d) => 1.69 + 406.4 / Math.pow(n, 0.34) + 410.7 / Math.pow(d, 0.28);
  const loss = lossOf(N, D);
  const C = 6 * N * D;
  const Nopt = Math.sqrt(C / 120);                 // C = 6·N·(20N)
  const Dopt = 20 * Nopt;
  const lossOpt = lossOf(Nopt, Dopt);
  const ratio = D / N;
  const gpuHours = C / (400e12 * 0.4 * 3600);      // H100 bf16 ~400 TFLOPs @ 40% MFU
  const cost = gpuHours * 2.5;
  const overtrained = ratio / 20;

  const curve = [];
  for (let i = 0; i <= 40; i++) {
    const n = Math.pow(10, 8 + (i / 40) * 3.2);
    curve.push(lossOf(n, C / (6 * n)));
  }
  const curveMinIdx = curve.indexOf(Math.min(...curve));

  return (
    <div>
      <VizHead idx="FM3" title={L("缩放沙盘:固定算力下,该做大还是该喂多", "Scaling sandbox: with compute fixed, grow the model or feed it more")} />
      <div className="viz-ctrl">
        <Slider label={L("参数量 N", "Parameters N")} min={8} max={11.2} step={0.05} value={logN} onChange={setLogN}
          fmt={(v) => big(Math.pow(10, v))} />
        <Slider label={L("训练 token D", "Training tokens D")} min={9} max={13.3} step={0.05} value={logD} onChange={setLogD}
          fmt={(v) => big(Math.pow(10, v))} />
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("预估损失", "Predicted loss")} value={nf(loss, 3)} tone="acc"
          hint={L("越低越好", "lower is better")} />
        <Kpi label={L("token/参数", "Tokens per param")} value={nf(ratio, 1)}
          tone={ratio < 5 ? "warn" : ratio > 100 ? "warn" : "ok"}
          hint={L("Chinchilla ≈ 20", "Chinchilla ≈ 20")} />
        <Kpi label={L("算力 6ND", "Compute 6ND")} value={`${nf(C / 1e21, 2)}`} unit="e21 FLOPs" />
        <Kpi label={L("H100 卡时 / 成本", "H100-hours / cost")} value={big(gpuHours)} unit={` · $${big(cost)}`} />
      </div>

      <div className="lm-grid2" style={{ marginTop: 14, alignItems: "start" }}>
        <div>
          <span className="lm-label">{L("同一笔算力下,损失随模型大小的变化", "Loss vs model size at this fixed compute")}</span>
          <LinePlot series={[{ pts: curve, color: "var(--accent)" }]} marker={curveMinIdx}
            xLabel={L("参数量 →", "params →")} yLabel={L("损失", "loss")} yMax={Math.max(...curve) * 1.05} h={200} />
          <div className="lm-note">
            {L(`这条 U 形曲线的最低点就是 Chinchilla 最优:N*≈${big(Nopt)}、D*≈${big(Dopt)},损失 ${nf(lossOpt, 3)}。你当前的配置比它${loss > lossOpt + 0.005 ? "差" : "好"} ${nf(Math.abs(loss - lossOpt), 3)}。`,
              `The bottom of this U is the Chinchilla optimum: N*≈${big(Nopt)}, D*≈${big(Dopt)}, loss ${nf(lossOpt, 3)}. Your current setting is ${nf(Math.abs(loss - lossOpt), 3)} ${loss > lossOpt + 0.005 ? "worse" : "better"} than that.`)}
          </div>
        </div>
        <div>
          <span className="lm-label">{L("三种典型配置", "Three characteristic regimes")}</span>
          <table className="lm-table">
            <thead><tr><th>{L("配置", "Regime")}</th><th>t/p</th><th>{L("损失", "Loss")}</th><th>{L("推理成本", "Inference")}</th></tr></thead>
            <tbody>
              {[
                { l: L("参数过剩", "Under-trained"), r: 3 },
                { l: L("Chinchilla 最优", "Chinchilla-optimal"), r: 20 },
                { l: L("过度训练(今天的主流)", "Over-trained (today's norm)"), r: 150 },
              ].map((row, i) => {
                const n = Math.sqrt(C / (6 * row.r));
                return (
                  <tr key={i} className={Math.abs(ratio - row.r) / row.r < 0.4 ? "hl" : ""}>
                    <td>{row.l}</td><td>{row.r}</td><td>{nf(lossOf(n, row.r * n), 3)}</td>
                    <td>{big(n)} {L("参数", "params")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="lm-note">
            {overtrained > 3
              ? L(`你现在过度训练了约 ${nf(overtrained, 1)} 倍。这不是错误——如果模型要服务几十亿次请求,用训练算力换一个更小的推理模型是完全正确的经济决策。`,
                `You are over-training by about ${nf(overtrained, 1)}×. That is not a mistake — if the model will serve billions of requests, trading training compute for a smaller inference model is exactly the right economics.`)
              : L("当前配比接近或低于 Chinchilla 最优,适合「只训一次、不大规模部署」的研究场景。", "Your ratio is at or below the Chinchilla optimum — appropriate for research runs that will not be deployed at scale.")}
          </div>
        </div>
      </div>

      <p className="viz-caption">
        {L("这条曲线是整个大模型经济学的地基。它说明三件事:第一,损失随规模是幂律下降的,没有悬崖也没有免费的突变;第二,给定算力预算,参数和数据存在唯一最优配比,偏离任何一边都在浪费钱;第三,而现实里几乎所有人都故意偏向「过度训练」,因为训练只付一次,推理要付一辈子。你以后每次看到一个模型规格,都可以用 6ND 反推它花了多少钱。",
          "This curve is the foundation of large-model economics. It says three things. First, loss falls as a power law in scale — no cliffs, no free discontinuities. Second, for a fixed compute budget there is a unique optimal split between parameters and data, and deviating either way wastes money. Third, nearly everyone deliberately deviates toward over-training, because training is paid once and inference is paid forever. From now on, any model spec you read can be reverse-costed with 6ND.")}
      </p>
    </div>
  );
};

/* =========================================================
   PT1 · dataPipeline — from raw crawl to training mixture
   ========================================================= */
const DataPipelineViz = () => {
  const L = useL();
  const [qual, setQual] = React.useState(0.55);
  const [dedup, setDedup] = React.useState(0.7);
  const [codeShare, setCodeShare] = React.useState(15);
  const [mathShare, setMathShare] = React.useState(6);
  const [decontam, setDecontam] = React.useState(true);

  const raw = 90e12;
  const extracted = raw * 0.42;                     // boilerplate/nav stripped
  const afterDedup = extracted * (1 - 0.52 * dedup);
  const afterQual = afterDedup * Math.pow(1 - qual, 0.75);
  const webShare = clamp(100 - codeShare - mathShare, 0, 100);
  const finalTokens = afterQual;

  // Quality index: filtering and dedup help; too much code/math starves language ability.
  const qIdx = clamp(
    0.34 + 0.30 * qual + 0.22 * dedup
    + 0.010 * Math.min(codeShare, 25) - 0.004 * Math.max(0, codeShare - 25)
    + 0.014 * Math.min(mathShare, 12) - 0.006 * Math.max(0, mathShare - 12)
    - (webShare < 55 ? (55 - webShare) * 0.006 : 0), 0, 1);
  const contamination = decontam ? 0.0004 : 0.021;
  const reasoning = clamp(0.28 + 0.016 * Math.min(codeShare, 30) + 0.022 * Math.min(mathShare, 15) + 0.15 * qual, 0, 1);

  const stages = [
    { l: L("原始抓取", "Raw crawl"), v: raw },
    { l: L("正文抽取", "Text extraction"), v: extracted },
    { l: L("去重", "Deduplication"), v: afterDedup },
    { l: L("质量过滤", "Quality filter"), v: afterQual },
  ];

  return (
    <div>
      <VizHead idx="PT1" title={L("数据流水线:90T token 进,几 T token 出", "Data pipeline: 90T tokens in, a few T out")} />
      <div className="viz-ctrl">
        <Slider label={L("质量过滤强度", "Quality filter")} min={0} max={0.9} step={0.05} value={qual} onChange={setQual} fmt={pct} />
        <Slider label={L("去重强度", "Dedup strength")} min={0} max={1} step={0.05} value={dedup} onChange={setDedup} fmt={pct} />
        <Slider label={L("代码占比", "Code share")} min={0} max={45} step={1} value={codeShare} onChange={setCodeShare} unit="%" />
        <Slider label={L("数学占比", "Maths share")} min={0} max={25} step={1} value={mathShare} onChange={setMathShare} unit="%" />
        <label><span>{L("评测集去污染", "Decontaminate")}</span>
          <Seg value={decontam ? "y" : "n"} onChange={(v) => setDecontam(v === "y")}
            options={[{ v: "y", l: L("开", "on") }, { v: "n", l: L("关", "off") }]} /></label>
      </div>

      <div className="lm-bars" style={{ marginTop: 14 }}>
        {stages.map((s, i) => (
          <Bar key={i} label={s.l} value={s.v} max={raw} tone={i === 3 ? "acc" : ""} valText={`${big(s.v)} tok`} />
        ))}
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("可训练 token", "Trainable tokens")} value={big(finalTokens)} tone="acc"
          hint={L(`原始的 ${pct(finalTokens / raw)}`, `${pct(finalTokens / raw)} of raw`)} />
        <Kpi label={L("质量指数", "Quality index")} value={pct(qIdx)} tone={qIdx > 0.75 ? "ok" : qIdx < 0.5 ? "warn" : ""} />
        <Kpi label={L("推理能力预估", "Projected reasoning")} value={pct(reasoning)} tone={reasoning > 0.7 ? "ok" : ""} />
        <Kpi label={L("评测污染残留", "Residual contamination")} value={pct(contamination)}
          tone={contamination > 0.005 ? "warn" : "ok"} />
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        {dedup < 0.35 && (
          <div className="lm-step now"><span className="sn">1</span><div>
            {L("去重开得太低。重复文档不只是浪费算力——高频重复的段落会被模型逐字背下来,既污染生成也带来隐私与版权风险。去重通常是这条流水线上性价比最高的一步。",
              "Dedup is too low. Duplicated documents do not merely waste compute — highly repeated passages get memorised verbatim, polluting generation and creating privacy and copyright exposure. Dedup is usually the highest-return step in the whole pipeline.")}
          </div></div>
        )}
        {qual > 0.8 && (
          <div className="lm-step now"><span className="sn">2</span><div>
            {L(`质量过滤到 ${pct(qual)} 时,只剩 ${big(finalTokens)} token。过滤器通常偏爱「像维基百科的文本」,过度过滤会把口语、多语言和长尾领域一起筛掉,模型会变得书面而脆弱。`,
              `At ${pct(qual)} filtering only ${big(finalTokens)} tokens survive. Quality classifiers tend to favour Wikipedia-like prose; over-filtering strips out speech, other languages and long-tail domains, leaving a model that is bookish and brittle.`)}
          </div></div>
        )}
        {(codeShare > 30 || webShare < 55) && (
          <div className="lm-step now"><span className="sn">3</span><div>
            {L(`代码 ${codeShare}% + 数学 ${mathShare}% 时自然语言只剩 ${webShare}%。代码和数学确实能提升结构化推理(这是被反复验证的),但挤掉太多自然语言会伤害日常对话与常识。`,
              `With ${codeShare}% code and ${mathShare}% maths, natural language is down to ${webShare}%. Code and maths genuinely improve structured reasoning — a repeatedly verified effect — but crowding out language hurts ordinary conversation and common sense.`)}
          </div></div>
        )}
        {!decontam && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L("关掉去污染后,评测集里的题目会出现在训练数据里。你的榜单分数会很好看,而客户第一次用真实问题测试时会当场发现落差。这是整个行业最常见的自欺。",
              "With decontamination off, benchmark items appear in the training data. Your leaderboard numbers will look excellent, and the gap will be exposed the first time a customer tests with real questions. This is the industry's commonest self-deception.")}
          </div></div>
        )}
      </div>

      <p className="viz-caption">
        {L("预训练的目标函数一行就能写完:最小化下一个 token 的交叉熵。所有难度都在数据这一侧。这个沙盘想让你记住三条:第一,90T 进、3T 出是正常的,数据工程主要是在扔东西;第二,去重的收益常常超过再加一份新数据;第三,配比是有代价的取舍,代码和数学买来推理能力,付出的是自然语言的份额。",
          "The pretraining objective fits on one line: minimise next-token cross-entropy. All the difficulty is on the data side. Three things to take away: 90T in and 3T out is normal — data engineering is mostly throwing things away; dedup often returns more than another fresh corpus would; and the mixture is a real trade — code and maths buy reasoning, paid for in natural-language share.")}
      </p>
    </div>
  );
};

/* =========================================================
   PT2 · computeBudget — FLOPs → GPU-hours → invoice
   ========================================================= */
const GPUS = [
  { v: "h100", l: "H100 SXM", tflops: 989, mem: 80, price: 2.5 },
  { v: "a100", l: "A100 80G", tflops: 312, mem: 80, price: 1.4 },
  { v: "l40s", l: "L40S", tflops: 366, mem: 48, price: 0.9 },
  { v: "4090", l: "RTX 4090", tflops: 165, mem: 24, price: 0.35 },
];
const ComputeBudgetViz = () => {
  const L = useL();
  const [logN, setLogN] = React.useState(9.85);
  const [logD, setLogD] = React.useState(12);
  const [gpu, setGpu] = React.useState("h100");
  const [mfu, setMfu] = React.useState(38);
  const [count, setCount] = React.useState(64);

  const N = Math.pow(10, logN), D = Math.pow(10, logD);
  const g = GPUS.find((x) => x.v === gpu);
  const C = 6 * N * D;
  const perGpu = g.tflops * 1e12 * 0.5 * (mfu / 100); // dense bf16 ≈ half of sparse peak
  const gpuHours = C / (perGpu * 3600);
  const wallDays = gpuHours / count / 24;
  const cost = gpuHours * g.price;
  const parts = [
    { l: L("前向 (2ND)", "Forward (2ND)"), v: 2 * N * D },
    { l: L("反向 (4ND)", "Backward (4ND)"), v: 4 * N * D },
  ];

  return (
    <div>
      <VizHead idx="PT2" title={L("算力预算:把一次训练换算成天数和账单", "Compute budget: turning a run into days and dollars")} />
      <div className="viz-ctrl">
        <Slider label={L("参数量 N", "Parameters N")} min={8} max={11.2} step={0.05} value={logN} onChange={setLogN} fmt={(v) => big(Math.pow(10, v))} />
        <Slider label={L("token 数 D", "Tokens D")} min={9} max={13.3} step={0.05} value={logD} onChange={setLogD} fmt={(v) => big(Math.pow(10, v))} />
        <Choice label={L("显卡", "GPU")} value={gpu} onChange={setGpu} options={GPUS} />
        <Slider label={L("利用率 MFU", "MFU")} min={10} max={60} step={1} value={mfu} onChange={setMfu} unit="%" />
        <Slider label={L("卡数", "GPU count")} min={1} max={1024} step={1} value={count} onChange={setCount} />
      </div>

      <div className="lm-bars" style={{ marginTop: 14 }}>
        {parts.map((p, i) => <Bar key={i} label={p.l} value={p.v} max={C} tone={i ? "acc" : ""} valText={`${nf(p.v / 1e21, 2)}e21`} />)}
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("总算力", "Total compute")} value={nf(C / 1e21, 2)} unit="e21" />
        <Kpi label={L("卡时", "GPU-hours")} value={big(gpuHours)} tone="acc" />
        <Kpi label={L("墙钟时间", "Wall-clock")} value={nf(wallDays, wallDays < 10 ? 1 : 0)} unit={L(" 天", " d")}
          tone={wallDays > 90 ? "warn" : wallDays < 14 ? "ok" : ""} />
        <Kpi label={L("成本", "Cost")} value={`$${big(cost)}`} hint={`@ $${g.price}/h`} />
      </div>

      <div className="lm-grid2" style={{ marginTop: 14, alignItems: "start" }}>
        <div>
          <span className="lm-label">{L("同样这笔预算能换成什么", "What the same budget buys elsewhere")}</span>
          <table className="lm-table">
            <thead><tr><th>{L("显卡", "GPU")}</th><th>{L("卡时", "Hours")}</th><th>{L("成本", "Cost")}</th><th>{L("天数", "Days")}</th></tr></thead>
            <tbody>
              {GPUS.map((x) => {
                const h = C / (x.tflops * 1e12 * 0.5 * (mfu / 100) * 3600);
                return (
                  <tr key={x.v} className={x.v === gpu ? "hl" : ""}>
                    <td>{x.l}</td><td>{big(h)}</td><td>${big(h * x.price)}</td><td>{nf(h / count / 24, 1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div>
          <span className="lm-label">{L("利用率去哪了", "Where utilisation goes")}</span>
          <div className="lm-bars">
            <Bar label={L("有效计算", "Useful compute")} value={mfu} max={100} tone="acc" valText={`${mfu}%`} />
            <Bar label={L("通信等待", "Communication")} value={clamp((100 - mfu) * 0.45, 0, 100)} max={100} valText={`${nf((100 - mfu) * 0.45, 0)}%`} />
            <Bar label={L("显存搬运", "Memory movement")} value={clamp((100 - mfu) * 0.35, 0, 100)} max={100} valText={`${nf((100 - mfu) * 0.35, 0)}%`} />
            <Bar label={L("流水线气泡", "Pipeline bubbles")} value={clamp((100 - mfu) * 0.2, 0, 100)} max={100} valText={`${nf((100 - mfu) * 0.2, 0)}%`} />
          </div>
          <div className="lm-note">
            {wallDays > 90
              ? L(`${nf(wallDays, 0)} 天的训练在实践中几乎跑不完:硬件会故障、数据会发现问题、目标会变。超过 60 天就该考虑加卡或缩规模。`,
                `A ${nf(wallDays, 0)}-day run rarely finishes in practice: hardware fails, data problems surface, goals change. Past 60 days, add GPUs or shrink the run.`)
              : L("MFU 40% 左右是大规模训练的常态,不是你调得不好。超过 50% 通常意味着你的模型或并行策略特别规整。",
                "An MFU near 40% is normal at scale, not a sign of poor tuning. Above 50% usually means an unusually regular model or parallelism scheme.")}
          </div>
        </div>
      </div>

      <p className="viz-caption">
        {L("6ND 的来源很朴素:每个参数在前向要参与一次乘和一次加(2 FLOPs),反向要算激活梯度和权重梯度,大约是前向的两倍(4 FLOPs)。整个大模型的成本感知就建立在这个乘法上。它最实用的用途不是预测,而是拦截:当你算出「这个实验要 180 天」时,你就在启动它之前救了自己两周。",
          "6ND is plain arithmetic: each parameter costs one multiply and one add in the forward pass (2 FLOPs), and the backward pass computes both activation and weight gradients, roughly twice that (4 FLOPs). All cost intuition for large models rests on this multiplication. Its most practical use is not prediction but interception: computing '180 days' saves you two weeks before you ever launch.")}
      </p>
    </div>
  );
};

/* =========================================================
   PT3 · lossCurve — reading training dynamics
   ========================================================= */
const LossCurveViz = () => {
  const L = useL();
  const [logLr, setLogLr] = React.useState(-4.3);
  const [warm, setWarm] = React.useState(6);
  const [epochs, setEpochs] = React.useState(3);
  const [size, setSize] = React.useState(3000);
  const [clip, setClip] = React.useState(true);

  const lr = Math.pow(10, logLr);
  const STEPS = 60;
  const stepsPerEpoch = STEPS / epochs;
  const lrRef = 2e-4;
  const speed = clamp(Math.pow(lr / lrRef, 0.55), 0.15, 3.2);
  const unstable = lr > 6e-4;
  const spikeAt = unstable && !clip ? Math.round(STEPS * (0.18 + 0.3 * Math.random() * 0)) : -1;
  const overfitPressure = clamp((epochs * 1000) / size, 0, 6);

  const train = [], val = [];
  for (let i = 0; i < STEPS; i++) {
    const warmF = i < (warm / 100) * STEPS ? (i + 1) / Math.max(1, (warm / 100) * STEPS) : 1;
    const prog = i / STEPS;
    let t = 0.55 + 1.55 * Math.exp(-3.1 * speed * prog * warmF);
    if (unstable) t += 0.13 * Math.sin(i * 1.7) * (clip ? 0.3 : 1) * (prog > warm / 100 ? 1 : 0.2);
    if (spikeAt > 0 && i >= spikeAt) t += clamp(1.9 - (i - spikeAt) * 0.02, 0.5, 1.9);
    const ep = i / stepsPerEpoch;
    const v = t + 0.06 + Math.max(0, ep - 1.05) * 0.10 * overfitPressure;
    train.push(clamp(t, 0.05, 3.2));
    val.push(clamp(v, 0.05, 3.4));
  }
  const bestIdx = val.indexOf(Math.min(...val));
  const bestEpoch = round1(bestIdx / stepsPerEpoch);
  const forgetting = clamp((lr / 4e-4) * 0.5 + Math.max(0, epochs - 3) * 0.07, 0, 1);

  const verdict = (() => {
    if (spikeAt > 0) return { t: "bad", zh: "损失尖峰后没有回落:学习率过大且没有梯度裁剪,权重已经被一次坏批次(或数值溢出)推到了不可恢复的位置。正确做法是回滚到上一个检查点、开裁剪、降学习率。", en: "The loss spiked and never recovered: the learning rate is too high with no gradient clipping, so one bad batch (or a numerical overflow) pushed the weights somewhere unrecoverable. Roll back to the last checkpoint, enable clipping, lower the rate." };
    if (unstable) return { t: "warn", zh: "曲线在震荡:学习率偏大。裁剪在替你兜着,但你在用不稳定换速度,最终损失通常更差。", en: "The curve oscillates: the learning rate is high. Clipping is covering for you, but you are trading stability for speed and the final loss is usually worse." };
    if (lr < 3e-5) return { t: "warn", zh: "下降太慢:学习率过小。在微调里这通常表现为「训完了跟没训一样」,而你会误以为是数据不够。", en: "Falling too slowly: the learning rate is too small. In fine-tuning this shows up as 'training changed nothing', and gets misdiagnosed as insufficient data." };
    if (val[STEPS - 1] > val[bestIdx] + 0.08) return { t: "warn", zh: `已经过拟合:验证损失在第 ${bestEpoch} 个 epoch 就到了最低点,之后开始上翘。继续训只是在背题。`, en: `Overfitting: validation loss bottomed at epoch ${bestEpoch} and turned upward. Further training only memorises the exam.` };
    return { t: "ok", zh: "这条曲线是健康的:训练与验证同步下降,验证尚未上翘。可以继续训,或者在这里停手保存检查点。", en: "This curve is healthy: train and validation fall together and validation has not turned. You can keep going, or stop and keep this checkpoint." };
  })();

  return (
    <div>
      <VizHead idx="PT3" title={L("训练曲线实验台:四种形状,四种病", "Loss-curve bench: four shapes, four diseases")} />
      <div className="viz-ctrl">
        <Slider label={L("学习率", "Learning rate")} min={-5.5} max={-2.8} step={0.05} value={logLr} onChange={setLogLr}
          fmt={(v) => Math.pow(10, v).toExponential(1)} />
        <Slider label={L("warmup", "Warmup")} min={0} max={20} step={1} value={warm} onChange={setWarm} unit="%" />
        <Slider label={L("epoch 数", "Epochs")} min={1} max={8} step={1} value={epochs} onChange={setEpochs} />
        <Slider label={L("数据条数", "Dataset size")} min={200} max={20000} step={200} value={size} onChange={setSize} />
        <label><span>{L("梯度裁剪", "Grad clipping")}</span>
          <Seg value={clip ? "y" : "n"} onChange={(v) => setClip(v === "y")}
            options={[{ v: "y", l: L("开", "on") }, { v: "n", l: L("关", "off") }]} /></label>
      </div>

      <div style={{ marginTop: 14 }}>
        <LinePlot
          series={[
            { pts: train, color: "var(--primary)" },
            { pts: val, color: "var(--accent)", dash: "5 4" },
          ]}
          marker={bestIdx} xLabel={L("训练步 →", "steps →")} yLabel={L("损失", "loss")} yMax={3.4} />
        <Legend items={[
          { color: "var(--primary)", label: L("训练损失", "train loss") },
          { color: "var(--accent)", label: L("验证损失(虚线)", "validation loss (dashed)") },
        ]} />
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 12, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("最终训练损失", "Final train loss")} value={nf(train[STEPS - 1], 3)} />
        <Kpi label={L("最佳验证损失", "Best val loss")} value={nf(val[bestIdx], 3)} tone="acc" />
        <Kpi label={L("最佳 epoch", "Best epoch")} value={bestEpoch} hint={L("早停点", "early stop here")} />
        <Kpi label={L("遗忘风险", "Forgetting risk")} value={pct(forgetting)} tone={forgetting > 0.6 ? "warn" : forgetting < 0.3 ? "ok" : ""} />
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        <div className={`lm-step ${verdict.t === "ok" ? "" : "now"}`}>
          <span className="sn">{verdict.t === "ok" ? "✓" : "!"}</span>
          <div>{L(verdict.zh, verdict.en)}</div>
        </div>
      </div>

      <p className="viz-caption">
        {L("读曲线是可以练出来的手艺,而且在微调里比在预训练里更值钱——微调迭代快,一次错误配置十分钟就能把一个好模型改坏,而你如果只看最终指标,根本不知道它是怎么坏的。请记住那条虚线:训练损失只告诉你模型在背什么,验证损失才告诉你它学到了什么。两条线分开的那一刻,就是你该停手的时刻。",
          "Reading curves is a learnable craft, and it pays better in fine-tuning than in pretraining — iterations are fast, one bad config ruins a good model in ten minutes, and if you only look at final metrics you will never know how it broke. Watch the dashed line: train loss tells you what the model is memorising, validation loss tells you what it learned. The moment they separate is the moment to stop.")}
      </p>
    </div>
  );
};

/* =========================================================
   IN1 · decodingLab — temperature, top-k, top-p
   ========================================================= */
const DEC_CTX = { zh: "提示:「客户的合同到期日是 2026 年 3 月 12 日。请抽取到期日:」", en: "Prompt: 'The contract expires on 12 March 2026. Extract the expiry date:'" };
const DEC_CANDS = [
  { t: "2026-03-12", logit: 9.1, ok: true },
  { t: "2026/03/12", logit: 6.4, ok: true },
  { t: "March", logit: 5.2, ok: true },
  { t: "12", logit: 4.6, ok: true },
  { t: "The", logit: 3.9, ok: false },
  { t: "2026-03-21", logit: 3.1, ok: false },
  { t: "2025-03-12", logit: 2.4, ok: false },
  { t: "unknown", logit: 1.6, ok: false },
  { t: "2026年", logit: 1.1, ok: true },
  { t: "\\n", logit: 0.4, ok: false },
];
const DecodingLabViz = () => {
  const L = useL();
  const lang = useLang();
  const [temp, setTemp] = React.useState(0.7);
  const [topK, setTopK] = React.useState(10);
  const [topP, setTopP] = React.useState(1);

  const scaled = DEC_CANDS.map((c) => c.logit / Math.max(0.05, temp));
  const base = softmax(scaled);
  // top-k then top-p (nucleus) truncation, then renormalise
  const order = base.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
  const keep = new Set();
  let cum = 0;
  order.forEach((o, rank) => {
    if (rank < topK && cum < topP) { keep.add(o.i); cum += o.p; }
  });
  const kept = base.map((p, i) => (keep.has(i) ? p : 0));
  const s = kept.reduce((a, b) => a + b, 0) || 1;
  const final = kept.map((p) => p / s);
  const H = entropy(final.filter((x) => x > 0));
  const riskMass = final.reduce((acc, p, i) => acc + (DEC_CANDS[i].ok ? 0 : p), 0);
  const deterministic = final.filter((p) => p > 0.001).length === 1;

  return (
    <div>
      <VizHead idx="IN1" title={L("采样实验台:同一份 logits,不同的人格", "Sampling bench: one set of logits, different personalities")} />
      <div className="lm-code" style={{ marginTop: 4 }}>{pick(lang, DEC_CTX)}</div>
      <div className="viz-ctrl" style={{ marginTop: 10 }}>
        <Slider label={L("温度 T", "Temperature T")} min={0.05} max={2} step={0.05} value={temp} onChange={setTemp} />
        <Slider label="top-k" min={1} max={10} step={1} value={topK} onChange={setTopK} />
        <Slider label="top-p" min={0.1} max={1} step={0.05} value={topP} onChange={setTopP} fmt={(v) => nf(v, 2)} />
      </div>

      <div className="lm-grid2" style={{ marginTop: 14, alignItems: "start" }}>
        <div>
          <span className="lm-label">{L("温度缩放后(截断前)", "After temperature (before truncation)")}</span>
          <div className="lm-bars">
            {DEC_CANDS.map((c, i) => (
              <Bar key={i} label={c.t} value={base[i]} max={1} valText={pct(base[i])} tone={c.ok ? "" : "warn"} />
            ))}
          </div>
        </div>
        <div>
          <span className="lm-label">{L("截断并重归一化后(实际采样分布)", "After truncation and renormalisation (actual sampling)")}</span>
          <div className="lm-bars">
            {DEC_CANDS.map((c, i) => (
              <Bar key={i} label={c.t} value={final[i]} max={1}
                valText={final[i] > 0 ? pct(final[i]) : "✕"} tone={final[i] === 0 ? "mut" : c.ok ? "acc" : "warn"} />
            ))}
          </div>
        </div>
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("保留候选", "Candidates kept")} value={keep.size} unit={`/${DEC_CANDS.length}`} />
        <Kpi label={L("熵 (bits)", "Entropy (bits)")} value={nf(H, 2)} hint={L("多样性", "diversity")} />
        <Kpi label={L("错误答案概率", "Wrong-answer mass")} value={pct(riskMass)} tone={riskMass > 0.15 ? "warn" : "ok"} />
        <Kpi label={L("确定性", "Deterministic")} value={deterministic ? L("是", "yes") : L("否", "no")} tone={deterministic ? "ok" : ""} />
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        {temp > 1.1 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`T=${nf(temp, 2)} 把分布拉平了,错误日期「2026-03-21」也拿到了 ${pct(final[5] || 0)} 的概率。抽取类任务应该用 T≤0.2:你要的是复现,不是创造。`,
              `T=${nf(temp, 2)} flattens the distribution and the wrong date '2026-03-21' now carries ${pct(final[5] || 0)}. Extraction tasks want T≤0.2: you need reproduction, not creativity.`)}
          </div></div>
        )}
        {temp <= 0.15 && (
          <div className="lm-step"><span className="sn">✓</span><div>
            {L("低温几乎等价于贪心解码:输出稳定、可复现,适合抽取、分类、结构化输出。代价是文本会重复、乏味,写作类任务不要这么设。",
              "Low temperature is nearly greedy decoding: stable, reproducible output, right for extraction, classification and structured output. The price is repetitive, flat text — do not use it for writing.")}
          </div></div>
        )}
        {topP < 0.6 && (
          <div className="lm-step"><span className="sn">i</span><div>
            {L(`top-p=${nf(topP, 2)} 只保留累计概率前 ${pct(topP)} 的候选(这里是 ${keep.size} 个)。它比 top-k 更聪明的地方在于:分布尖的时候自动少留,分布平的时候自动多留。`,
              `top-p=${nf(topP, 2)} keeps only the candidates covering the first ${pct(topP)} of probability mass (${keep.size} here). It beats top-k by adapting: it keeps few when the distribution is sharp and many when it is flat.`)}
          </div></div>
        )}
      </div>

      <p className="viz-caption">
        {L("很多被报告成「模型幻觉」的问题,其实是这三个旋钮设错了。模型每一步给出的是整个词表上的分布,而幻觉往往是尾部的一个低概率错误答案被采样到了——你没改模型,只是改了骰子。请把它当成一条纪律:抽取和分类用低温 + 贪心;写作和头脑风暴用 T≈0.8 + top-p 0.9;而任何需要复现的评估,必须固定温度并记录随机种子,否则你比较的是两次抽样噪声。",
          "Many reported 'hallucinations' are really these three knobs. At each step the model emits a distribution over the whole vocabulary, and a hallucination is often a low-probability wrong answer in the tail that got sampled — you did not change the model, only the dice. Make it a discipline: extraction and classification get low temperature and greedy decoding; writing and brainstorming get T≈0.8 with top-p 0.9; and any evaluation that must be reproducible fixes the temperature and records the seed, or you are comparing two samples of noise.")}
      </p>
    </div>
  );
};

/* =========================================================
   IN2 · kvCache — where the inference memory goes
   ========================================================= */
const IN_MODELS = [
  { v: "1b", l: "1.5B", params: 1.5e9, layers: 28, hidden: 2048, kvHeads: 4, headDim: 128 },
  { v: "7b", l: "7B", params: 7e9, layers: 32, hidden: 4096, kvHeads: 8, headDim: 128 },
  { v: "13b", l: "13B", params: 13e9, layers: 40, hidden: 5120, kvHeads: 10, headDim: 128 },
  { v: "70b", l: "70B", params: 70e9, layers: 80, hidden: 8192, kvHeads: 8, headDim: 128 },
];
const KvCacheViz = () => {
  const L = useL();
  const [mv, setMv] = React.useState("7b");
  const [batch, setBatch] = React.useState(16);
  const [ctxK, setCtxK] = React.useState(8);
  const [wBits, setWBits] = React.useState(16);
  const [kvBits, setKvBits] = React.useState(16);
  const [gpuMem, setGpuMem] = React.useState(80);

  const m = IN_MODELS.find((x) => x.v === mv);
  const ctx = ctxK * 1024;
  const wBytes = m.params * (wBits / 8);
  const kvPerTok = 2 * m.layers * m.kvHeads * m.headDim * (kvBits / 8);
  const kvBytes = kvPerTok * ctx * batch;
  const actBytes = batch * m.hidden * 2 * 40 * 1024; // rough transient working set
  const total = wBytes + kvBytes + actBytes;
  const budget = gpuMem * 1024 ** 3;
  const oom = total > budget;
  const maxBatch = Math.max(0, Math.floor((budget - wBytes - actBytes) / (kvPerTok * ctx)));
  // decode is memory-bandwidth bound: one pass over the weights per step, shared across the batch
  const bw = 3.35e12; // ~3.35 TB/s (HBM3)
  const tokPerSec = (bw / wBytes) * clamp(batch / (1 + batch / 48), 1, 40);
  const ttft = (2 * m.params * ctx) / (400e12 * 0.5) * 1000; // prefill ms, compute-bound

  return (
    <div>
      <VizHead idx="IN2" title={L("KV 缓存账本:并发数为什么会突然掉下来", "KV cache ledger: why concurrency suddenly collapses")} />
      <div className="viz-ctrl">
        <Choice label={L("模型", "Model")} value={mv} onChange={setMv} options={IN_MODELS} />
        <Slider label={L("并发批大小", "Batch size")} min={1} max={128} step={1} value={batch} onChange={setBatch} />
        <Slider label={L("上下文长度", "Context length")} min={1} max={128} step={1} value={ctxK} onChange={setCtxK} fmt={(v) => `${v}K`} />
        <Slider label={L("权重精度", "Weight bits")} min={4} max={16} step={4} value={wBits} onChange={setWBits} unit=" bit" />
        <Slider label={L("KV 精度", "KV bits")} min={8} max={16} step={8} value={kvBits} onChange={setKvBits} unit=" bit" />
        <Slider label={L("显存", "GPU memory")} min={24} max={640} step={8} value={gpuMem} onChange={setGpuMem} unit=" GB" />
      </div>

      <div className="lm-bars" style={{ marginTop: 14 }}>
        <Bar label={L("模型权重", "Weights")} value={wBytes} max={budget} valText={`${gb(wBytes)} GB`} />
        <Bar label={L("KV 缓存", "KV cache")} value={kvBytes} max={budget} tone={kvBytes > wBytes ? "warn" : "acc"} valText={`${gb(kvBytes)} GB`} />
        <Bar label={L("激活与运行时", "Activations & runtime")} value={actBytes} max={budget} valText={`${gb(actBytes)} GB`} />
        <Bar label={L("合计 / 显存", "Total / capacity")} value={total} max={budget} tone={oom ? "warn" : "ok"} valText={`${gb(total)} / ${gpuMem} GB`} />
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("每 token KV", "KV per token")} value={nf(kvPerTok / 1024, 0)} unit=" KB" />
        <Kpi label={L("最大并发", "Max batch")} value={maxBatch} tone={maxBatch < batch ? "warn" : "ok"}
          hint={L(`在 ${ctxK}K 上下文下`, `at ${ctxK}K context`)} />
        <Kpi label={L("解码吞吐", "Decode throughput")} value={nf(tokPerSec, 0)} unit=" tok/s" />
        <Kpi label={L("首 token 延迟", "Time to first token")} value={nf(ttft, 0)} unit=" ms" tone={ttft > 2000 ? "warn" : ""} />
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        {oom && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`超出显存 ${gb(total - budget)} GB。这个配置根本起不来。要么把并发降到 ${maxBatch}、要么把上下文缩短、要么把 KV 量化到 8 bit(立刻省一半)。`,
              `Over capacity by ${gb(total - budget)} GB — this configuration will not start. Drop the batch to ${maxBatch}, shorten the context, or quantize the KV cache to 8 bits (an instant halving).`)}
          </div></div>
        )}
        {kvBytes > wBytes && (
          <div className="lm-step now"><span className="sn">i</span><div>
            {L(`KV 缓存(${gb(kvBytes)} GB)已经超过模型权重(${gb(wBytes)} GB)。这是长上下文服务的典型状态,也是为什么「支持 128K 上下文」和「能同时服务 100 个人」通常不能兼得。`,
              `The KV cache (${gb(kvBytes)} GB) now exceeds the weights (${gb(wBytes)} GB). That is the normal state of long-context serving, and why 'supports 128K context' and 'serves 100 users at once' usually cannot both be true.`)}
          </div></div>
        )}
        <div className="lm-step"><span className="sn">✓</span><div>
          {L(`prefill 是算力瓶颈(${nf(ttft, 0)} ms 几乎全花在处理这 ${ctxK}K 输入上),decode 是带宽瓶颈(每生成一个 token 都要把 ${gb(wBytes)} GB 权重完整读一遍)。这就是批处理有效的原因:一次读权重,服务整批请求。`,
            `Prefill is compute-bound (${nf(ttft, 0)} ms goes almost entirely into processing those ${ctxK}K input tokens); decode is bandwidth-bound (every generated token reads all ${gb(wBytes)} GB of weights). That is exactly why batching works: one pass over the weights serves the whole batch.`)}
        </div></div>
      </div>

      <p className="viz-caption">
        {L("KV 缓存是推理侧最容易被忽略的那笔钱。它随「批大小 × 上下文长度 × 层数」线性增长,和模型大小几乎无关——所以小模型开长上下文一样会爆显存。理解这张账本,你才能回答客户那个最常见的问题:「我们要支持 100 个人同时用,还要 32K 上下文,需要几张卡?」——这道题现在你可以在纸上算完。",
          "The KV cache is the most overlooked cost on the inference side. It grows linearly in batch × context × layers and barely depends on model size — so a small model with long context blows up memory just as readily. Understanding this ledger is what lets you answer the customer's most common question: 'we need 100 concurrent users at 32K context — how many GPUs?' You can now finish that on paper.")}
      </p>
    </div>
  );
};

/* =========================================================
   IN3 · quantLab — quality for cost
   ========================================================= */
const QuantLabViz = () => {
  const L = useL();
  const [bits, setBits] = React.useState(4);
  const [group, setGroup] = React.useState(128);
  const [mv, setMv] = React.useState("7b");
  const [qat, setQat] = React.useState(false);

  const m = IN_MODELS.find((x) => x.v === mv);
  const scaleOverhead = (16 / group) * 2 / 8;                       // bytes per weight for scales/zeros
  const bytesPerW = bits / 8 + (bits < 16 ? scaleOverhead : 0);
  const mem = m.params * bytesPerW;
  const mem16 = m.params * 2;
  // Smaller models and lower bit widths degrade more; QAT recovers roughly half.
  const sizeFactor = Math.pow(7e9 / m.params, 0.35);
  const rawPpl = bits >= 16 ? 0 : (bits === 8 ? 0.05 : bits === 12 ? 0.02 : bits === 4 ? 1.6 : 6.5) * sizeFactor * (group <= 64 ? 0.75 : group >= 256 ? 1.35 : 1);
  const ppl = rawPpl * (qat ? 0.45 : 1);
  const speed = bits >= 16 ? 1 : 16 / bits * 0.82;
  const tasks = [
    { zh: "对话与摘要", en: "Chat & summarisation", s: 0.3 },
    { zh: "分类与抽取", en: "Classification & extraction", s: 0.6 },
    { zh: "代码生成", en: "Code generation", s: 1.3 },
    { zh: "多步数学", en: "Multi-step maths", s: 2.1 },
    { zh: "长上下文检索", en: "Long-context retrieval", s: 1.8 },
  ];

  return (
    <div>
      <VizHead idx="IN3" title={L("量化实验台:省下的显存,代价是什么", "Quantization bench: what the saved memory costs")} />
      <div className="viz-ctrl">
        <Choice label={L("模型", "Model")} value={mv} onChange={setMv} options={IN_MODELS} />
        <label><span>{L("位宽", "Bit width")}</span>
          <Seg value={String(bits)} onChange={(v) => setBits(parseInt(v))}
            options={[{ v: "16", l: "bf16" }, { v: "8", l: "int8" }, { v: "4", l: "int4" }, { v: "3", l: "int3" }]} /></label>
        <Choice label={L("分组大小", "Group size")} value={String(group)} onChange={(v) => setGroup(parseInt(v))}
          options={[{ v: "32", l: "32" }, { v: "64", l: "64" }, { v: "128", l: "128" }, { v: "256", l: "256" }]} />
        <label><span>{L("量化感知训练", "QAT")}</span>
          <Seg value={qat ? "y" : "n"} onChange={(v) => setQat(v === "y")}
            options={[{ v: "n", l: L("训练后量化", "PTQ") }, { v: "y", l: "QAT" }]} /></label>
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("权重显存", "Weight memory")} value={gb(mem)} unit=" GB" tone="acc"
          hint={L(`bf16 是 ${gb(mem16)} GB`, `bf16 needs ${gb(mem16)} GB`)} />
        <Kpi label={L("压缩比", "Compression")} value={`${nf(mem16 / mem, 2)}×`} />
        <Kpi label={L("困惑度上升", "Perplexity rise")} value={`+${nf(ppl, 2)}%`}
          tone={ppl > 3 ? "warn" : ppl < 0.6 ? "ok" : ""} />
        <Kpi label={L("解码加速", "Decode speed-up")} value={`${nf(speed, 2)}×`} hint={L("带宽受限场景", "bandwidth-bound")} />
      </div>

      <span className="lm-label" style={{ marginTop: 14 }}>{L("任务敏感度(同一份量化,不同任务的退化差很多)", "Task sensitivity (same quantization, very different degradation)")}</span>
      <div className="lm-bars">
        {tasks.map((t, i) => (
          <Bar key={i} label={L(t.zh, t.en)} value={ppl * t.s} max={8} tone={ppl * t.s > 3 ? "warn" : ppl * t.s < 0.8 ? "ok" : ""}
            valText={ppl * t.s < 0.4 ? L("基本无损", "no visible loss") : `-${nf(ppl * t.s, 1)}%`} />
        ))}
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        {bits === 4 && (
          <div className="lm-step"><span className="sn">✓</span><div>
            {L(`4 bit 是当前的甜点:显存降到 ${nf(mem16 / mem, 1)} 分之一,对话和摘要基本无损。但注意上表——数学和长上下文的退化是对话的 5 倍以上,如果这是你的主场景,必须实测而不是照抄结论。`,
              `4-bit is today's sweet spot: memory down to a ${nf(mem16 / mem, 1)}th with no visible loss on chat and summarisation. But look at the table — maths and long context degrade over five times as much. If those are your workload, measure rather than borrow a conclusion.`)}
          </div></div>
        )}
        {bits === 3 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L("3 bit 通常已经过线:退化开始出现在肉眼可见的层面(算错、格式漂移、长文本中途失去指令)。要更小的模型,应该换一个真正更小的模型或者做蒸馏,而不是继续压位宽。",
              "3-bit is usually past the line: degradation becomes visible (arithmetic errors, format drift, losing the instruction mid-document). If you need smaller, switch to a genuinely smaller model or distil — do not keep shaving bits.")}
          </div></div>
        )}
        {m.params < 3e9 && bits <= 4 && (
          <div className="lm-step now"><span className="sn">i</span><div>
            {L("小模型对量化更敏感:它本来就没有多少冗余容量。同样 4 bit,7B 几乎无损,而 1.5B 会明显变笨。",
              "Small models are more quantization-sensitive: they have little redundant capacity to spare. The same 4-bit is nearly lossless at 7B and visibly damaging at 1.5B.")}
          </div></div>
        )}
        <div className="lm-step"><span className="sn">→</span><div>
          {L("不管你选哪一档,量化之后必须重跑一遍你自己的评估集。量化是一次真实的模型改动,而它的退化恰恰集中在最难自查的地方:偶发的算错和长文本里的指令遗忘。",
            "Whatever you pick, rerun your own eval set afterwards. Quantization is a real model change, and its damage concentrates exactly where self-inspection is hardest: occasional arithmetic errors and instructions forgotten deep in long documents.")}
        </div></div>
      </div>

      <p className="viz-caption">
        {L("量化的机制很朴素:把一组浮点权重按最大值缩放成低位整数,再存一个缩放因子。分组越小,缩放因子越贴合局部分布,精度越高但存储开销越大——这就是分组大小的取舍。它之所以几乎免费,是因为大模型的权重存在大量冗余;它之所以不完全免费,是因为少数关键权重(离群值)对精度极其敏感。微调之后你会再次面对这张表:先微调,再量化,然后用同一套评估集把两步的退化分开量。",
          "The mechanism is plain: scale a group of float weights by their maximum into low-bit integers and store one scale factor. Smaller groups fit the local distribution better — higher accuracy, more overhead. That is the group-size trade-off. It is nearly free because large-model weights carry substantial redundancy; it is not entirely free because a few outlier weights are extremely precision-sensitive. You will meet this table again after fine-tuning: tune first, quantize second, and use the same eval set to attribute the loss to each step.")}
      </p>
    </div>
  );
};
