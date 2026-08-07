/* =========================================================
   figures3.jsx — lecture figures for lm17–lm24
   (PE2 显存 · PE3 PEFT · AL1–AL3 对齐 · EV1–EV3 评估上线)
   Also exports the registry and the <Figure> component that
   pages.jsx renders in place of an "@fig <key>" line.
   ========================================================= */

/* =========================================================
   PE2 · lm17 — 显存账本
   ========================================================= */

FIGN["lm17-stack"] = ({ idx }) => {
  const L = useL();
  // 7B model, bf16, batch 8, seq 2048 — the numbers used in the experiment.
  const rows = [
    { n: L("全参微调 · AdamW", "full fine-tune · AdamW"), parts: [14, 14, 42, 9], tot: "79 GB", k: "fa" },
    { n: L("LoRA(冻结基座)", "LoRA (frozen base)"), parts: [14, 0.3, 0.9, 9], tot: "24 GB", k: "fp" },
    { n: L("QLoRA(NF4 基座)", "QLoRA (NF4 base)"), parts: [3.5, 0.3, 0.9, 4], tot: "8.7 GB", k: "fp" },
  ];
  const legend = [
    L("权重", "weights"), L("梯度", "gradients"),
    L("优化器状态", "optimizer state"), L("激活值", "activations"),
  ];
  const tone = ["fp", "fa", "fmid", "fdim"];
  const op = [0.9, 0.85, 0.8, 0.34];
  const SC = 5.6;
  return (
    <FigFrame h={250} idx={idx}
      cap={L("显存是四项加起来的:权重、梯度、优化器状态、激活值。AdamW 的优化器状态是权重的 3 倍,所以全参微调里它才是最大那一项;LoRA 把梯度和优化器状态一起砍掉,QLoRA 再把权重本身压到 4 bit。",
        "Memory is the sum of four terms: weights, gradients, optimizer state and activations. AdamW's state is 3× the weights, which makes it the largest term in a full fine-tune; LoRA removes gradients and state together, and QLoRA then compresses the weights themselves to 4 bits.")}>
      <FT x={16} y={24} c="tt">{L("7B · bf16 · batch 8 · 2048 token", "7B · bf16 · batch 8 · 2048 tokens")}</FT>
      <g>
        {legend.map((t, i) => (
          <g key={i}>
            <rect x={250 + i * 102} y={14} width={11} height={11} rx={2} className={tone[i]} fillOpacity={op[i]} />
            <FT x={266 + i * 102} y={24} c="tn">{t}</FT>
          </g>
        ))}
      </g>
      {rows.map((r, ri) => {
        let acc = 0;
        return (
          <g key={ri}>
            <FT x={16} y={62 + ri * 62} c="tk">{r.n}</FT>
            {r.parts.map((v, i) => {
              const x = 16 + acc * SC; acc += v;
              return (
                <g key={i}>
                  <rect x={x} y={70 + ri * 62} width={Math.max(1.5, v * SC)} height={30}
                    className={tone[i]} fillOpacity={op[i]} stroke="var(--hairline-strong)" />
                  {v * SC > 34 && <text x={x + (v * SC) / 2} y={90 + ri * 62} textAnchor="middle" className="tn">{v}</text>}
                </g>
              );
            })}
            <FT x={16 + acc * SC + 10} y={90 + ri * 62} c="ta">{r.tot}</FT>
          </g>
        );
      })}
      <line x1={16 + 80 * SC} y1={44} x2={16 + 80 * SC} y2={236} className="ln a d" />
      <FT x={16 + 80 * SC - 6} y={40} c="ta" a="end">{L("单卡 80 GB", "one 80 GB GPU")}</FT>
      <FT x={16} y={244} c="tn" w={628}>{L("检查顺序:先算权重,再算优化器状态,最后才调 batch 和序列长度。",
        "Check order: weights first, optimizer state second, and only then tune batch and sequence length.")}</FT>
    </FigFrame>
  );
};

