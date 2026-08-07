/* =========================================================
   figures.jsx — static lecture figures (L1–L3, lm1–lm8)
   ---------------------------------------------------------
   Every chapter's notes (content/lm<N>.<lang>.md) carry 1–3
   lines of the form

       @fig lm1-qkv

   which pages.jsx replaces with <Figure name="lm1-qkv" />.
   Each figure is a dependency-free, theme-aware SVG whose
   labels follow the site language (useL() from viz.jsx).

   Load order: viz.jsx (defines useL) → figures*.jsx →
   pages.jsx. figures3.jsx holds the FIGN registry export and
   the <Figure> component.
   ========================================================= */

/* ---------------- shared primitives ---------------- */
const FIGN = {};                       // figure key -> component
const FMK = React.createContext("");   // per-figure arrow-marker id suffix

// Frame: bordered SVG canvas + optional numbered bilingual caption.
// The viewBox height is grown after layout to whatever the content actually
// needs — English labels wrap onto more lines than the Chinese ones, so one
// fixed height would clip in one language and waste space in the other.
function FigFrame({ w = 660, h = 240, cap, idx, children }) {
  const L = useL();
  const lang = useLang();
  const gRef = React.useRef(null);
  const [vh, setVh] = React.useState(h);
  React.useLayoutEffect(() => {
    const g = gRef.current;
    if (!g || !g.getBBox) return;
    try {
      const bb = g.getBBox();
      setVh(Math.max(h, Math.ceil(bb.y + bb.height + 12)));
    } catch (e) { /* not laid out yet */ }
  });
  React.useEffect(() => { setVh(h); }, [h, lang]);
  const raw = React.useId();
  const uid = raw.replace(/[^a-zA-Z0-9]/g, "");
  return (
    <figure className="lm-fig">
      <svg className="lm-fig-svg" viewBox={`0 0 ${w} ${vh}`} width="100%"
        preserveAspectRatio="xMidYMid meet" role="img">
        <defs>
          {[["am", "var(--muted)"], ["aa", "var(--accent)"], ["ap", "var(--primary)"]].map(([k, c]) => (
            <marker key={k} id={`${k}${uid}`} viewBox="0 0 10 10" refX="9.2" refY="5"
              markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 Z" fill={c} />
            </marker>
          ))}
        </defs>
        <g ref={gRef}><FMK.Provider value={uid}>{children}</FMK.Provider></g>
      </svg>
      {cap ? (
        <figcaption>
          {idx ? <span className="fno">{L(`图 ${idx}`, `Fig. ${idx}`)}</span> : null}
          {cap}
        </figcaption>
      ) : null}
    </figure>
  );
}

// Advance width per glyph [latin, CJK] by text class, measured against the
// rendered fonts with a ~5% margin. Used to break a line before it runs off
// the frame — a CJK glyph is roughly twice a latin one, so the two languages
// need genuinely different break points.
const FW = { tn: [6.3, 10.5], tm: [6.9, 12.2], tk: [6.9, 13.1], ta: [6.9, 13.1], tp: [6.9, 13.1], t: [6.2, 12.7], ts: [5.6, 11.7], tt: [6.8, 13.8] };
const fwide = (ch) => /[⺀-鿿　-〿！-｠]/.test(ch);
function fwrap(s, maxW, c) {
  const [aw, cw] = FW[c] || FW.tn;
  const wOf = (t) => Array.from(t).reduce((a, ch) => a + (fwide(ch) ? cw : aw), 0);
  const toks = [];
  let buf = "";
  for (const ch of s) {
    if (fwide(ch)) { if (buf) toks.push(buf); toks.push(ch); buf = ""; }
    else if (ch === " ") { toks.push(buf + ch); buf = ""; }
    else buf += ch;
  }
  if (buf) toks.push(buf);
  const lines = [];
  let cur = "", curW = 0;
  for (const t of toks) {
    const tw = wOf(t);
    if (curW + tw > maxW && cur.trim()) { lines.push(cur.replace(/\s+$/, "")); cur = ""; curW = 0; }
    cur += t; curW += tw;
  }
  if (cur.trim()) lines.push(cur.replace(/\s+$/, ""));
  return lines;
}

// Text. c = class (t / ts / tn / tm / tk / ta / tp / tt), a = anchor.
// Pass w to wrap the string onto as many 14px lines as it needs.
const FT = ({ x, y, c = "t", a = "start", w, children, ...r }) => {
  const flat = Array.isArray(children)
    ? (children.every((k) => typeof k === "string" || typeof k === "number") ? children.join("") : null)
    : (typeof children === "string" ? children : null);
  if (w && flat) {
    const lines = fwrap(flat, w, c);
    if (lines.length > 1) {
      return (
        <text x={x} y={y} textAnchor={a} className={c} {...r}>
          {lines.map((ln, i) => <tspan key={i} x={x} dy={i ? 14 : 0}>{ln}</tspan>)}
        </text>
      );
    }
  }
  return <text x={x} y={y} textAnchor={a} className={c} {...r}>{children}</text>;
};

// Labelled box. k = tone ("" | p | a | m | g); t = label, s = sub-label.
// Both labels wrap to the box width and the stack re-centres vertically, so a
// long English string does not run out over the border.
const FB = ({ x, y, w, h, k = "", t, s, tc = "t", r = 3 }) => {
  const cx = x + w / 2;
  const tl = typeof t === "string" ? fwrap(t, w - 12, tc) : (t !== undefined ? [t] : []);
  const sl = typeof s === "string" ? fwrap(s, w - 12, "tn") : (s !== undefined ? [s] : []);
  const total = tl.length * 14 + sl.length * 13;
  let cy = y + h / 2 - total / 2 + 11;
  const rows = [];
  tl.forEach((ln, i) => { rows.push({ y: cy + i * 14, t: ln, c: tc }); });
  cy += tl.length * 14;
  sl.forEach((ln, i) => { rows.push({ y: cy + i * 13 - 1, t: ln, c: "tn" }); });
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={r} className={`bx ${k}`} />
      {rows.map((row, i) => (
        <text key={i} x={cx} y={row.y} textAnchor="middle" className={row.c}>{row.t}</text>
      ))}
    </g>
  );
};

// Straight arrow. k = "" | a | p, d = dashed.
const FA = ({ x1, y1, x2, y2, k = "", d }) => {
  const uid = React.useContext(FMK);
  const mk = k === "a" ? "aa" : k === "p" ? "ap" : "am";
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className={`ln ${k} ${d ? "d" : ""}`}
    markerEnd={`url(#${mk}${uid})`} />;
};

// Arrow along an arbitrary path (residual arcs, feedback loops).
const FAP = ({ d, k = "", dash }) => {
  const uid = React.useContext(FMK);
  const mk = k === "a" ? "aa" : k === "p" ? "ap" : "am";
  return <path d={d} className={`ln ${k} ${dash ? "d" : ""}`} markerEnd={`url(#${mk}${uid})`} />;
};