FIGN["lm17-qlora"] = ({ idx }) => {
  const L = useL();
  const item = (x, t, s, n) => (
    <g>
      <FB x={x} y={58} w={196} h={56} k="p" t={t} s={s} tc="tt" />
      <FT x={x + 98} y={132} c="tn" a="middle">{n}</FT>
    </g>
  );
  return (
    <FigFrame h={214} idx={idx}
      cap={L("QLoRA 的三件事各解决一个具体问题:NF4 用正态分布友好的量化格式压基座,双重量化把量化常数本身也压一遍,分页优化器把偶发的显存尖峰挪到内存里,避免半夜 OOM。",
        "QLoRA's three pieces each solve one concrete problem: NF4 compresses the frozen base with a normal-distribution-friendly format, double quantization compresses the quantization constants themselves, and paged optimizers push occasional memory spikes into host RAM so a run does not die at 3am.")}>
      <FT x={16} y={24} c="tt">{L("QLoRA = 4bit 冻结基座 + bf16 适配器", "QLoRA = 4-bit frozen base + bf16 adapters")}</FT>
      {item(16, "NF4", L("正态分布友好的 4 bit", "normal-float 4-bit"), L("权重 14 GB → 3.5 GB", "weights 14 GB → 3.5 GB"))}
      {item(232, L("双重量化", "double quantization"), L("量化常数再量化一次", "quantize the constants too"), L("再省 ≈ 0.4 bit/权重", "another ≈0.4 bit/weight"))}
      {item(448, L("分页优化器", "paged optimizers"), L("尖峰溢出到主机内存", "spikes spill to host RAM"), L("防偶发 OOM", "prevents sporadic OOM"))}
      <FT x={16} y={166} c="ta" w={628}>{L("代价:反向传播时基座要实时反量化,训练速度大约慢 30%。",
        "The cost: the base is dequantized on the fly during backprop, roughly 30% slower training.")}</FT>
      <FT x={16} y={190} c="tn" w={628}>{L("省显存的四种手段与代价:梯度检查点(慢 20–30%)、更小 batch(梯度更噪)、更短序列(丢长样本)、量化(掉一点质量)。",
        "Four ways to save memory and their prices: gradient checkpointing (20–30% slower), smaller batch (noisier gradients), shorter sequences (long samples dropped), quantization (a little quality).")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   PE3 · lm18 — PEFT 家族与服务
   ========================================================= */

FIGN["lm18-methods"] = ({ idx }) => {
  const L = useL();
  const cell = (x, title, sub, draw, k) => (
    <g>
      <rect x={x} y={40} width={148} height={128} rx={3} className="bx m" />
      <FT x={x + 74} y={60} c="tk" a="middle" w={138}>{title}</FT>
      {draw(x)}
      <FT x={x + 74} y={156} c="tn" a="middle" w={138}>{sub}</FT>
    </g>
  );
  const block = (x, y, w, h, k, key) => <rect key={key} x={x} y={y} width={w} height={h} rx={2} className={`bx ${k}`} />;
  return (
    <FigFrame h={232} idx={idx}
      cap={L("四种方法改的是不同的东西:提示微调只学几个软 token,前缀微调改每层的 KV,适配器插入新的小模块并因此加深了网络,LoRA 改的是权重本身的位移——只有它可以在推理前合并掉,零额外延迟。",
        "The four methods change different things: prompt tuning learns a few soft tokens, prefix tuning edits the per-layer KV, adapters insert new modules and thereby deepen the network, and LoRA changes the weight displacement itself — the only one that can be merged away before inference, at zero added latency.")}>
      <FT x={16} y={24} c="tt">{L("四种 PEFT,四个改动位置", "four PEFT methods, four places to intervene")}</FT>
      {cell(16, L("提示微调", "prompt tuning"), L("只学软 token · 最弱", "soft tokens only · weakest"), (x) => (
        <g>
          {[0, 1, 2].map((i) => block(x + 22 + i * 18, 78, 14, 40, "a", i))}
          {block(x + 82, 78, 48, 40, "")}
          <FT x={x + 106} y={102} c="tn" a="middle">{L("冻结", "frozen")}</FT>
        </g>
      ))}
      {cell(180, L("前缀微调", "prefix tuning"), L("改每层 KV · 中等", "edits per-layer KV · medium"), (x) => (
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              {block(x + 22, 74 + i * 16, 16, 12, "a")}
              {block(x + 42, 74 + i * 16, 86, 12, "")}
            </g>
          ))}
          <FT x={x + 74} y={136} c="tn" a="middle">{L("每层都插", "one per layer")}</FT>
        </g>
      ))}
      {cell(344, L("适配器", "adapters"), L("加深网络 · 有延迟", "deepens the net · adds latency"), (x) => (
        <g>
          {block(x + 22, 76, 104, 16, "")}
          {block(x + 46, 96, 56, 16, "a")}
          {block(x + 22, 116, 104, 16, "")}
          <FT x={x + 74} y={144} c="tn" a="middle">{L("串在子层之间", "inserted between sublayers")}</FT>
        </g>
      ))}
      {cell(508, "LoRA", L("可合并 · 零额外延迟", "mergeable · zero extra latency"), (x) => (
        <g>
          {block(x + 22, 76, 60, 56, "")}
          {block(x + 90, 76, 14, 56, "a")}
          {block(x + 90, 76, 36, 14, "a")}
          <FT x={x + 74} y={144} c="tn" a="middle">W + B·A</FT>
        </g>
      ))}
      <FT x={16} y={196} c="tn" w={628}>{L("LoRA 赢在三件事同时成立:质量接近全参、参数只有千分之几、而且可以合并进原权重。",
        "LoRA won because three things hold at once: near-full-fine-tune quality, a fraction of a percent of the parameters, and mergeability into the base weights.")}</FT>
      <FT x={16} y={220} c="tn" w={628}>{L("叠加多个适配器通常不加,反而互相干扰——要多任务就重训一个,或走多适配器服务。",
        "Stacking adapters usually interferes rather than composes — for multi-task, retrain one adapter or serve several separately.")}</FT>
    </FigFrame>
  );
};