// A column of bars sharing one baseline — used by every distribution figure.
const FBars = ({ x, base, bw, gap, vals, hmax, k = "fp", labels, op }) => (
  <g>
    {vals.map((v, i) => {
      const bh = Math.max(1, v * hmax);
      const bx = x + i * (bw + gap);
      return (
        <g key={i}>
          <rect x={bx} y={base - bh} width={bw} height={bh} className={k}
            fillOpacity={op ? op(v, i) : 1} />
          {labels && <text x={bx + bw / 2} y={base + 13} textAnchor="middle" className="tn">{labels[i]}</text>}
        </g>
      );
    })}
  </g>
);

// polyline point string from a sampled function
const fpath = (n, fx, fy) => Array.from({ length: n }, (_, i) => `${fx(i)},${fy(i)}`).join(" ");

/* =========================================================
   FM1 · lm1 — Transformer 与注意力
   ========================================================= */

// 1. the Q/K/V dataflow of one attention head
FIGN["lm1-qkv"] = ({ idx }) => {
  const L = useL();
  const tk = [0, 1, 2, 3];
  return (
    <FigFrame h={252} idx={idx}
      cap={L("一个注意力头的数据流:每个 token 分出 Q/K/V,Q 与所有 K 打分并缩放,softmax 得到一行和为 1 的权重,再用它对所有 V 加权求和。",
        "The dataflow of one attention head: every token emits Q/K/V; Q scores against all K, is scaled, softmaxed into a row of weights that sums to 1, and used to average all V.")}>
      <FT x={16} y={22} c="tk">Attention(Q,K,V) = softmax(QKᵀ/√d)·V</FT>

      <FT x={48} y={54} c="tn" a="middle">{L("输入 token", "input tokens")}</FT>
      {tk.map((i) => <FB key={i} x={18} y={62 + i * 32} w={60} h={26} k="m" t={`x${i + 1}`} tc="tm" />)}

      {[["Q", L("我在找什么", "what I want"), 0], ["K", L("我能提供什么", "what I offer"), 1], ["V", L("我带的信息", "what I carry"), 2]]
        .map(([t, s, i]) => (
          <g key={t}>
            <FB x={120} y={58 + i * 56} w={92} h={42} k="p" t={t} s={s} tc="tt" />
            <FA x1={80} y1={120} x2={118} y2={79 + i * 56} />
          </g>
        ))}

      <FB x={250} y={70} w={98} h={44} t={L("Q·Kᵀ / √d", "Q·Kᵀ / √d")} s={L("相关性分数", "affinity scores")} tc="tk" />
      <FA x1={214} y1={79} x2={248} y2={86} />
      <FA x1={214} y1={135} x2={248} y2={100} />

      <FB x={376} y={70} w={84} h={44} t="softmax" s={L("行和 = 1", "row sums to 1")} tc="tk" />
      <FA x1={350} y1={92} x2={374} y2={92} />

      <FBars x={378} base={150} bw={16} gap={5} vals={[0.06, 0.72, 0.16, 0.06]} hmax={30} k="fa"
        op={(v) => 0.35 + v * 0.65} />
      <FT x={420} y={166} c="tn" a="middle">α = (.06 .72 .16 .06)</FT>
      <FA x1={418} y1={116} x2={418} y2={118} />

      <FB x={330} y={186} w={150} h={40} k="a" t={L("Σ αⱼ · vⱼ", "Σ αⱼ · vⱼ")} s={L("加权求和", "weighted sum")} tc="tk" />
      <FA x1={418} y1={172} x2={418} y2={184} />
      <FA x1={166} y1={172} x2={166} y2={206} />
      <FAP d="M166 206 L 328 206" />

      <FB x={520} y={186} w={100} h={40} k="p" t={L("输出向量", "output vector")} tc="ts" />
      <FA x1={482} y1={206} x2={518} y2={206} />
      <FT x={644} y={54} c="tn" a="end">{L("代价与距离无关", "cost is distance-independent")}</FT>
    </FigFrame>
  );
};

// 2. why the √d divisor exists
FIGN["lm1-scale"] = ({ idx }) => {
  const L = useL();
  const spike = [0.002, 0.003, 0.004, 0.985, 0.003, 0.001, 0.001, 0.001];
  const flat = [0.07, 0.09, 0.12, 0.34, 0.15, 0.10, 0.08, 0.05];
  const panel = (x0, vals, title, note, tone) => (
    <g>
      <FB x={x0} y={40} w={276} h={26} k={tone === "fa" ? "a" : "p"} t={title} tc="tm" />
      <line x1={x0 + 10} y1={186} x2={x0 + 266} y2={186} className="axis" />
      <FBars x={x0 + 22} base={186} bw={22} gap={8} vals={vals} hmax={104} k={tone}
        labels={["k₁", "k₂", "k₃", "k₄", "k₅", "k₆", "k₇", "k₈"]} />
      <FT x={x0 + 138} y={214} c="tn" a="middle">{note}</FT>
    </g>
  );
  return (
    <FigFrame h={230} idx={idx}
      cap={L("d 维点积的标准差是 √d,所以维度越高分数越大;不缩放时 softmax 塌成 one-hot,除自己以外所有位置的梯度都归零。除以 √d 把方差拉回 1,让 softmax 回到敏感区间。",
        "A d-dimensional dot product has standard deviation √d, so scores grow with width; unscaled, softmax collapses to one-hot and every other position's gradient vanishes. Dividing by √d pulls the variance back to 1.")}>
      <FT x={16} y={24} c="tt">{L("同一组分数,d = 1024", "the same scores, d = 1024")}</FT>
      {panel(20, spike, L("不缩放 · QKᵀ", "unscaled · QKᵀ"), L("最大权重 98.5% · 熵 ≈ 0.1 bit · 梯度消失", "peak 98.5% · entropy ≈ 0.1 bit · gradients vanish"), "fa")}
      {panel(364, flat, L("缩放 · QKᵀ/√d", "scaled · QKᵀ/√d"), L("最大权重 34% · 熵 ≈ 2.7 bit · 可学习", "peak 34% · entropy ≈ 2.7 bit · learnable"), "fp")}
    </FigFrame>
  );
};

// 3. one complete pre-norm block
FIGN["lm1-block"] = ({ idx }) => {
  const L = useL();
  return (
    <FigFrame h={214} idx={idx}
      cap={L("一个标准 pre-norm block:注意力在位置之间搬信息,FFN 在单个位置上做变换并存住大部分「知识」,残差连接让梯度直达底层——这是能堆到 80 层的前提。",
        "A standard pre-norm block: attention moves information between positions, the FFN transforms each position and holds most of the \"knowledge\", and the residual paths let gradients reach the bottom — the reason 80 layers are possible.")}>
      <FT x={16} y={24} c="tt">{L("一层 = 两个子层 + 两条残差", "one layer = two sublayers + two residuals")}</FT>

      <FT x={22} y={126} c="tm" w={622}>x</FT>
      <FA x1={34} y1={121} x2={66} y2={121} />
      <FB x={68} y={100} w={44} h={42} k="m" t="LN" s="pre" tc="tk" />
      <FA x1={112} y1={121} x2={140} y2={121} />
      <FB x={142} y={100} w={116} h={42} k="p" t={L("注意力", "Attention")} s={L("位置之间搬信息", "moves info across")} tc="tt" />
      <FA x1={258} y1={121} x2={282} y2={121} />
      <circle cx={296} cy={121} r={13} className="bx a" />
      <FT x={296} y={126} c="tk" a="middle">+</FT>
      <FA x1={310} y1={121} x2={336} y2={121} />
      <FB x={338} y={100} w={44} h={42} k="m" t="LN" s="pre" tc="tk" />
      <FA x1={382} y1={121} x2={406} y2={121} />
      <FB x={408} y={100} w={124} h={42} k="p" t={L("前馈 FFN ×4", "FFN, 4× wide")} s={L("约 2/3 参数 · 存知识", "~2/3 of params · knowledge")} tc="tt" />
      <FA x1={532} y1={121} x2={556} y2={121} />
      <circle cx={570} cy={121} r={13} className="bx a" />
      <FT x={570} y={126} c="tk" a="middle">+</FT>
      <FA x1={584} y1={121} x2={620} y2={121} />
      <FT x={640} y={126} c="tm" a="end">x′</FT>

      <FAP d="M50 112 C50 58 170 52 296 52 L296 106" k="a" />
      <FAP d="M322 112 C322 58 450 52 570 52 L570 106" k="a" />
      <FT x={172} y={44} c="ta" w={472}>{L("残差", "residual")}</FT>
      <FT x={448} y={44} c="ta" w={196}>{L("残差", "residual")}</FT>

      <FT x={16} y={190} c="tn" w={628}>{L("x = x + Attention(LN(x))   →   x = x + FFN(LN(x))   →   堆 N 层", "x = x + Attention(LN(x))   →   x = x + FFN(LN(x))   →   stack N layers")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   FM2 · lm2 — 分词与嵌入
   ========================================================= */

FIGN["lm2-ids"] = ({ idx }) => {
  const L = useL();
  const toks = L(["预训", "练", "是", "昂贵", "的"], ["Pre", "train", "ing", " is", " costly"]);
  const ids = [15496, 2213, 318, 1663, 13];
  return (
    <FigFrame h={236} idx={idx}
      cap={L("模型从来没有见过字符:文本先被切成 token,每个 token 只是词表里的一个编号,编号再去嵌入矩阵里取出一行向量。所有语义都从这一行开始。",
        "The model never sees characters: text is split into tokens, each token is just an index into the vocabulary, and the index fetches one row of the embedding matrix. All meaning starts from that row.")}>
      <FT x={16} y={24} c="tt">{L("文本 → token → id → 向量", "text → token → id → vector")}</FT>

      <FB x={16} y={54} w={150} h={40} k="m" t={L("「预训练是昂贵的」", "\"Pretraining is costly\"")} tc="ts" />
      <FT x={91} y={110} c="tn" a="middle">{L("原始文本", "raw text")}</FT>
      <FA x1={168} y1={74} x2={196} y2={74} />

      {toks.map((t, i) => (
        <g key={i}>
          <FB x={200 + i * 62} y={54} w={56} h={40} k="p" t={t} tc="ts" />
          <FT x={228 + i * 62} y={110} c="tn" a="middle">{ids[i]}</FT>
          <FA x1={228 + i * 62} y1={118} x2={228 + i * 62} y2={140} />
        </g>
      ))}
      <FT x={196} y={44} c="tn" w={448}>{L("5 个 token", "5 tokens")}</FT>

      <FB x={196} y={144} w={368} h={30} k="a" t={L("查表:E[id] — 嵌入矩阵的第 id 行", "lookup: E[id] — row `id` of the embedding matrix")} tc="tm" />

      <g>
        {Array.from({ length: 5 }).map((_, r) => (
          <g key={r}>
            {Array.from({ length: 12 }).map((_, c) => (
              <rect key={c} x={200 + c * 30} y={190 + r * 7} width={28} height={5}
                className={r === 1 ? "fa" : "fm"} fillOpacity={r === 1 ? 0.9 : 0.35} />
            ))}
          </g>
        ))}
        <FT x={190} y={205} c="tn" a="end">E</FT>
        <FT x={196} y={228} c="tn" w={448}>{L("V × d,V 通常 3 万–20 万,d 通常 2k–8k", "V × d — V is typically 30k–200k, d is 2k–8k")}</FT>
      </g>
    </FigFrame>
  );
};

FIGN["lm2-tradeoff"] = ({ idx }) => {
  const L = useL();
  const X = (f) => 70 + f * 500;
  return (
    <FigFrame h={228} idx={idx}
      cap={L("按字符切:词表小但序列长得离谱;按词切:序列短但词表爆炸且永远有未登录词。子词是这条曲线上唯一同时可接受的一段。",
        "Split by character: a tiny vocabulary but absurdly long sequences. Split by word: short sequences but an exploding vocabulary and permanent out-of-vocabulary words. Subwords are the only segment where both are tolerable.")}>
      <FT x={16} y={24} c="tt">{L("粒度的取舍", "the granularity trade-off")}</FT>
      <line x1={60} y1={178} x2={600} y2={178} className="axis" />
      <FT x={62} y={198} c="tn" w={582}>{L("字符 / 字节", "character / byte")}</FT>
      <FT x={330} y={198} c="ta" a="middle">{L("子词 subword", "subword")}</FT>
      <FT x={600} y={198} c="tn" a="end">{L("整词", "whole word")}</FT>

      <rect x={X(0.42)} y={46} width={X(0.72) - X(0.42)} height={132} className="areaa" />
      <FT x={X(0.57)} y={62} c="ta" a="middle">{L("BPE 的落点 · 3万–20万", "where BPE lands · 30k–200k")}</FT>

      {/* vocabulary grows left→right (rises on screen); sequence length shrinks */}
      <polyline className="cv" points={fpath(41, (i) => X(i / 40), (i) => 170 - 112 * Math.pow(i / 40, 0.55))} />
      <polyline className="cv a" points={fpath(41, (i) => X(i / 40), (i) => 60 + 110 * Math.pow(i / 40, 0.7))} />
      <FT x={92} y={86} c="ta" w={200}>{L("序列长度:长", "sequence length: long")}</FT>
      <FT x={92} y={166} c="tp" w={200}>{L("词表:几百个符号", "vocab: a few hundred symbols")}</FT>
      <FT x={584} y={92} c="tp" a="end">{L("词表 ↑ 到百万级", "vocab ↑ to millions")}</FT>
      <FT x={584} y={168} c="ta" a="end">{L("序列 ↓ 但 OOV ↑", "shorter, but OOV ↑")}</FT>
      <FT x={16} y={216} c="tn" w={628}>{L("注意力代价 ∝ n²,所以序列长度这一侧的惩罚是平方的。", "Attention costs ∝ n², so the penalty on the sequence-length side is quadratic.")}</FT>
    </FigFrame>
  );
};

FIGN["lm2-bpe"] = ({ idx }) => {
  const L = useL();
  const rows = [
    { n: L("初始:全部拆成字符", "start: everything as characters"), cells: ["l", "o", "w", "e", "s", "t"], hi: [] },
    { n: L("合并 1:(e,s) 出现最频繁", "merge 1: (e,s) is the most frequent pair"), cells: ["l", "o", "w", "es", "t"], hi: [3] },
    { n: L("合并 2:(es,t)", "merge 2: (es,t)"), cells: ["l", "o", "w", "est"], hi: [3] },
    { n: L("合并 3:(l,o) → 继续几万次", "merge 3: (l,o) → repeat tens of thousands of times"), cells: ["lo", "w", "est"], hi: [0] },
  ];
  return (
    <FigFrame h={246} idx={idx}
      cap={L("BPE 没有语言学:它只是在语料上反复找出最高频的相邻符号对并合并,直到词表达到设定大小。「常见的词整块保留,罕见的词碎成片」是这个贪心过程的副产物。",
        "BPE contains no linguistics: it repeatedly finds the most frequent adjacent pair in the corpus and merges it, until the vocabulary reaches its target size. \"Common words stay whole, rare words shatter\" is a by-product of that greedy loop.")}>
      <FT x={16} y={24} c="tt">{L("BPE:统计驱动的贪心合并", "BPE: statistics-driven greedy merging")}</FT>
      {rows.map((r, ri) => (
        <g key={ri}>
          <FT x={16} y={62 + ri * 44} c="tn">{r.n}</FT>
          {r.cells.map((c, ci) => (
            <FB key={ci} x={360 + ci * 48} y={46 + ri * 44} w={44} h={26}
              k={r.hi.includes(ci) ? "a" : "m"} t={c} tc="tk" />
          ))}
        </g>
      ))}
      <FA x1={382} y1={74} x2={382} y2={88} k="a" />
      <FA x1={526} y1={118} x2={526} y2={132} k="a" />
      <FT x={16} y={228} c="tn" w={628}>{L("后果:数字被切碎 → 算术差;非英语语种 token 更多 → 同样内容更贵;拼写任务天然吃亏。",
        "Consequences: digits get shredded → weak arithmetic; non-English text needs more tokens → the same content costs more; spelling tasks start at a disadvantage.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   FM3 · lm3 — 缩放定律
   ========================================================= */

FIGN["lm3-powerlaw"] = ({ idx }) => {
  const L = useL();
  const X = (f) => 70 + f * 520;
  const Y = (loss) => 180 - (loss - 1.5) / (4.2 - 1.5) * 140;  // loss 4.2 at the top, 1.5 at the axis
  const lossAt = (f) => 1.72 + 2.6 * Math.pow(10, -1.35 * f);
  return (
    <FigFrame h={244} idx={idx}
      cap={L("双对数坐标上,损失随算力沿一条直线下降——这就是幂律。直线不通向 0:它渐近于一个不可约的下界(语言本身的熵)。每往下压一点,代价按数量级增长。",
        "On log–log axes the loss falls along a straight line as compute grows — that is the power law. The line does not reach zero: it approaches an irreducible floor (the entropy of language itself). Each further step down costs an order of magnitude.")}>
      <FT x={16} y={24} c="tt">{L("损失 vs 算力(双对数)", "loss vs compute (log–log)")}</FT>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={X(f)} y1={40} x2={X(f)} y2={182} className="grid" />
      ))}
      <line x1={70} y1={182} x2={590} y2={182} className="axis" />
      <line x1={70} y1={40} x2={70} y2={182} className="axis" />
      {["10²⁰", "10²¹", "10²²", "10²³", "10²⁴"].map((t, i) => (
        <FT key={t} x={X(i / 4)} y={198} c="tn" a="middle">{t}</FT>
      ))}
      <FT x={330} y={216} c="tn" a="middle">{L("训练算力 C (FLOPs)", "training compute C (FLOPs)")}</FT>
      <FT x={64} y={46} c="tn" a="end">4.2</FT>
      <FT x={64} y={186} c="tn" a="end">1.5</FT>
      <FT x={16} y={38} c="tn">{L("损失", "loss")}</FT>

      <polyline className="cv" points={fpath(61, (i) => X(i / 60), (i) => Y(lossAt(i / 60)))} />
      <line x1={70} y1={Y(1.72)} x2={590} y2={Y(1.72)} className="cv m" />
      <FT x={586} y={Y(1.72) - 7} c="tm" a="end">{L("不可约损失 E ≈ 1.7", "irreducible loss E ≈ 1.7")}</FT>

      <line x1={X(0.25)} y1={Y(lossAt(0.25))} x2={X(0.5)} y2={Y(lossAt(0.25))} className="ln a d" />
      <line x1={X(0.5)} y1={Y(lossAt(0.25))} x2={X(0.5)} y2={Y(lossAt(0.5))} className="ln a d" />
      <circle cx={X(0.25)} cy={Y(lossAt(0.25))} r={4} className="fa" />
      <circle cx={X(0.5)} cy={Y(lossAt(0.5))} r={4} className="fa" />
      <FT x={X(0.38)} y={Y(lossAt(0.25)) - 8} c="ta" a="middle">{L("算力 ×100", "compute ×100")}</FT>
      <FT x={X(0.52)} y={Y(lossAt(0.38))} c="ta">{L("损失 −0.5", "loss −0.5")}</FT>
      <FT x={16} y={234} c="tn" w={628}>{L("L(C) = E + A·C^(−α):可外推,所以小规模实验能预测大规模结果。", "L(C) = E + A·C^(−α): it extrapolates, which is why small runs can predict large ones.")}</FT>
    </FigFrame>
  );
};

FIGN["lm3-chinchilla"] = ({ idx }) => {
  const L = useL();
  const X = (f) => 70 + f * 470;
  const Y = (loss) => 182 - loss * 90;           // higher loss sits higher on screen
  // Three iso-FLOP curves, each drawn over a window around its own optimum.
  // A bigger budget reaches a lower floor AND puts that floor at a larger N —
  // the rightward drift of the minima is the whole point of the figure.
  const curves = [
    { c: 0.30, floor: 0.86, lab: "C = 1e21" },
    { c: 0.50, floor: 0.68, lab: "C = 1e22" },
    { c: 0.70, floor: 0.50, lab: "C = 1e23" },
  ];
  const WIN = 0.28;
  const u = (cu, f) => cu.floor + 6 * Math.pow(f - cu.c, 2);
  return (
    <FigFrame h={240} idx={idx}
      cap={L("固定算力预算,把它在「参数量」和「数据量」之间怎么分是一条 U 形曲线。Chinchilla 的结论就是这些最低点的连线:每个参数大约配 20 个 token。",
        "For a fixed compute budget, splitting it between parameters and data traces a U. Chinchilla's result is the line through those minima: roughly 20 tokens per parameter.")}>
      <FT x={16} y={24} c="tt">{L("等算力曲线:参数量该占多大", "iso-FLOP curves: how big should N be")}</FT>
      <line x1={70} y1={182} x2={560} y2={182} className="axis" />
      <line x1={70} y1={40} x2={70} y2={182} className="axis" />
      <FT x={16} y={38} c="tn">{L("损失", "loss")}</FT>
      <FT x={315} y={214} c="tn" a="middle">{L("参数量 N(数据量 D = C/6N 随之确定)", "parameters N (D = C/6N follows)")}</FT>
      <FT x={78} y={198} c="tn" w={566}>{L("小模型 · 多数据", "small model · lots of data")}</FT>
      <FT x={556} y={198} c="tn" a="end">{L("大模型 · 少数据", "big model · little data")}</FT>

      {curves.map((cu, i) => (
        <g key={i}>
          <polyline className={`cv ${i === 1 ? "" : "m"}`}
            points={fpath(41, (j) => X(cu.c - WIN + (j / 40) * 2 * WIN),
              (j) => Y(u(cu, cu.c - WIN + (j / 40) * 2 * WIN)))} />
          <circle cx={X(cu.c)} cy={Y(cu.floor)} r={4.5} className="fa" />
          <FT x={X(cu.c) + 10} y={Y(cu.floor) + 14} c="tn">{cu.lab}</FT>
        </g>
      ))}
      <polyline className="ln a d" fill="none"
        points={curves.map((cu) => `${X(cu.c)},${Y(cu.floor)}`).join(" ")} />
      <FT x={X(0.72)} y={Y(0.50) + 24} c="ta" w={200}>{L("最优点连线 · D ≈ 20 N", "line of optima · D ≈ 20 N")}</FT>
      <FT x={16} y={232} c="tn" w={628}>{L("今天大家故意偏离它:训练只花一次钱,推理要付一辈子,所以模型压小、数据加多。",
        "Everyone deliberately departs from it today: training is paid once, inference forever — so shrink the model and add data.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   PT1 · lm4 — 预训练数据
   ========================================================= */

FIGN["lm4-funnel"] = ({ idx }) => {
  const L = useL();
  const stages = [
    { w: 1.00, t: L("原始抓取", "raw crawl"), n: L("~100% · 数 PB HTML", "~100% · petabytes of HTML") },
    { w: 0.62, t: L("抽正文 + 语种过滤", "extraction + language ID"), n: L("去掉导航、广告、模板", "drop nav, ads, boilerplate") },
    { w: 0.34, t: L("去重(精确 + 近似)", "dedup (exact + near)"), n: L("重复样本会被记住而不是学会", "duplicates get memorised, not learned") },
    { w: 0.16, t: L("质量过滤", "quality filtering"), n: L("分类器 / 困惑度 / 启发式", "classifier / perplexity / heuristics") },
    { w: 0.09, t: L("去污染", "decontamination"), n: L("剔除与评测集重叠的片段", "strip anything overlapping the eval sets") },
  ];
  return (
    <FigFrame h={272} idx={idx}
      cap={L("预训练数据工程的绝大部分工作是扔东西:从 PB 级抓取到最终可用 token,通常只剩百分之几。去重和去污染这两步不是洁癖,它们直接决定模型是「学会」还是「背下」。",
        "Most of the work in pretraining data is throwing things away: from petabytes of crawl to usable tokens, a few percent typically survives. Dedup and decontamination are not fastidiousness — they decide whether the model learns or memorises.")}>
      <FT x={16} y={24} c="tt">{L("数据流水线:主要动作是丢弃", "the pipeline is mostly discarding")}</FT>
      {stages.map((s, i) => {
        const full = 300, cx = 200;
        const w = full * s.w, y = 44 + i * 40;
        return (
          <g key={i}>
            <rect x={cx - w / 2} y={y} width={w} height={30} rx={2}
              className={i === 4 ? "bx a" : "bx p"} />
            <FT x={cx} y={y + 19} c="tm" a="middle">{`${Math.round(s.w * 100)}%`}</FT>
            <FT x={370} y={y + 13} c="t">{s.t}</FT>
            <FT x={370} y={y + 26} c="tn">{s.n}</FT>
            {i < stages.length - 1 && <FA x1={cx} y1={y + 30} x2={cx} y2={y + 38} />}
          </g>
        );
      })}
      <FT x={200} y={258} c="ta" a="middle">{L("最终:几万亿可用 token", "final: a few trillion usable tokens")}</FT>
      <FT x={370} y={258} c="tn" w={274}>{L("代码与数学被刻意超采样", "code and maths are deliberately oversampled")}</FT>
    </FigFrame>
  );
};

FIGN["lm4-contam"] = ({ idx }) => {
  const L = useL();
  return (
    <FigFrame h={216} idx={idx}
      cap={L("污染是技术问题不是道德问题:评测题目本身在网上,抓取时自然被收进训练集。模型于是在「回忆」而不是「解题」,榜单分数与真实能力脱钩,而你只有在自建的私有评测集上才看得出来。",
        "Contamination is a technical problem, not a moral one: benchmark items live on the web and get swept into the crawl. The model then recalls instead of solving, the leaderboard decouples from real ability, and only a private eval set reveals it.")}>
      <FT x={16} y={24} c="tt">{L("为什么榜单会虚高", "why leaderboards inflate")}</FT>
      <circle cx={180} cy={110} r={66} className="bx p" />
      <circle cx={286} cy={110} r={48} className="bx a" />
      <FT x={132} y={114} c="tm" a="middle">{L("训练语料", "train corpus")}</FT>
      <FT x={310} y={106} c="tm" a="middle">{L("评测集", "eval set")}</FT>
      <FT x={310} y={120} c="tm" a="middle">{L("题目", "items")}</FT>
      <FT x={236} y={186} c="ta" a="middle">{L("重叠 = 污染", "overlap = contamination")}</FT>
      <FA x1={236} y1={178} x2={236} y2={140} k="a" />

      <FT x={396} y={54} c="t">{L("榜单分数", "leaderboard score")}</FT>
      <rect x={396} y={62} width={210} height={20} className="fa" fillOpacity={0.85} />
      <FT x={612} y={77} c="ta" a="end">78</FT>
      <FT x={396} y={110} c="t">{L("私有评测集分数", "private eval score")}</FT>
      <rect x={396} y={118} width={118} height={20} className="fp" fillOpacity={0.85} />
      <FT x={612} y={133} c="tp" a="end">44</FT>
      <FT x={396} y={166} c="tn" w={248}>{L("差值 = 你被骗走的那部分。", "the gap = the part that fooled you.")}</FT>
      <FT x={396} y={182} c="tn" w={248}>{L("防线:n-gram / 哈希去重 + 自建集。", "defence: n-gram or hash dedup + your own set.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   PT2 · lm5 — 算力预算
   ========================================================= */

FIGN["lm5-flops"] = ({ idx }) => {
  const L = useL();
  const step = (x, w, t, s, k) => <FB x={x} y={72} w={w} h={54} k={k} t={t} s={s} tc="tk" />;
  return (
    <FigFrame h={210} idx={idx}
      cap={L("从模型规格到账单只有四步乘除:6ND 给出总 FLOPs,除以「峰值算力 × MFU」得到卡时,再乘单价。中间那个 MFU 是唯一会让估算偏离一倍以上的量。",
        "Four multiplications separate a spec from an invoice: 6ND gives total FLOPs, dividing by peak throughput × MFU gives GPU-hours, and a price completes it. MFU is the one term that can move the estimate by more than 2×.")}>
      <FT x={16} y={24} c="tt">{L("从 FLOPs 到账单", "from FLOPs to an invoice")}</FT>
      <FT x={16} y={46} c="tn" w={628}>{L("N = 参数量,D = 训练 token 数", "N = parameters, D = training tokens")}</FT>

      {step(16, 130, "C = 6 N D", L("前向 2 + 反向 4", "2 forward + 4 backward"), "p")}
      <FA x1={148} y1={99} x2={176} y2={99} />
      {step(178, 150, L("÷ 峰值 × MFU", "÷ peak × MFU"), L("MFU 实际 35–55%", "MFU is really 35–55%"), "a")}
      <FA x1={330} y1={99} x2={358} y2={99} />
      {step(360, 130, L("卡时 GPU·h", "GPU-hours"), L("÷ 卡数 = 墙钟时间", "÷ GPUs = wall clock"), "")}
      <FA x1={492} y1={99} x2={520} y2={99} />
      {step(522, 122, L("× $/卡时", "× $ per GPU·h"), L("= 训练总价", "= total cost"), "p")}

      <FT x={16} y={158} c="tn" w={628}>{L("例:N = 7e9,D = 2e12 → C = 8.4e22 FLOPs", "e.g. N = 7e9, D = 2e12 → C = 8.4e22 FLOPs")}</FT>
      <FT x={16} y={176} c="tn" w={628}>{L("H100 峰值 ~9.9e14 FLOP/s(BF16),MFU 0.45 → ≈ 52,000 卡时 ≈ 64 卡 × 34 天",
        "H100 peak ≈ 9.9e14 FLOP/s (BF16), MFU 0.45 → ≈ 52,000 GPU-hours ≈ 64 GPUs × 34 days")}</FT>
      <FT x={16} y={194} c="ta" w={628}>{L("估算的用途不是精确报价,而是判断「这个方案是否根本不可能」。",
        "The point of the estimate is not a quote — it is deciding whether a plan is impossible at all.")}</FT>
    </FigFrame>
  );
};

FIGN["lm5-parallel"] = ({ idx }) => {
  const L = useL();
  const panel = (x0, title, sub, draw) => (
    <g>
      <FB x={x0} y={44} w={196} h={26} k="m" t={title} tc="tm" />
      {draw(x0)}
      <FT x={x0 + 98} y={200} c="tn" a="middle">{sub}</FT>
    </g>
  );
  const gpus = (x0, y0, mark) => (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={x0 + 8 + i * 46} y={y0} width={40} height={62} rx={3} className="bx" />
          <FT x={x0 + 28 + i * 46} y={y0 + 74} c="tn" a="middle">{`G${i}`}</FT>
          {mark(x0 + 8 + i * 46, y0, i)}
        </g>
      ))}
    </g>
  );
  return (
    <FigFrame h={220} idx={idx}
      cap={L("三种并行各省一样东西:数据并行省时间但每张卡都要装下整个模型;张量并行把单个矩阵切开、省显存但要求卡间带宽极高;流水线并行按层切、省显存但会产生气泡。大规模训练总是三者混用。",
        "Each parallelism saves something different: data parallel saves time but every GPU still holds the whole model; tensor parallel splits single matrices — saving memory at the price of huge interconnect traffic; pipeline parallel splits by layer, saving memory but introducing bubbles. Large runs mix all three.")}>
      <FT x={16} y={24} c="tt">{L("三种并行,各省一样东西", "three parallelisms, three things saved")}</FT>
      {panel(16, L("数据并行 DP", "data parallel"), L("省时间 · 显存不省", "saves time · not memory"),
        (x) => gpus(x, 84, (bx, by) => <rect x={bx + 5} y={by + 5} width={30} height={52} className="fp" fillOpacity={0.5} />))}
      {panel(232, L("张量并行 TP", "tensor parallel"), L("省显存 · 吃带宽", "saves memory · eats bandwidth"),
        (x) => gpus(x, 84, (bx, by, i) => <rect x={bx + 5} y={by + 5} width={30} height={52} className="fa" fillOpacity={0.25 + i * 0.18} />))}
      {panel(448, L("流水线并行 PP", "pipeline parallel"), L("省显存 · 有气泡", "saves memory · has bubbles"),
        (x) => gpus(x, 84, (bx, by, i) => <rect x={bx + 5} y={by + 5 + i * 13} width={30} height={12} className="fp" fillOpacity={0.85} />))}
      <FT x={114} y={172} c="tn" a="middle">{L("每卡一份完整模型", "full model per GPU")}</FT>
      <FT x={330} y={172} c="tn" a="middle">{L("同一个矩阵被切开", "one matrix, cut up")}</FT>
      <FT x={546} y={172} c="tn" a="middle">{L("每卡拿几层", "a few layers each")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   PT3 · lm6 — 训练动力学
   ========================================================= */

FIGN["lm6-shapes"] = ({ idx }) => {
  const L = useL();
  const cells = [
    { t: L("健康", "healthy"), n: L("平滑下降后变缓", "smooth decay, then flattens"), tone: "cv", f: (u) => 0.86 - 0.62 * Math.pow(u, 0.42) },
    { t: L("发散", "diverging"), n: L("学习率太高 / 无裁剪", "LR too high / no clipping"), tone: "cv a", f: (u) => (u < 0.42 ? 0.8 - 0.5 * u : 0.6 + 2.4 * (u - 0.42)) },
    { t: L("平台期", "plateau"), n: L("数据太少 / 容量到顶", "too little data / capacity hit"), tone: "cv", f: (u) => 0.86 - 0.42 * Math.min(u / 0.25, 1) },
    { t: L("过拟合", "overfitting"), n: L("训练降 · 验证升", "train falls, val rises"), tone: "cv a", f: (u) => 0.55 + 0.5 * Math.max(0, u - 0.4) },
  ];
  return (
    <FigFrame h={268} idx={idx}
      cap={L("损失曲线的形状就是诊断书:发散看学习率和梯度裁剪,平台期看数据量和模型容量,过拟合看验证曲线什么时候拐头——只有验证集能告诉你该停手。",
        "The shape of the loss curve is the diagnosis: divergence points at the learning rate and gradient clipping, a plateau at data volume or capacity, overfitting at where the validation curve turns up — and only the validation set tells you when to stop.")}>
      <FT x={16} y={24} c="tt">{L("四种形状,四种病", "four shapes, four diseases")}</FT>
      {cells.map((c, i) => {
        const x0 = 16 + (i % 2) * 330, y0 = 44 + Math.floor(i / 2) * 108;
        const X = (u) => x0 + 46 + u * 240, Y = (v) => y0 + 78 - v * 60;
        return (
          <g key={i}>
            <rect x={x0} y={y0} width={314} height={96} rx={3} className="bx m" />
            <FT x={x0 + 12} y={y0 + 18} c="tk">{c.t}</FT>
            <FT x={x0 + 302} y={y0 + 18} c="tn" a="end">{c.n}</FT>
            <line x1={x0 + 44} y1={y0 + 80} x2={x0 + 292} y2={y0 + 80} className="axis" />
            <line x1={x0 + 44} y1={y0 + 26} x2={x0 + 44} y2={y0 + 80} className="axis" />
            <polyline className={c.tone} points={fpath(41, (j) => X(j / 40), (j) => Math.max(y0 + 26, Y(c.f(j / 40))))} />
            {i === 3 && (
              <polyline className="cv" points={fpath(41, (j) => X(j / 40), (j) => Y(0.86 - 0.66 * Math.pow(j / 40, 0.5)))} />
            )}
            {i === 3 && <FT x={x0 + 292} y={y0 + 74} c="tp" a="end">train</FT>}
            {i === 3 && <FT x={x0 + 292} y={y0 + 38} c="ta" a="end">val</FT>}
          </g>
        );
      })}
      <FT x={16} y={262} c="tn" w={628}>{L("横轴一律是步数,纵轴一律是损失;真正要盯的永远是验证损失那条线。",
        "The x-axis is always steps and the y-axis always loss; the line to watch is always validation.")}</FT>
    </FigFrame>
  );
};

FIGN["lm6-lr"] = ({ idx }) => {
  const L = useL();
  const X = (u) => 70 + u * 500;
  const Y = (v) => 172 - v * 116;
  const lr = (u) => (u < 0.06 ? u / 0.06 : 0.5 * (1 + Math.cos(Math.PI * (u - 0.06) / 0.94)) * 0.96 + 0.04);
  return (
    <FigFrame h={220} idx={idx}
      cap={L("warmup 存在是因为训练最初几百步里 Adam 的二阶矩估计还不可信,此时用满学习率极易一步走废;cosine 衰减则让后期步长变小,便于收敛到一个更平的极小点。",
        "Warm-up exists because Adam's second-moment estimate is unreliable for the first few hundred steps, and a full learning rate there can wreck the run in one update; the cosine decay then shrinks the steps so the run settles into a flatter minimum.")}>
      <FT x={16} y={24} c="tt">{L("学习率调度:warmup + cosine", "LR schedule: warm-up + cosine")}</FT>
      <line x1={70} y1={172} x2={594} y2={172} className="axis" />
      <line x1={70} y1={44} x2={70} y2={172} className="axis" />
      <FT x={16} y={42} c="tn" w={628}>lr</FT>
      <FT x={330} y={194} c="tn" a="middle">{L("训练步数", "training steps")}</FT>

      <rect x={X(0)} y={44} width={X(0.06) - X(0)} height={128} className="areaa" />
      <polyline className="cv" points={fpath(101, (i) => X(i / 100), (i) => Y(lr(i / 100)))} />
      <circle cx={X(0.06)} cy={Y(1)} r={4} className="fa" />
      <FT x={X(0.06) + 8} y={Y(1) - 6} c="ta">{L("峰值 lr", "peak lr")}</FT>
      <FT x={X(0.03)} y={190} c="ta" a="middle">warmup</FT>
      <FT x={X(0.03)} y={36} c="tn" a="middle">{L("1–3% 步数", "1–3% of steps")}</FT>
      <FT x={X(0.55)} y={Y(0.62)} c="tp">{L("cosine 衰减", "cosine decay")}</FT>
      <FT x={594} y={Y(0.04) - 8} c="tn" a="end">{L("末端 ≈ 峰值的 10%", "ends at ≈10% of peak")}</FT>
      <FT x={16} y={210} c="tn" w={628}>{L("配套两件事:梯度裁剪(全局范数 1.0)挡住偶发尖峰;混合精度用 BF16 算、FP32 存主权重。",
        "Two companions: gradient clipping (global norm 1.0) absorbs spikes; mixed precision computes in BF16 while master weights stay FP32.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   IN1 · lm7 — 解码策略
   ========================================================= */

FIGN["lm7-temp"] = ({ idx }) => {
  const L = useL();
  const logits = [3.2, 2.6, 2.1, 1.4, 0.9, 0.4, -0.3, -0.9];
  const sm = (T) => {
    const z = logits.map((l) => Math.exp((l - Math.max(...logits)) / T));
    const s = z.reduce((a, b) => a + b, 0);
    return z.map((v) => v / s);
  };
  const panels = [
    { T: 0.2, n: L("几乎确定 · 重复风险", "near-deterministic · repetitive") },
    { T: 1.0, n: L("原始分布", "the raw distribution") },
    { T: 1.8, n: L("发散 · 事实性下降", "wild · facts degrade") },
  ];
  return (
    <FigFrame h={236} idx={idx}
      cap={L("温度只是在 softmax 之前把 logits 除以 T:T<1 放大差距、分布变尖,T>1 压缩差距、分布变平。它和第一章那个 √d 是同一个数学动作。",
        "Temperature simply divides the logits by T before the softmax: T<1 magnifies the gaps and sharpens the distribution, T>1 compresses them and flattens it. It is the same mathematical move as the √d of chapter one.")}>
      <FT x={16} y={24} c="tt">{L("同一组 logits,三个温度", "one set of logits, three temperatures")}</FT>
      <FT x={644} y={24} c="tn" a="end">softmax(logits / T)</FT>
      {panels.map((p, pi) => {
        const x0 = 16 + pi * 216, vals = sm(p.T);
        return (
          <g key={pi}>
            <FB x={x0} y={40} w={196} h={24} k={pi === 1 ? "p" : "m"} t={`T = ${p.T}`} tc="tm" />
            <line x1={x0 + 8} y1={186} x2={x0 + 188} y2={186} className="axis" />
            <FBars x={x0 + 14} base={186} bw={16} gap={5} vals={vals} hmax={106} k={pi === 2 ? "fa" : "fp"} />
            <FT x={x0 + 98} y={206} c="tn" a="middle">{p.n}</FT>
            <FT x={x0 + 98} y={222} c="tn" a="middle">{L(`最大 ${Math.round(vals[0] * 100)}%`, `top ${Math.round(vals[0] * 100)}%`)}</FT>
          </g>
        );
      })}
    </FigFrame>
  );
};

FIGN["lm7-topk"] = ({ idx }) => {
  const L = useL();
  const p = [0.34, 0.21, 0.14, 0.09, 0.06, 0.05, 0.035, 0.025, 0.015, 0.01, 0.008, 0.007];
  const cum = p.reduce((acc, v) => [...acc, (acc[acc.length - 1] || 0) + v], []);
  const bw = 34, gap = 10, x0 = 60, base = 168;
  const kCut = 5, pCut = cum.findIndex((c) => c >= 0.9) + 1;
  return (
    <FigFrame h={238} idx={idx}
      cap={L("top-k 砍掉排名之外的一切,不管分布多平多尖;top-p 砍掉累积概率之外的一切,所以模型有把握时窗口自动收窄、犹豫时自动放宽。生产上通常 top-p 更稳。",
        "top-k cuts everything past a fixed rank regardless of how flat or peaked the distribution is; top-p cuts past a cumulative mass, so the window narrows when the model is confident and widens when it hesitates. In production top-p is usually the safer default.")}>
      <FT x={16} y={24} c="tt">{L("两种截断,截的不是同一样东西", "two truncations, cutting different things")}</FT>
      <line x1={x0 - 10} y1={base} x2={620} y2={base} className="axis" />
      {p.map((v, i) => {
        const bx = x0 + i * (bw + gap);
        return (
          <g key={i}>
            <rect x={bx} y={base - v * 300} width={bw} height={v * 300}
              className={i < pCut ? "fp" : "fm"} fillOpacity={i < kCut ? 1 : 0.55} />
            <FT x={bx + bw / 2} y={base + 14} c="tn" a="middle">{i + 1}</FT>
          </g>
        );
      })}
      <FT x={16} y={base + 14} c="tn">{L("排名", "rank")}</FT>

      <line x1={x0 + kCut * (bw + gap) - gap / 2} y1={40} x2={x0 + kCut * (bw + gap) - gap / 2} y2={base} className="ln a d" />
      <FT x={x0 + kCut * (bw + gap) - gap / 2 + 6} y={40} c="ta" w={330}>{L("top-k = 5:固定砍在第 5 名", "top-k = 5: a fixed rank cut")}</FT>

      <polyline className="cv m" points={fpath(12, (i) => x0 + i * (bw + gap) + bw / 2, (i) => base - cum[i] * 118)} />
      <line x1={x0 - 10} y1={base - 0.9 * 118} x2={620} y2={base - 0.9 * 118} className="ln p d" />
      <FT x={620} y={base - 0.9 * 118 - 6} c="tp" a="end">{L("top-p = 0.9:累积概率线", "top-p = 0.9: cumulative mass")}</FT>
      <FT x={x0 + pCut * (bw + gap)} y={base - 30} c="tp">{L(`此处只留 ${pCut} 个`, `keeps ${pCut} here`)}</FT>
      <FT x={16} y={228} c="tn" w={628}>{L("温度先改形状,截断再定边界,最后才采样;要完全确定就用贪心 + 固定后端版本。",
        "Temperature reshapes, truncation bounds, sampling comes last; for true determinism use greedy decoding and pin the backend version.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   IN2 · lm8 — KV 缓存
   ========================================================= */

FIGN["lm8-cache"] = ({ idx }) => {
  const L = useL();
  const cell = (key, x, y, on, k) => <rect key={key} x={x} y={y} width={20} height={16} rx={2}
    className={on ? (k || "fp") : "fm"} fillOpacity={on ? 0.85 : 0.25} />;
  return (
    <FigFrame h={250} idx={idx}
      cap={L("没有缓存,每生成一个 token 都要把之前所有位置的 K/V 重算一遍,总量随长度平方增长;缓存之后每步只算新的那一列。代价是显存:缓存量随 batch × 长度线性膨胀。",
        "Without a cache, every generated token recomputes the K/V of all previous positions and total work grows quadratically; with one, each step computes only the new column. The price is memory: the cache grows linearly with batch × length.")}>
      <FT x={16} y={24} c="tt">{L("重算 vs 追加", "recompute vs append")}</FT>

      <FT x={16} y={50} c="ta" w={628}>{L("无缓存:第 t 步重算 t 列", "no cache: step t recomputes t columns")}</FT>
      {[0, 1, 2, 3, 4].map((r) => (
        <g key={r}>
          <FT x={16} y={80 + r * 22} c="tn">{`t=${r + 1}`}</FT>
          {Array.from({ length: 5 }).map((_, c) => cell(c, 56 + c * 24, 68 + r * 22, c <= r, "fa"))}
        </g>
      ))}
      <FT x={16} y={200} c="tn" w={628}>{L("总计算量 ∝ n²", "total work ∝ n²")}</FT>

      <line x1={310} y1={40} x2={310} y2={220} className="ln f" />

      <FT x={340} y={50} c="tp" w={304}>{L("有缓存:第 t 步只算 1 列", "with cache: step t computes 1 column")}</FT>
      {[0, 1, 2, 3, 4].map((r) => (
        <g key={r}>
          <FT x={340} y={80 + r * 22} c="tn">{`t=${r + 1}`}</FT>
          {Array.from({ length: 5 }).map((_, c) => (
            <g key={c}>
              {cell(c, 380 + c * 24, 68 + r * 22, c <= r, c === r ? "fp" : "fm")}
              {c === r && <rect x={380 + c * 24} y={68 + r * 22} width={20} height={16} rx={2}
                className="bx a" fillOpacity={0} />}
            </g>
          ))}
        </g>
      ))}
      <FT x={340} y={200} c="tn" w={304}>{L("总计算量 ∝ n · 灰格 = 命中缓存", "total work ∝ n · grey = cache hit")}</FT>
      <FT x={340} y={222} c="ta" w={304}>{L("代价:KV 显存 = 2 · L · H · d_h · n · batch · 精度字节",
        "cost: KV bytes = 2 · L · H · d_h · n · batch · dtype")}</FT>
    </FigFrame>
  );
};

FIGN["lm8-phases"] = ({ idx }) => {
  const L = useL();
  return (
    <FigFrame h={224} idx={idx}
      cap={L("prefill 一次处理整段提示,矩阵又大又胖,受算力限制;decode 每步只处理一个 token,却要把全部权重和缓存从显存里读一遍,受带宽限制。它们的优化手段几乎没有交集。",
        "Prefill processes the whole prompt at once — big fat matrices, compute-bound; decode handles one token per step yet must stream all weights and the cache out of memory — bandwidth-bound. Their optimisations barely overlap.")}>
      <FT x={16} y={24} c="tt">{L("两段负载,两种瓶颈", "two phases, two bottlenecks")}</FT>

      <FB x={16} y={48} w={230} h={104} k="p" />
      <FT x={131} y={72} c="tt" a="middle">prefill</FT>
      <FT x={131} y={92} c="tn" a="middle">{L("整个提示一次算完", "the whole prompt at once")}</FT>
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={34 + i * 16} y={104} width={12} height={30} className="fp" fillOpacity={0.8} />
      ))}
      <FT x={131} y={168} c="tp" a="middle">{L("算力受限 · 高 MFU", "compute-bound · high MFU")}</FT>
      <FT x={131} y={184} c="tn" a="middle">{L("延迟 ≈ TTFT(首 token 时间)", "latency ≈ TTFT (time to first token)")}</FT>

      <FA x1={252} y1={100} x2={286} y2={100} />
      <FT x={269} y={90} c="tn" a="middle">→</FT>

      <FB x={292} y={48} w={352} h={104} k="a" />
      <FT x={468} y={72} c="tt" a="middle">decode</FT>
      <FT x={468} y={92} c="tn" a="middle">{L("每步一个 token,串行", "one token per step, serial")}</FT>
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i}>
          <rect x={314 + i * 42} y={104} width={12} height={30} className="fa" fillOpacity={0.85} />
          {i < 7 && <line x1={328 + i * 42} y1={119} x2={352 + i * 42} y2={119} className="ln f d" />}
        </g>
      ))}
      <FT x={468} y={168} c="ta" a="middle">{L("带宽受限 · MFU 常低于 5%", "memory-bound · MFU often under 5%")}</FT>
      <FT x={468} y={184} c="tn" a="middle" w={340}>{L("靠增大 batch 摊薄权重读取,而 batch 又受 KV 显存限制",
        "bigger batches amortise the weight reads — and KV memory caps the batch")}</FT>
      <FT x={16} y={212} c="tn" w={628}>{L("所以「加长上下文」同时抬高 TTFT 和显存,两条线一起变差。",
        "So a longer context raises TTFT and memory at the same time — both curves get worse together.")}</FT>
    </FigFrame>
  );
};