FIGN["lm18-serving"] = ({ idx }) => {
  const L = useL();
  return (
    <FigFrame h={222} idx={idx}
      cap={L("合并进权重就得到一个独立模型:延迟最低,但每个任务一份完整副本,显存按任务数线性膨胀。动态加载则一份基座配 N 个几十 MB 的适配器,可以按请求切换,代价是每层多一次小矩阵乘。",
        "Merging into the weights yields a standalone model: lowest latency, but a full copy per task and memory that grows linearly with tasks. Dynamic loading keeps one base and N adapters of a few dozen MB, switchable per request, at the price of one extra small matmul per layer.")}>
      <FT x={16} y={24} c="tt">{L("上线的两种形态", "two shapes for serving")}</FT>

      <FT x={16} y={54} c="ta" w={628}>{L("A · 合并", "A · merged")}</FT>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <FB x={16 + i * 104} y={62} w={92} h={62} k="a" t={L(`任务 ${i + 1}`, `task ${i + 1}`)} s="14 GB" tc="ts" />
        </g>
      ))}
      <FT x={16} y={144} c="tn" w={628}>{L("3 个任务 = 42 GB · 切换要换模型", "3 tasks = 42 GB · switching swaps the model")}</FT>
      <FT x={16} y={160} c="tn" w={628}>{L("延迟最低,适合单一高流量任务", "lowest latency; right for one high-traffic task")}</FT>

      <line x1={340} y1={44} x2={340} y2={200} className="ln f" />

      <FT x={366} y={54} c="tp" w={278}>{L("B · 基座 + 适配器", "B · base + adapters")}</FT>
      <FB x={366} y={62} w={112} h={62} k="p" t={L("共享基座", "shared base")} s="14 GB" tc="ts" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <FB x={496} y={62 + i * 22} w={132} h={18} k="a" t={L(`适配器 ${i + 1} · 40 MB`, `adapter ${i + 1} · 40 MB`)} tc="tn" />
          <FA x1={480} y1={93} x2={494} y2={71 + i * 22} k="a" />
        </g>
      ))}
      <FT x={366} y={144} c="tn" w={278}>{L("3 个任务 = 14.1 GB · 按请求切换", "3 tasks = 14.1 GB · switch per request")}</FT>
      <FT x={366} y={160} c="tn" w={278}>{L("多租户、长尾任务的唯一可行解", "the only viable answer for multi-tenant, long-tail tasks")}</FT>
      <FT x={16} y={198} c="tn" w={628}>{L("适配器要像代码一样管版本:基座版本、数据快照、超参、评测分数,四样一起入库。",
        "Version adapters like code: base version, data snapshot, hyperparameters and eval scores go into the registry together.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   AL1 · lm19 — RLHF
   ========================================================= */

FIGN["lm19-pipeline"] = ({ idx }) => {
  const L = useL();
  const stage = (x, no, t, inp, out, k) => (
    <g>
      <FB x={x} y={64} w={186} h={72} k={k} t={t} tc="tt" />
      <FT x={x + 10} y={82} c="tn">{no}</FT>
      <FT x={x + 93} y={112} c="tn" a="middle">{inp}</FT>
      <FT x={x + 93} y={152} c="tm" a="middle">{out}</FT>
    </g>
  );
  return (
    <FigFrame h={244} idx={idx}
      cap={L("监督微调只能教「好答案长什么样」,教不了「A 比 B 好多少」。RLHF 用偏好对训出一个奖励模型来表达这个比较,再用它优化策略——中间那一段是整条链路里最脆弱的。",
        "Supervised fine-tuning can only show what a good answer looks like, never how much better A is than B. RLHF trains a reward model on preference pairs to express that comparison, then optimises the policy against it — and that middle stage is the fragile one.")}>
      <FT x={16} y={24} c="tt">{L("三段流水线", "the three-stage pipeline")}</FT>
      {stage(16, "1", "SFT", L("演示数据 · 人写答案", "demonstrations · human answers"), L("会说话的模型", "a model that answers"), "p")}
      <FA x1={206} y1={100} x2={230} y2={100} />
      {stage(232, "2", L("奖励模型 RM", "reward model"), L("偏好对 A ≻ B", "preference pairs A ≻ B"), L("一个打分函数", "a scoring function"), "a")}
      <FA x1={422} y1={100} x2={446} y2={100} />
      {stage(448, "3", "PPO", L("RM 打分 + KL 约束", "RM score + KL penalty"), L("对齐后的策略", "the aligned policy"), "p")}

      <FAP d="M541 140 C541 190 300 200 125 186 L125 142" k="a" dash />
      <FT x={330} y={210} c="ta" a="middle">{L("KL 惩罚:别跑离 SFT 模型太远", "KL penalty: do not drift far from the SFT model")}</FT>
      <FT x={16} y={236} c="tn" w={628}>{L("奖励模型准确率通常只有 65–75%,它是这条链路的天花板;策略会精准地找出它错的那 25%。",
        "Reward-model accuracy is typically 65–75% and caps the whole pipeline; the policy will find exactly the 25% it gets wrong.")}</FT>
    </FigFrame>
  );
};

FIGN["lm19-tax"] = ({ idx }) => {
  const L = useL();
  const rows = [
    { n: L("有用性(人类偏好)", "helpfulness (human preference)"), a: 0.42, b: 0.78, up: true },
    { n: L("无害性", "harmlessness"), a: 0.5, b: 0.9, up: true },
    { n: L("基准能力(数学/代码)", "benchmark ability (maths/code)"), a: 0.82, b: 0.72, up: false },
    { n: L("输出多样性", "output diversity"), a: 0.86, b: 0.58, up: false },
  ];
  return (
    <FigFrame h={198} idx={idx}
      cap={L("对齐是有代价的:人类更喜欢对齐后的输出,但基准分数和多样性通常会掉。这不是 bug——你是在用一部分能力换一致的行为,值不值得取决于产品。",
        "Alignment has a price: humans prefer the aligned outputs, but benchmark scores and diversity usually fall. That is not a bug — you are trading some capability for consistent behaviour, and whether it is worth it depends on the product.")}>
      <FT x={16} y={24} c="tt">{L("对齐税", "the alignment tax")}</FT>
      <FT x={300} y={24} c="tn">{L("灰 = 对齐前 · 橙/绿 = 对齐后", "grey = before · coloured = after")}</FT>
      {rows.map((r, i) => (
        <g key={i}>
          <FT x={16} y={58 + i * 34} c="t">{r.n}</FT>
          <rect x={300} y={46 + i * 34} width={320 * r.a} height={7} rx={2} className="fm" fillOpacity={0.55} />
          <rect x={300} y={57 + i * 34} width={320 * r.b} height={7} rx={2}
            className={r.up ? "fp" : "fa"} fillOpacity={0.9} />
          <FT x={628} y={58 + i * 34} c={r.up ? "tp" : "ta"} a="end">
            {`${r.up ? "+" : ""}${Math.round((r.b - r.a) * 100)}`}
          </FT>
        </g>
      ))}
      <FT x={16} y={186} c="tn" w={628}>{L("所以对齐后必须重新跑一遍你的能力评测——只看偏好胜率会让你在不知不觉中变笨。",
        "So rerun your capability evals after alignment — watching win-rate alone lets the model get quietly dumber.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   AL2 · lm20 — DPO
   ========================================================= */

FIGN["lm20-dpo"] = ({ idx }) => {
  const L = useL();
  return (
    <FigFrame h={250} idx={idx}
      cap={L("DPO 的推导说明:最优策略与奖励之间有一个闭式关系,所以可以把奖励解出来、代回去,直接对策略做一个分类式的损失。工程上的结果是奖励模型、采样循环、价值网络三样一起消失。",
        "DPO's derivation shows a closed-form relation between the optimal policy and the reward, so the reward can be solved for and substituted back, leaving a classification-style loss on the policy itself. In engineering terms, the reward model, the sampling loop and the value network all disappear.")}>
      <FT x={16} y={24} c="tt">{L("同样的偏好数据,两条路", "the same preference data, two roads")}</FT>

      <FT x={16} y={54} c="ta" w={628}>RLHF / PPO</FT>
      {[L("偏好对", "pairs"), L("训奖励模型", "train RM"), L("采样生成", "sample"), L("RM 打分", "score"), L("PPO 更新", "PPO update")].map((t, i) => (
        <g key={i}>
          <FB x={16 + i * 124} y={64} w={112} h={44} k={i === 0 ? "m" : "a"} t={t} tc="ts" />
          {i < 4 && <FA x1={130 + i * 124} y1={86} x2={138 + i * 124} y2={86} k="a" />}
        </g>
      ))}
      <FAP d="M580 110 C580 146 300 152 74 134 L74 112" k="a" />
      <FT x={330} y={148} c="tn" a="middle">{L("训练中循环 · 4 个模型同时在显存里", "an in-training loop · four models resident at once")}</FT>

      <FT x={16} y={188} c="tp" w={628}>DPO</FT>
      {[L("偏好对", "pairs"), L("一个分类式损失", "one classification-style loss"), L("策略更新", "policy update")].map((t, i) => (
        <g key={i}>
          <FB x={16 + i * 200} y={198} w={180} h={42} k={i === 0 ? "m" : "p"} t={t} tc="ts" />
          {i < 2 && <FA x1={198 + i * 200} y1={219} x2={214 + i * 200} y2={219} k="p" />}
        </g>
      ))}
      <FT x={624} y={212} c="tp" a="end">{L("2 个模型:策略 + 冻结参考", "two models: policy + frozen reference")}</FT>
      <FT x={624} y={232} c="tn" a="end">{L("代码量和调参空间都小一个量级", "an order of magnitude less code and tuning")}</FT>
    </FigFrame>
  );
};

FIGN["lm20-beta"] = ({ idx }) => {
  const L = useL();
  const cx = 130, cy = 118;
  const panel = (x0, beta, r, t, n, k) => (
    <g>
      <FT x={x0} y={48} c="tk">{`β = ${beta}`}</FT>
      <circle cx={x0 + 100} cy={cy} r={r} className={`bx ${k}`} />
      <circle cx={x0 + 100} cy={cy} r={5} className="fp" />
      <FT x={x0 + 100} y={cy - r - 8} c="tn" a="middle">{t}</FT>
      <FT x={x0 + 100} y={200} c="tn" a="middle">{n}</FT>
    </g>
  );
  return (
    <FigFrame h={222} idx={idx}
      cap={L("β 控制策略允许离参考模型多远。太小,模型会为了迎合偏好数据里的偶然噪声而跑飞;太大,它几乎不动、白训一场。0.1–0.5 是常见区间,而且要按数据质量调。",
        "β controls how far the policy may stray from the reference. Too small and it chases the accidental noise in the preference data; too large and it barely moves, wasting the run. 0.1–0.5 is the usual band, tuned to the data quality.")}>
      <FT x={16} y={24} c="tt">{L("β = 离参考模型多远的许可证", "β = a licence to leave the reference model")}</FT>
      <FT x={430} y={24} c="tn" w={214}>{L("点 = 参考模型 · 圈 = 允许漂移范围", "dot = reference · circle = drift budget")}</FT>
      {panel(16, 0.05, 62, L("漂移很大", "large drift"), L("过拟合偏好噪声 · 语气怪异", "overfits preference noise · odd tone"), "a")}
      {panel(232, 0.1, 38, L("适中", "moderate"), L("常见默认值", "the usual default"), "p")}
      {panel(448, 0.5, 16, L("几乎不动", "barely moves"), L("安全但白训", "safe but wasted"), "m")}
      <FT x={16} y={214} c="tn" w={628}>{L("DPO 更依赖数据质量:它没有奖励模型帮忙平滑,每一条标错的偏好都会被直接学进去。",
        "DPO leans harder on data quality: with no reward model to smooth things out, every mislabelled pair is learned directly.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   AL3 · lm21 — 可验证奖励与奖励黑客
   ========================================================= */

FIGN["lm21-reward"] = ({ idx }) => {
  const L = useL();
  return (
    <FigFrame h={218} idx={idx}
      cap={L("能用程序判对错的任务,就别训奖励模型:单元测试、编译器、数学答案校验器,都是不会被说服的裁判。学出来的奖励模型只在没有客观判据时才必要,而它天然会被找到漏洞。",
        "Where a program can decide correctness, do not train a reward model: unit tests, compilers and answer checkers are judges that cannot be talked around. A learned reward model is only necessary when no objective criterion exists — and it will always have exploitable seams.")}>
      <FT x={16} y={24} c="tt">{L("两种裁判", "two kinds of judge")}</FT>

      <FT x={16} y={56} c="tp" w={628}>{L("可验证奖励", "verifiable reward")}</FT>
      <FB x={16} y={64} w={110} h={44} k="m" t={L("模型输出", "model output")} tc="ts" />
      <FA x1={128} y1={86} x2={152} y2={86} k="p" />
      <FB x={154} y={64} w={126} h={44} k="p" t={L("单元测试 / 校验器", "tests / checker")} tc="ts" />
      <FA x1={282} y1={86} x2={306} y2={86} k="p" />
      <FB x={308} y={64} w={70} h={44} k="p" t={L("0 或 1", "0 or 1")} tc="tk" />
      <FT x={396} y={80} c="tn" w={248}>{L("不会被说服、不会漂移", "cannot be persuaded or drift")}</FT>
      <FT x={396} y={96} c="tn" w={248}>{L("适用:代码、数学、结构化抽取", "for code, maths, structured extraction")}</FT>

      <FT x={16} y={140} c="ta" w={628}>{L("学出来的奖励", "learned reward")}</FT>
      <FB x={16} y={148} w={110} h={44} k="m" t={L("模型输出", "model output")} tc="ts" />
      <FA x1={128} y1={170} x2={152} y2={170} k="a" />
      <FB x={154} y={148} w={126} h={44} k="a" t={L("奖励模型", "reward model")} tc="ts" />
      <FA x1={282} y1={170} x2={306} y2={170} k="a" />
      <FB x={308} y={148} w={70} h={44} k="a" t={L("连续分数", "a score")} tc="tk" />
      <FT x={396} y={164} c="tn" w={248}>{L("有分布外弱点,可被利用", "has out-of-distribution seams to exploit")}</FT>
      <FT x={396} y={196} c="tn" w={248}>{L("适用:写作、语气、无客观判据的场景", "for writing, tone, anything without a checker")}</FT>
    </FigFrame>
  );
};

FIGN["lm21-goodhart"] = ({ idx }) => {
  const L = useL();
  const X = (u) => 70 + u * 510;
  const Y = (v) => 176 - v * 122;
  const proxy = (u) => 0.2 + 0.74 * (1 - Math.exp(-3.4 * u));
  const truth = (u) => 0.22 + 1.5 * u - 2.4 * u * u;
  return (
    <FigFrame h={238} idx={idx}
      cap={L("优化到一定程度后,代理奖励继续上升而真实质量开始下降——这就是 Goodhart 定律的具体形状。分岔点没有报警器,唯一的办法是定期人工读一批样本。",
        "Past a point the proxy reward keeps climbing while true quality falls — that is Goodhart's law in concrete form. Nothing alarms at the divergence point; the only detector is periodically reading a batch of samples yourself.")}>
      <FT x={16} y={24} c="tt">{L("代理奖励 vs 真实质量", "proxy reward vs true quality")}</FT>
      <line x1={70} y1={176} x2={594} y2={176} className="axis" />
      <line x1={70} y1={44} x2={70} y2={176} className="axis" />
      <FT x={330} y={210} c="tn" a="middle">{L("优化强度 / 训练步数", "optimisation pressure / steps")}</FT>

      <polyline className="cv a" points={fpath(61, (i) => X(i / 60), (i) => Y(proxy(i / 60)))} />
      <polyline className="cv" points={fpath(61, (i) => X(i / 60), (i) => Y(truth(i / 60)))} />
      <line x1={X(0.31)} y1={44} x2={X(0.31)} y2={176} className="ln a d" />
      <circle cx={X(0.31)} cy={Y(truth(0.31))} r={4.5} className="fa" />
      <FT x={X(0.31) + 8} y={58} c="ta">{L("分岔点:此后越训越差", "divergence: worse from here on")}</FT>
      <FT x={X(0.72)} y={Y(proxy(0.72)) - 10} c="ta">{L("奖励分数 ↑", "reward score ↑")}</FT>
      <FT x={X(0.72)} y={Y(truth(0.72)) + 20} c="tp">{L("真实质量 ↓", "true quality ↓")}</FT>
      <FT x={16} y={228} c="tn" w={628}>{L("三种形态:钻奖励模型的漏洞、钻评测的漏洞、以及套话化(说得漂亮但没内容)。防御:定期人工抽读、多个奖励信号、KL 约束、以及一组不参与训练的评测。",
        "Three shapes: exploiting the reward model, exploiting the eval, and blandness (fluent but empty). Defences: sample and read regularly, several reward signals, a KL constraint, and a held-out eval that never trains.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   EV1 · lm22 — 评估
   ========================================================= */

FIGN["lm22-ci"] = ({ idx }) => {
  const L = useL();
  const ns = [50, 200, 1000];
  const p = 0.72;
  const X = (i) => 150 + i * 170;
  const Y = (v) => 178 - (v - 0.4) / 0.6 * 128;
  return (
    <FigFrame h={236} idx={idx}
      cap={L("50 道题上 72% 的置信区间大约是 ±12 个百分点,所以「从 68 涨到 72」这句话什么也没证明。想区分 4 个点的差距,需要接近一千道题——或者用配对比较,把方差消掉。",
        "At n=50 a 72% score carries a confidence interval of roughly ±12 points, so \"it went from 68 to 72\" proves nothing. Distinguishing a 4-point gap needs close to a thousand items — or a paired comparison, which cancels most of the variance.")}>
      <FT x={16} y={24} c="tt">{L("同样是 72%,可信度差很多", "the same 72%, wildly different confidence")}</FT>
      <line x1={80} y1={178} x2={620} y2={178} className="axis" />
      <line x1={80} y1={44} x2={80} y2={178} className="axis" />
      {[0.4, 0.55, 0.7, 0.85, 1.0].map((v) => (
        <g key={v}>
          <line x1={80} y1={Y(v)} x2={620} y2={Y(v)} className="grid" />
          <FT x={74} y={Y(v) + 4} c="tn" a="end">{`${Math.round(v * 100)}%`}</FT>
        </g>
      ))}
      {ns.map((n, i) => {
        const ci = 1.96 * Math.sqrt(p * (1 - p) / n);
        return (
          <g key={n}>
            <line x1={X(i)} y1={Y(p - ci)} x2={X(i)} y2={Y(p + ci)} className="ln a" strokeWidth={2} />
            <line x1={X(i) - 16} y1={Y(p + ci)} x2={X(i) + 16} y2={Y(p + ci)} className="ln a" strokeWidth={2} />
            <line x1={X(i) - 16} y1={Y(p - ci)} x2={X(i) + 16} y2={Y(p - ci)} className="ln a" strokeWidth={2} />
            <circle cx={X(i)} cy={Y(p)} r={5} className="fp" />
            <FT x={X(i)} y={200} c="tk" a="middle">{`n = ${n}`}</FT>
            <FT x={X(i)} y={216} c="tn" a="middle">{`± ${(ci * 100).toFixed(1)} pt`}</FT>
          </g>
        );
      })}
      <line x1={80} y1={Y(0.68)} x2={620} y2={Y(0.68)} className="ln p d" />
      <FT x={616} y={Y(0.68) - 6} c="tp" a="end">{L("上个版本 68%", "previous version 68%")}</FT>
      <FT x={16} y={230} c="tn" w={628}>{L("n=50 时两个版本的区间几乎完全重叠——你以为的提升在统计上并不存在。",
        "At n=50 the two intervals overlap almost entirely — the improvement you think you see is not there statistically.")}</FT>
    </FigFrame>
  );
};

FIGN["lm22-grading"] = ({ idx }) => {
  const L = useL();
  const pts = [
    { x: 0.12, y: 0.28, t: L("精确匹配", "exact match"), n: L("便宜 · 只适合有唯一答案的题", "cheap · needs a single right answer") },
    { x: 0.3, y: 0.5, t: L("程序校验", "programmatic check"), n: L("单元测试 / schema 校验", "unit tests / schema validation") },
    { x: 0.58, y: 0.74, t: L("模型评分", "LLM as judge"), n: L("要先与人工标注对齐过", "must first be calibrated against humans") },
    { x: 0.88, y: 0.94, t: L("人工评分", "human rating"), n: L("最准 · 最慢 · 是校准基准", "most accurate, slowest, the calibration anchor") },
  ];
  return (
    <FigFrame h={236} idx={idx}
      cap={L("四种判分方式沿同一条对角线排列:越准越贵。实践上的做法是用人工标注去校准模型评分,然后让模型评分承担日常回归,人工只在版本决策时出场。",
        "The four grading methods sit along one diagonal: accuracy costs money. The practical move is to calibrate the model judge against human labels, let the judge carry the daily regression runs, and reserve humans for release decisions.")}>
      <FT x={16} y={24} c="tt">{L("准确度 vs 成本", "fidelity vs cost")}</FT>
      <line x1={70} y1={186} x2={600} y2={186} className="axis" />
      <line x1={70} y1={44} x2={70} y2={186} className="axis" />
      <FT x={335} y={216} c="tn" a="middle">{L("单条成本 →", "cost per item →")}</FT>
      <FT x={16} y={42} c="tn" w={628}>{L("与人类判断的一致性", "agreement with humans")}</FT>
      {pts.map((p, i) => {
        const px = 70 + p.x * 510, py = 186 - p.y * 138;
        return (
          <g key={i}>
            <circle cx={px} cy={py} r={7} className={i === 3 ? "fa" : "fp"} />
            <FT x={px + 12} y={py - 2} c="tk" w={i === 3 ? 108 : 140}>{p.t}</FT>
            <FT x={px + 12} y={py + 14} c="tn" w={i === 3 ? 108 : 140}>{p.n}</FT>
          </g>
        );
      })}
      <FT x={16} y={228} c="tn" w={628}>{L("黄金评估集的三条规矩:来自真实分布、永不参与训练、每条都有明确的判分标准。",
        "Three rules for the golden set: drawn from the real distribution, never used in training, and every item has an explicit grading criterion.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   EV2 · lm23 — 安全与红队
   ========================================================= */

FIGN["lm23-erosion"] = ({ idx }) => {
  const L = useL();
  const X = (u) => 70 + u * 510;
  const Y = (v) => 172 - v * 118;
  const bare = (u) => 0.95 - 0.62 * (1 - Math.exp(-3.6 * u));
  const mixed = (u) => 0.95 - 0.1 * (1 - Math.exp(-3.6 * u));
  return (
    <FigFrame h={232} idx={idx}
      cap={L("即使训练数据里完全没有有害内容,几百步无害的领域微调也会把安全拒绝率打下来——对齐行为本来就是薄薄一层。混入 5–10% 的安全样本几乎能完全挡住这条下滑。",
        "Even with no harmful content anywhere in the data, a few hundred steps of innocuous domain fine-tuning drives the refusal rate down — the aligned behaviour was only ever a thin layer. Mixing in 5–10% safety examples almost entirely holds the line.")}>
      <FT x={16} y={24} c="tt">{L("微调侵蚀安全行为", "fine-tuning erodes safety behaviour")}</FT>
      <line x1={70} y1={172} x2={594} y2={172} className="axis" />
      <line x1={70} y1={44} x2={70} y2={172} className="axis" />
      <FT x={330} y={206} c="tn" a="middle">{L("领域微调步数(数据本身完全无害)", "domain fine-tuning steps (with entirely benign data)")}</FT>
      <FT x={16} y={42} c="tn" w={628}>{L("有害请求拒绝率", "refusal rate on harmful requests")}</FT>
      {[0.4, 0.6, 0.8, 1.0].map((v) => (
        <g key={v}>
          <line x1={70} y1={Y(v)} x2={594} y2={Y(v)} className="grid" />
          <FT x={64} y={Y(v) + 4} c="tn" a="end">{`${Math.round(v * 100)}%`}</FT>
        </g>
      ))}
      <polyline className="cv a" points={fpath(61, (i) => X(i / 60), (i) => Y(bare(i / 60)))} />
      <polyline className="cv" points={fpath(61, (i) => X(i / 60), (i) => Y(mixed(i / 60)))} />
      <FT x={X(0.66)} y={Y(bare(0.66)) + 20} c="ta">{L("只用领域数据", "domain data only")}</FT>
      <FT x={X(0.66)} y={Y(mixed(0.66)) - 10} c="tp">{L("混入 5–10% 安全样本", "with 5–10% safety examples")}</FT>
      <FT x={16} y={224} c="tn" w={628}>{L("所以「我们的数据很干净」不是安全论证;上线前必须重新跑一遍安全评测。",
        "So \"our data is clean\" is not a safety argument; the safety eval must be rerun before every release.")}</FT>
    </FigFrame>
  );
};

FIGN["lm23-tradeoff"] = ({ idx }) => {
  const L = useL();
  const X = (u) => 80 + u * 500;
  const Y = (v) => 176 - v * 120;
  const attack = (u) => 0.86 * Math.exp(-3.2 * u) + 0.02;
  const over = (u) => 0.02 + 0.9 * Math.pow(u, 2.2);
  return (
    <FigFrame h={238} idx={idx}
      cap={L("拒绝阈值往左调,越狱成功率上升;往右调,正常请求被误拒。两条曲线不会同时贴地,所以你必须显式地为你的产品选一个点,而不是假装能两头都要。",
        "Move the refusal threshold left and jailbreaks succeed; move it right and legitimate requests get refused. The two curves never both reach the floor, so you must explicitly choose a point for your product instead of pretending you can have both.")}>
      <FT x={16} y={24} c="tt">{L("你必须显式选一个点", "you must explicitly choose a point")}</FT>
      <line x1={80} y1={176} x2={594} y2={176} className="axis" />
      <line x1={80} y1={44} x2={80} y2={176} className="axis" />
      <FT x={84} y={198} c="tn" w={560}>{L("← 更宽松", "← more permissive")}</FT>
      <FT x={590} y={198} c="tn" a="end">{L("更严格 →", "more restrictive →")}</FT>
      <FT x={335} y={218} c="tn" a="middle">{L("拒绝阈值", "refusal threshold")}</FT>

      <polyline className="cv a" points={fpath(61, (i) => X(i / 60), (i) => Y(attack(i / 60)))} />
      <polyline className="cv" points={fpath(61, (i) => X(i / 60), (i) => Y(over(i / 60)))} />
      <FT x={X(0.08)} y={Y(attack(0.08)) - 10} c="ta">{L("越狱成功率", "jailbreak success")}</FT>
      <FT x={X(0.82)} y={Y(over(0.82)) - 10} c="tp" a="end">{L("正常请求误拒率", "over-refusal of legitimate requests")}</FT>
      <line x1={X(0.52)} y1={44} x2={X(0.52)} y2={176} className="ln a d" />
      <FT x={X(0.52) + 8} y={58} c="ta">{L("医疗 / 法律产品可能选这里", "a medical or legal product might sit here")}</FT>
      <FT x={16} y={230} c="tn" w={628}>{L("两类攻击的防线在不同地方:直接有害请求靠模型对齐,提示注入靠系统架构(隔离、权限、输出过滤)——后者不是模型能修的。",
        "The two attack classes are defended in different places: directly harmful requests by model alignment, prompt injection by system architecture (isolation, permissions, output filtering) — the model cannot fix the latter.")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   EV3 · lm24 — 上线与成本
   ========================================================= */

FIGN["lm24-trilemma"] = ({ idx }) => {
  const L = useL();
  const cx = 200, cy = 128, r = 74;
  const pts = [[cx, cy - r], [cx - r * 0.87, cy + r * 0.5], [cx + r * 0.87, cy + r * 0.5]];
  return (
    <FigFrame h={230} idx={idx}
      cap={L("质量、成本、延迟三者互相拉扯:换更大的模型质量涨但另外两个都变差,量化和缓存省成本但可能掉质量。上线前必须写下这三个数字各自的硬约束,否则每次优化都会在别处爆掉。",
        "Quality, cost and latency pull against each other: a bigger model raises quality and worsens the other two; quantization and caching cut cost and may cost quality. Write down a hard bound for each of the three before launch, or every optimisation will blow up somewhere else.")}>
      <FT x={16} y={24} c="tt">{L("三个互相拉扯的指标", "three metrics pulling against each other")}</FT>
      <polygon points={pts.map((p) => p.join(",")).join(" ")} className="bx p" />
      <FT x={pts[0][0]} y={pts[0][1] - 12} c="tk" a="middle">{L("质量", "quality")}</FT>
      <FT x={pts[1][0] - 6} y={pts[1][1] + 20} c="tk" a="middle">{L("成本", "cost")}</FT>
      <FT x={pts[2][0] + 6} y={pts[2][1] + 20} c="tk" a="middle">{L("延迟", "latency")}</FT>
      <FT x={cx} y={cy + 6} c="tn" a="middle">{L("挑两个", "pick two")}</FT>

      <FT x={330} y={62} c="tk" w={314}>{L("三条要写进文档的硬约束", "three bounds to write down")}</FT>
      {[
        { k: L("质量下限", "quality floor"), v: L("黄金评估集不得低于 X 分", "never below X on the golden set") },
        { k: L("成本上限", "cost ceiling"), v: L("每千次请求不超过 $Y", "at most $Y per 1,000 requests") },
        { k: L("延迟上限", "latency ceiling"), v: L("P95 首 token < Z ms", "P95 time-to-first-token < Z ms") },
      ].map((row, i) => (
        <g key={i}>
          <FB x={330} y={78 + i * 46} w={132} h={34} k="a" t={row.k} tc="t" />
          <FT x={476} y={99 + i * 46} c="tn">{row.v}</FT>
        </g>
      ))}
      <FT x={16} y={222} c="tn" w={628}>{L("上线后要监控的四个:延迟分布、错误率、成本/请求、以及一条抽样人工审核的质量线。",
        "Four things to monitor after launch: the latency distribution, error rate, cost per request, and a sampled human-reviewed quality line.")}</FT>
    </FigFrame>
  );
};

FIGN["lm24-ladder"] = ({ idx }) => {
  const L = useL();
  const steps = [
    { t: L("改提示 / 缩短系统提示", "tighten the prompt"), c: L("成本:几小时", "cost: hours"), g: 0.2 },
    { t: L("加缓存(前缀 / 结果)", "cache prefixes and results"), c: L("成本:几天", "cost: days"), g: 0.42 },
    { t: L("换更小的模型 + 评测", "swap to a smaller model, then evaluate"), c: L("成本:一周", "cost: a week"), g: 0.6 },
    { t: L("量化 / 批处理 / 推测解码", "quantize · batch · speculative decoding"), c: L("成本:两周", "cost: two weeks"), g: 0.78 },
    { t: L("微调小模型替代大模型", "fine-tune a small model to replace the big one"), c: L("成本:一个月起", "cost: a month or more"), g: 1.0 },
  ];
  return (
    <FigFrame h={244} idx={idx}
      cap={L("优化顺序永远是从最便宜的开始:提示、缓存、换模型、推理优化,最后才是微调。跳过前面几级直接上微调,是这门课里最常见也最贵的错误。",
        "Always optimise cheapest-first: prompt, cache, smaller model, inference tricks, and only then fine-tuning. Skipping the early rungs straight to fine-tuning is the commonest and most expensive mistake in this course.")}>
      <FT x={16} y={24} c="tt">{L("优化顺序:从最便宜的开始", "optimisation order: cheapest first")}</FT>
      {steps.map((s, i) => {
        const y = 44 + i * 38;
        return (
          <g key={i}>
            <rect x={16 + i * 18} y={y} width={360} height={30} rx={3}
              className={i < 2 ? "bx p" : i < 4 ? "bx m" : "bx a"} />
            <FT x={28 + i * 18} y={y + 20} c="t">{s.t}</FT>
            <FT x={392} y={y + 20} c="tn">{s.c}</FT>
            <rect x={498} y={y + 10} width={124 * s.g} height={11} rx={2}
              className={i < 2 ? "fp" : "fa"} fillOpacity={0.85} />
          </g>
        );
      })}
      <FT x={498} y={24} c="tn">{L("投入 →", "effort →")}</FT>
      <FT x={16} y={238} c="tn" w={628}>{L("延迟要分开优化:TTFT 归 prefill(缩短提示、前缀缓存),吐字速度归 decode(小模型、量化、推测解码)。",
        "Optimise latency in two halves: TTFT belongs to prefill (shorter prompts, prefix caching), throughput to decode (smaller model, quantization, speculative decoding).")}</FT>
    </FigFrame>
  );
};

/* =========================================================
   registry + <Figure>
   ========================================================= */
function Figure({ name, idx }) {
  const C = FIGN[name];
  if (!C) {
    if (typeof console !== "undefined") console.warn(`[figures] unknown figure: ${name}`);
    return null;
  }
  return <C idx={idx} />;
}

window.FIGN = FIGN;
window.Figure = Figure;
