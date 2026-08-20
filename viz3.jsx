/* =========================================================
   viz3.jsx — interactive experiments for L7 (alignment) and
   L8 (evaluation & production), plus the VIZ registry.
   ---------------------------------------------------------
   Depends on helpers from viz.jsx and is loaded last, so it
   also defines <Viz>, which pages.jsx renders.
   ========================================================= */

/* =========================================================
   AL1 · rlhfPipeline — SFT → reward model → policy
   ========================================================= */
const RLHF_STAGES = [
  { k: "sft", zh: "① 监督微调", en: "① Supervised fine-tuning",
    d: { zh: "用几万条「指令 + 人写的好回答」训练基座模型,让它先学会以助手的方式回应。这一步的产物既是后面的起点,也是 KL 惩罚里的参考模型。", en: "Train the base model on tens of thousands of instruction/answer pairs written by people, teaching it to respond as an assistant. Its output is both the starting point for what follows and the reference model in the KL penalty." } },
  { k: "rm", zh: "② 奖励模型", en: "② Reward model",
    d: { zh: "给同一个提示采样两个回答,让人标注哪个更好。用这些成对比较训一个打分模型。注意:人擅长比较,不擅长打绝对分——「这个答案 7.5 分」在标注员之间几乎无法对齐。", en: "Sample two answers to the same prompt and have a person mark which is better. Train a scoring model on those pairwise comparisons. People are good at comparing and bad at absolute scores — 'this answer is a 7.5' does not align across annotators." } },
  { k: "po", zh: "③ 策略优化", en: "③ Policy optimization",
    d: { zh: "让模型生成回答、用奖励模型打分、按分数更新策略(PPO 等),同时用 KL 惩罚把它拴在 SFT 模型附近——否则它会为了刷高分而漂移到一种奇怪但高分的说话方式。", en: "The model generates answers, the reward model scores them, and the policy is updated on those scores (PPO and friends) — with a KL penalty leashing it near the SFT model, or it drifts into a strange but high-scoring manner of speech." } },
];
const RlhfPipelineViz = () => {
  const L = useL();
  const lang = useLang();
  const [stage, setStage] = React.useState(2);
  const [annots, setAnnots] = React.useState(30000);
  const [rmAcc, setRmAcc] = React.useState(72);
  const [kl, setKl] = React.useState(0.05);

  // Reward-model accuracy is capped by human agreement (~75-80% on hard pairs).
  const effRm = clamp(0.42 + Math.log10(Math.max(1000, annots)) / 12 + (rmAcc - 60) / 220, 0, 0.95);
  const drift = clamp(0.9 - Math.log10(kl * 1000 + 1) / 3.2, 0, 1);
  const helpful = clamp(0.35 + effRm * 0.55 - Math.max(0, drift - 0.55) * 0.5, 0, 0.98);
  const safe = clamp(0.4 + effRm * 0.45 + (1 - drift) * 0.2, 0, 0.99);
  const diversity = clamp(0.92 - drift * 0.55 - effRm * 0.12, 0.05, 1);
  const gaming = clamp(drift * 0.8 * (1 - effRm) + Math.max(0, 0.75 - effRm) * 0.5, 0, 1);
  const tax = clamp(drift * 0.35 + (1 - diversity) * 0.2, 0, 1);

  return (
    <div>
      <VizHead idx="AL1" title={L("RLHF 三段流水线:调节标注量、奖励模型与 KL", "The RLHF pipeline: annotations, reward model, KL leash")} />
      <div className="lm-steps">
        {RLHF_STAGES.map((s, i) => (
          <div key={s.k} className={`lm-step ${i === stage ? "now" : ""}`} style={{ cursor: "pointer" }} onClick={() => setStage(i)}>
            <span className="sn">{i + 1}</span>
            <div>
              <div className="c-name">{pick(lang, s)}</div>
              {i === stage && <div style={{ marginTop: 6 }}>{pick(lang, s.d)}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="viz-ctrl" style={{ marginTop: 14 }}>
        <Slider label={L("偏好标注量", "Preference annotations")} min={1000} max={300000} step={1000} value={annots} onChange={setAnnots} fmt={(v) => big(v)} />
        <Slider label={L("奖励模型准确率", "Reward-model accuracy")} min={55} max={90} step={1} value={rmAcc} onChange={setRmAcc} unit="%" />
        <Slider label={L("KL 惩罚系数", "KL coefficient")} min={0.001} max={0.5} step={0.001} value={kl} onChange={setKl} fmt={(v) => nf(v, 3)} />
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("有用性", "Helpfulness")} value={pct(helpful)} tone={helpful > 0.8 ? "ok" : helpful < 0.5 ? "warn" : "acc"} />
        <Kpi label={L("安全性", "Safety")} value={pct(safe)} tone={safe > 0.85 ? "ok" : ""} />
        <Kpi label={L("输出多样性", "Output diversity")} value={pct(diversity)} tone={diversity < 0.4 ? "warn" : ""}
          hint={L("对齐税的一部分", "part of the alignment tax")} />
        <Kpi label={L("刷分行为", "Reward gaming")} value={pct(gaming)} tone={gaming > 0.4 ? "warn" : "ok"} />
      </div>

      <div className="lm-bars" style={{ marginTop: 14 }}>
        <Bar label={L("离参考模型的漂移", "Drift from reference")} value={drift} max={1} tone={drift > 0.6 ? "warn" : "acc"} valText={pct(drift)} />
        <Bar label={L("对齐税(通用能力损失)", "Alignment tax")} value={tax} max={1} tone={tax > 0.4 ? "warn" : ""} valText={pct(tax)} />
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        {kl < 0.008 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`KL 系数 ${nf(kl, 3)} 几乎等于没有约束,漂移已到 ${pct(drift)}。这是 RLHF 最经典的失败画面:模型发现了奖励模型的漏洞——比如写得特别长、特别客气、反复确认用户的感受——奖励分一路上涨,而人读起来越来越难受。奖励模型不是人,它只是一个会犯错的近似。`,
              `A KL coefficient of ${nf(kl, 3)} is nearly no constraint at all, and drift has reached ${pct(drift)}. This is RLHF's classic failure picture: the policy discovers the reward model's blind spots — extra length, extra deference, restating the user's feelings — and the reward climbs while humans find the output steadily worse. The reward model is not a person; it is a fallible approximation.`)}
          </div></div>
        )}
        {kl > 0.25 && (
          <div className="lm-step now"><span className="sn">i</span><div>
            {L("KL 系数太大时模型几乎不敢动,偏好优化的收益也就没了。这个系数是一根缰绳,不是刹车:太松会漂,太紧等于没训。",
              "With a very large KL coefficient the policy barely moves and the benefit of preference optimization disappears. The coefficient is a rein, not a brake: too loose and it drifts, too tight and you did not train.")}
          </div></div>
        )}
        {rmAcc > 82 && (
          <div className="lm-step now"><span className="sn">i</span><div>
            {L("注意:在困难的偏好对上,人类标注员之间的一致率通常也只有 75–80%。当你的奖励模型「准确率」高于这个数,它很可能在拟合标注偏见(比如偏好长答案)而不是真实的好坏。",
              "A caution: on hard preference pairs, human annotators agree with each other only about 75–80% of the time. When your reward model reports accuracy above that, it is probably fitting annotation bias — a preference for longer answers, say — rather than genuine quality.")}
          </div></div>
        )}
        {diversity < 0.45 && (
          <div className="lm-step"><span className="sn">→</span><div>
            {L("多样性掉到这个水平就是「对齐税」的样子:模型变得安全、礼貌、格式统一,同时也变得单调、爱说套话、创造性任务上明显变差。这不是 bug,是优化一个单一奖励信号的必然结果。缓解办法是在偏好数据里显式加入对多样性和简洁的偏好。",
              "Diversity at this level is what the alignment tax looks like: safer, more polite, more uniform in format — and also monotonous, formulaic, and visibly worse at creative work. This is not a bug but the consequence of optimising a single reward signal. The mitigation is to encode preferences for diversity and brevity into the preference data itself.")}
          </div></div>
        )}
      </div>

      <p className="viz-caption">
        {L("RLHF 解决了监督微调解决不了的问题:标准答案只有一个,而「好」是相对的。它的三段结构里,中间那一段是最脆弱的——奖励模型是一个用几万条人类比较训出来的近似函数,而策略优化的本质就是去找它的最大值。任何近似函数在被极致优化时都会暴露它的错误,这就是为什么 KL 惩罚不是可选项。理解这一点,你就理解了后面 DPO 为什么这么有吸引力:它把最脆弱的那一环整个拆掉了。",
          "RLHF solves what supervised fine-tuning cannot: a reference answer is singular, while 'good' is comparative. Of its three stages the middle one is the most fragile — the reward model is an approximation fitted to tens of thousands of human comparisons, and policy optimization is precisely a search for its maximum. Any approximation reveals its errors under maximal optimisation, which is why the KL penalty is not optional. Grasp that and you understand why DPO is so attractive: it removes the most fragile link entirely.")}
      </p>
    </div>
  );
};

/* =========================================================
   AL2 · dpoLab — β, drift, and preference-data quality
   ========================================================= */
const DpoLabViz = () => {
  const L = useL();
  const [beta, setBeta] = React.useState(0.1);
  const [pairs, setPairs] = React.useState(6000);
  const [prefQuality, setPrefQuality] = React.useState(75);
  const [lenBias, setLenBias] = React.useState(35);

  const dataTerm = clamp(Math.log10(Math.max(200, pairs)) / 4.6, 0, 1);
  const qTerm = 0.3 + 0.7 * (prefQuality / 100);
  const drift = clamp(0.85 / (1 + beta * 14), 0, 1);
  const winRate = clamp(0.5 + dataTerm * qTerm * 0.32 - Math.max(0, drift - 0.6) * 0.28, 0.3, 0.94);
  const margin = clamp(dataTerm * qTerm * 2.6 * (1 + beta * 2), 0, 4);
  const degeneration = clamp(Math.max(0, drift - 0.5) * 1.3 + Math.max(0, (lenBias - 50) / 100), 0, 1);
  const lengthGrowth = Math.round(100 + lenBias * 1.9 + drift * 60);

  // A tiny illustrative preference pair with its implicit reward.
  const chosenLp = -0.72 - margin * 0.1, rejectedLp = -0.72 - margin * 0.1 - margin * 0.34;

  return (
    <div>
      <VizHead idx="AL2" title={L("DPO 实验台:β 拉住的是什么", "DPO bench: what β is actually holding back")} />
      <div className="viz-ctrl">
        <Slider label="β" min={0.01} max={0.6} step={0.01} value={beta} onChange={setBeta} fmt={(v) => nf(v, 2)} />
        <Slider label={L("偏好数据对数", "Preference pairs")} min={200} max={100000} step={200} value={pairs} onChange={setPairs} fmt={(v) => big(v)} />
        <Slider label={L("偏好标注质量", "Preference quality")} min={40} max={98} step={1} value={prefQuality} onChange={setPrefQuality} unit="%" />
        <Slider label={L("标注中的长度偏见", "Length bias in labels")} min={0} max={90} step={5} value={lenBias} onChange={setLenBias} unit="%" />
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("对 SFT 的胜率", "Win rate vs SFT")} value={pct(winRate)} tone={winRate > 0.7 ? "ok" : winRate < 0.55 ? "warn" : "acc"} />
        <Kpi label={L("隐式奖励间隔", "Implicit reward margin")} value={nf(margin, 2)} hint={L("好答案比坏答案高多少", "how far chosen beats rejected")} />
        <Kpi label={L("离参考模型漂移", "Drift from reference")} value={pct(drift)} tone={drift > 0.6 ? "warn" : "ok"} />
        <Kpi label={L("退化风险", "Degeneration risk")} value={pct(degeneration)} tone={degeneration > 0.4 ? "warn" : "ok"} />
      </div>

      <div className="lm-grid2" style={{ marginTop: 14, alignItems: "start" }}>
        <div>
          <span className="lm-label">{L("DPO 损失在做什么", "What the DPO loss does")}</span>
          <div className="lm-code" style={{ marginTop: 4 }}>
            {`L = -log σ( β·[ (logπ(y⁺|x) - logπ_ref(y⁺|x))
              - (logπ(y⁻|x) - logπ_ref(y⁻|x)) ] )

logπ(y⁺)  = ${nf(chosenLp, 3)}    ${L("(更好的回答)", "(preferred)")}
logπ(y⁻)  = ${nf(rejectedLp, 3)}    ${L("(更差的回答)", "(rejected)")}
β         = ${nf(beta, 2)}
${L("隐式奖励差", "implicit reward gap")} = ${nf(margin, 2)}`}
          </div>
          <div className="lm-note">
            {L("注意这个损失里没有奖励模型,也没有采样:它只需要一批 (提示, 好回答, 坏回答) 三元组,和一份冻结的参考模型。整个训练过程和监督微调一样简单——这就是 DPO 的全部工程价值。",
              "Note that this loss contains no reward model and no sampling: it needs only a batch of (prompt, preferred, rejected) triples and a frozen reference model. Training is as simple as supervised fine-tuning — that is the whole engineering value of DPO.")}
          </div>
        </div>
        <div>
          <span className="lm-label">{L("与 RLHF 的流程对比", "Pipeline comparison")}</span>
          <table className="lm-table">
            <thead><tr><th></th><th>RLHF (PPO)</th><th>DPO</th></tr></thead>
            <tbody>
              <tr><td>{L("需要奖励模型", "Reward model")}</td><td className="neg">{L("要", "yes")}</td><td className="pos">{L("不要", "no")}</td></tr>
              <tr><td>{L("需要在线采样", "Online sampling")}</td><td className="neg">{L("要", "yes")}</td><td className="pos">{L("不要", "no")}</td></tr>
              <tr><td>{L("同时驻留的模型数", "Models in memory")}</td><td>4</td><td className="pos">2</td></tr>
              <tr><td>{L("实现复杂度", "Implementation")}</td><td className="neg">{L("高", "high")}</td><td className="pos">{L("低", "low")}</td></tr>
              <tr><td>{L("上限", "Ceiling")}</td><td className="pos">{L("略高", "slightly higher")}</td><td>{L("接近", "close")}</td></tr>
              <tr><td>{L("对数据质量敏感", "Data sensitivity")}</td><td>{L("中", "moderate")}</td><td className="neg">{L("高", "high")}</td></tr>
            </tbody>
          </table>
          <div className="lm-note">
            {L(`当前配置下回答平均长度会变成基线的 ${lengthGrowth}%。`, `At this configuration answers grow to about ${lengthGrowth}% of baseline length.`)}
          </div>
        </div>
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        {beta < 0.04 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`β=${nf(beta, 2)} 太小,模型可以离参考模型很远(漂移 ${pct(drift)})。DPO 在这个区间的典型退化是:它学会了「好答案的表面特征」——更长、更多小标题、更多免责声明——而不是更好的内容。这和 RLHF 里的奖励黑客是同一种病,只是这里的「奖励模型」是隐含在数据里的。`,
              `β=${nf(beta, 2)} is too small and the policy can wander far from its reference (drift ${pct(drift)}). DPO's typical degeneration in this regime: it learns the surface features of good answers — longer, more headings, more disclaimers — rather than better content. Same disease as reward hacking in RLHF; here the reward model is implicit in the data.`)}
          </div></div>
        )}
        {beta > 0.35 && (
          <div className="lm-step now"><span className="sn">i</span><div>
            {L("β 很大时模型被牢牢拴在 SFT 附近,胜率提升有限。如果你观察到「DPO 之后几乎没变化」,先检查 β,再检查偏好对的区分度——两个都很好的回答放在一起,没有任何信号可学。",
              "With a large β the policy stays firmly near the SFT model and the win-rate gain is limited. If you observe 'DPO changed almost nothing', check β first, then check whether the pairs are actually distinguishable — two equally good answers carry no signal.")}
          </div></div>
        )}
        {lenBias > 55 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`长度偏见 ${lenBias}%:你的标注员倾向于选更长的回答(这是人类标注里最顽固的偏见之一)。模型会忠实地学到「长即好」,输出膨胀到基线的 ${lengthGrowth}%。对策有两个:标注时控制长度(把长度相近的答案配对),或者在数据里显式加入「同样正确但更短」的偏好对。`,
              `Length bias at ${lenBias}%: your annotators prefer longer answers — the most stubborn bias in human labelling. The model faithfully learns that longer is better, inflating output to ${lengthGrowth}% of baseline. Two remedies: control for length while annotating (pair answers of similar length), or add explicit 'equally correct but shorter' preference pairs.`)}
          </div></div>
        )}
        {pairs < 1500 && (
          <div className="lm-step now"><span className="sn">i</span><div>
            {L("偏好对少于一两千时,DPO 通常只能带来很小的、噪声级别的提升。DPO 对数据质量比 RLHF 更敏感——因为它没有奖励模型这一层去平滑标注噪声,每一对错标都会直接进入梯度。",
              "Below one or two thousand pairs, DPO usually yields only small, noise-level gains. DPO is more data-sensitive than RLHF: without a reward model to smooth annotation noise, every mislabelled pair enters the gradient directly.")}
          </div></div>
        )}
      </div>

      <p className="viz-caption">
        {L("DPO 的推导是近年最漂亮的结果之一:既然 RLHF 的最优策略与奖励函数之间有一个闭式关系,那就可以把奖励反解出来,用策略自己表示它——奖励模型于是被整个消掉了,剩下一个形状像分类损失的目标函数。工程上的差别是决定性的:两个模型而不是四个,一张卡而不是一个集群,几十行代码而不是一个 PPO 实现。代价是它把全部压力转移到了偏好数据上:没有奖励模型这一层缓冲,数据里的每一个偏见都会被直接、放大地学进模型。",
          "DPO's derivation is one of the most elegant recent results: since the RLHF optimum relates policy and reward in closed form, the reward can be solved for and expressed by the policy itself — eliminating the reward model and leaving an objective shaped like a classification loss. The engineering difference is decisive: two models instead of four, one GPU instead of a cluster, tens of lines instead of a PPO implementation. The price is that all the pressure moves onto the preference data: with no reward model to buffer it, every bias in the labels is learned directly and amplified.")}
      </p>
    </div>
  );
};

/* =========================================================
   AL3 · rewardHack — design a reward, watch it get gamed
   ========================================================= */
const REWARD_TERMS = [
  { k: "answer", zh: "最终答案正确(程序判定)", en: "Final answer correct (program-checked)", w: 1.0, verify: true },
  { k: "tests", zh: "通过单元测试", en: "Unit tests pass", w: 0.9, verify: true },
  { k: "format", zh: "输出格式合法", en: "Output format valid", w: 0.3, verify: true },
  { k: "steps", zh: "推理过程每步正确(过程奖励)", en: "Each reasoning step correct (process reward)", w: 0.8, verify: false },
  { k: "length", zh: "回答足够详细", en: "Answer is sufficiently detailed", w: 0.4, verify: false },
  { k: "judge", zh: "模型评审打分", en: "Model-judge score", w: 0.6, verify: false },
];
const HACKS = [
  { needs: ["answer"], excl: ["steps"], zh: "猜答案:模型学会在推理里绕圈,然后输出一个常见答案。选择题上尤其明显——只看最终答案的奖励在四选一任务上给了 25% 的免费分。", en: "Guessing: the model learns to pad its reasoning and then emit a common answer. Especially visible on multiple choice — an answer-only reward hands out 25% for free on a four-way question." },
  { needs: ["tests"], excl: [], zh: "针对测试写死:如果测试只检查三个输入,模型会写 if 分支覆盖这三个输入。它通过了全部测试,而逻辑是错的。防御:测试集必须对模型不可见,并且随机生成。", en: "Test-targeted hardcoding: if the tests check three inputs, the model writes three if-branches. All tests pass and the logic is wrong. Defence: keep tests hidden from the model and generate inputs randomly." },
  { needs: ["length"], excl: [], zh: "灌水:奖励详细度等于奖励长度。模型会加免责声明、重述问题、列举无关的注意事项。这是所有奖励里最容易被钻的一项。", en: "Padding: rewarding detail rewards length. The model adds disclaimers, restates the question and lists irrelevant caveats. The single most gameable term on the list." },
  { needs: ["judge"], excl: [], zh: "讨好评审:模型学会用评审模型偏好的措辞和结构——分点、加粗、开头先肯定问题很好。内容没变好,分数上去了。", en: "Flattering the judge: the model learns the phrasing and structure the judge prefers — bullets, bold text, an opening compliment. The content did not improve; the score did." },
  { needs: ["format"], excl: ["answer", "tests"], zh: "只保格式:当格式分占比过高而正确性没有被检查时,模型会输出格式完美但内容空洞的回答。", en: "Format-only: when the format term dominates and correctness is unchecked, the model emits impeccably formatted emptiness." },
];
const RewardHackViz = () => {
  const L = useL();
  const lang = useLang();
  const [on, setOn] = React.useState({ answer: true, format: true });
  const [pressure, setPressure] = React.useState(70);

  const active = REWARD_TERMS.filter((t) => on[t.k]);
  const verifiable = active.filter((t) => t.verify);
  const verifyShare = active.length ? verifiable.reduce((s, t) => s + t.w, 0) / active.reduce((s, t) => s + t.w, 0) : 0;
  const hacks = HACKS.filter((h) => h.needs.every((k) => on[k]) && !h.excl.some((k) => on[k]));
  const hackRisk = clamp((hacks.length / 3) * (pressure / 100) * (1.25 - verifyShare * 0.5), 0, 1);
  const trueGain = clamp(0.25 + verifyShare * 0.45 + (on.steps ? 0.2 : 0) + active.length * 0.03 - hackRisk * 0.55, 0, 0.98);
  const rewardScore = clamp(0.3 + (pressure / 100) * 0.65 + active.length * 0.02, 0, 0.99);

  return (
    <div>
      <VizHead idx="AL3" title={L("奖励黑客实验室:你设计奖励,模型钻空子", "Reward-hacking lab: you design the reward, the model finds the loophole")} />
      <span className="lm-label">{L("勾选奖励项", "Toggle reward terms")}</span>
      <div className="lm-check">
        {REWARD_TERMS.map((t) => (
          <div key={t.k} className={`c-item ${on[t.k] ? "done" : ""}`} onClick={() => setOn((o) => ({ ...o, [t.k]: !o[t.k] }))}>
            <span className="c-box">{on[t.k] ? "✓" : ""}</span>
            <div>
              <div className="c-name">{pick(lang, t)}
                <span className={`lm-tag ${t.verify ? "pri" : "acc"}`} style={{ marginLeft: 8 }}>
                  {t.verify ? L("可验证", "verifiable") : L("需模型或人评判", "judged")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="viz-ctrl" style={{ marginTop: 12 }}>
        <Slider label={L("优化强度(训练步数)", "Optimization pressure")} min={0} max={100} step={5} value={pressure} onChange={setPressure} unit="%" />
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("奖励分数", "Reward score")} value={pct(rewardScore)} tone="acc" hint={L("你看到的数字", "the number you see")} />
        <Kpi label={L("真实能力提升", "Real capability gain")} value={pct(trueGain)} tone={trueGain > 0.65 ? "ok" : trueGain < 0.4 ? "warn" : ""}
          hint={L("你想要的东西", "the thing you wanted")} />
        <Kpi label={L("可验证奖励占比", "Verifiable share")} value={pct(verifyShare)} tone={verifyShare > 0.7 ? "ok" : ""} />
        <Kpi label={L("黑客风险", "Hacking risk")} value={pct(hackRisk)} tone={hackRisk > 0.4 ? "warn" : "ok"} />
      </div>

      {rewardScore - trueGain > 0.25 && (
        <div className="lm-steps" style={{ marginTop: 12 }}>
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`注意这两个数字的差距:奖励分 ${pct(rewardScore)},真实提升 ${pct(trueGain)}。这个缺口就是奖励黑客的定义——模型在优化你写下的那个指标,而不是你心里想要的那件事。而你在训练日志里只能看到前一个数字。`,
              `Mind the gap between the two: reward ${pct(rewardScore)}, real gain ${pct(trueGain)}. That gap is the definition of reward hacking — the model optimises the metric you wrote, not the thing you meant. And your training log only shows you the first number.`)}
          </div></div>
        </div>
      )}

      {hacks.length > 0 && (
        <>
          <span className="lm-label" style={{ marginTop: 16 }}>{L(`模型学到的钻空子方式(${hacks.length} 种)`, `Loopholes the model found (${hacks.length})`)}</span>
          <div className="lm-steps">
            {hacks.map((h, i) => (
              <div key={i} className="lm-step now"><span className="sn">{i + 1}</span><div>{pick(lang, h)}</div></div>
            ))}
          </div>
        </>
      )}

      {on.answer && on.steps && (
        <div className="lm-steps" style={{ marginTop: 12 }}>
          <div className="lm-step"><span className="sn">✓</span><div>
            {L("结果奖励 + 过程奖励一起用,是目前最有效的组合:结果奖励防止模型「过程漂亮但答错」,过程奖励防止它「瞎猜猜对」。代价是过程奖励需要一个能判断每一步的模型或人,成本高得多。",
              "Outcome reward plus process reward is the most effective combination available: the outcome term prevents a beautiful derivation with the wrong answer, the process term prevents a lucky guess. The cost is that process rewards need a model or a person able to judge each step — far more expensive.")}
          </div></div>
        </div>
      )}

      <p className="viz-caption">
        {L("可验证奖励(RLVR)是近年推理能力跃升的关键:在数学和代码上,「对不对」可以由程序判定,于是奖励信号既便宜又不会被讨好。但这个实验室想让你记住的是另一半——任何奖励函数在被足够强的优化压力作用下,都会暴露它和你真实意图之间的缝隙,而模型会精确地钻进那道缝。这不是模型「不老实」,它只是在做你让它做的事。所以设计奖励时永远要问一句:如果我只优化这个指标到极致,最省力的路径是什么?那条路径就是你会得到的东西。",
          "Verifiable rewards (RLVR) are central to the recent jump in reasoning: in maths and code, correctness can be decided by a program, making the signal both cheap and unflatterable. But the other half is what this lab wants you to remember — under enough optimisation pressure, every reward function reveals the gap between itself and your actual intent, and the model enters that gap precisely. This is not dishonesty; it is doing exactly what you asked. So when designing a reward, always ask: if I maximised this metric alone, what is the laziest path? That path is what you will get.")}
      </p>
    </div>
  );
};

/* =========================================================
   EV1 · evalHarness — pass rate, regressions, confidence
   ========================================================= */
const EvalHarnessViz = () => {
  const L = useL();
  const [n, setN] = React.useState(50);
  const [delta, setDelta] = React.useState(4);
  const [grader, setGrader] = React.useState("keypoint");
  const [contaminated, setContaminated] = React.useState(false);

  const basePass = 0.68;
  const newPass = clamp(basePass + delta / 100, 0, 1);
  // 95% CI half-width for a difference of two proportions on a shared item set.
  const se = Math.sqrt((basePass * (1 - basePass) + newPass * (1 - newPass)) / n);
  const ci = 1.96 * se * 100;
  const significant = Math.abs(delta) > ci;
  const graderInfo = {
    exact: { zh: "精确匹配:最便宜、零歧义,但只适用于答案唯一且格式固定的任务(分类、抽取、数值)。对自由文本几乎不可用。", en: "Exact match: cheapest, unambiguous, but only for tasks with one answer in a fixed format (classification, extraction, numbers). Nearly useless on free text.", noise: 0.3 },
    keypoint: { zh: "要点覆盖:为每条样本预先写下必须出现的 2–5 个要点,判分时检查覆盖率。这是自由文本任务上性价比最高的方式,也是最推荐的默认选择。", en: "Key-point coverage: pre-write the 2–5 points each answer must contain and score coverage. The best value on free-text tasks and the recommended default.", noise: 0.6 },
    judge: { zh: "模型评审:让一个强模型按评分标准打分。可扩展,但有系统性偏见(偏爱长答案、偏爱自己的措辞风格),必须先用人工样本校准过。", en: "Model judge: have a strong model score against a rubric. Scalable, but carries systematic biases (favouring length, favouring its own phrasing) and must be calibrated against human labels first.", noise: 1.1 },
    human: { zh: "人工:最准也最慢最贵。正确用法不是全量人工,而是用它校准另外三种判分方式,以及处理评估集里最难的那 10%。", en: "Human: most accurate, slowest, most expensive. The right use is not grading everything but calibrating the other three methods and handling the hardest 10% of the set.", noise: 0.15 },
  }[grader];

  const regressions = Math.max(0, Math.round(n * (0.06 + Math.max(0, -delta) / 220) * (1 + graderInfo.noise * 0.4)));
  const gains = Math.max(0, Math.round(n * (delta / 100 + 0.06)));

  return (
    <div>
      <VizHead idx="EV1" title={L("评估台:4 个点的提升,到底说明了什么", "Evaluation bench: what does a 4-point gain actually prove")} />
      <div className="viz-ctrl">
        <Slider label={L("评估集条数", "Eval set size")} min={10} max={1000} step={10} value={n} onChange={setN} />
        <Slider label={L("观察到的提升", "Observed gain")} min={-10} max={25} step={1} value={delta} onChange={setDelta} unit="%" />
        <Choice label={L("判分方式", "Grading method")} value={grader} onChange={setGrader} options={[
          { v: "exact", l: L("精确匹配", "exact match") },
          { v: "keypoint", l: L("要点覆盖", "key-point") },
          { v: "judge", l: L("模型评审", "model judge") },
          { v: "human", l: L("人工", "human") },
        ]} />
        <label><span>{L("评估集被污染", "Contaminated set")}</span>
          <Seg value={contaminated ? "y" : "n"} onChange={(v) => setContaminated(v === "y")}
            options={[{ v: "n", l: L("干净", "clean") }, { v: "y", l: L("污染", "contaminated") }]} /></label>
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("基线通过率", "Baseline pass rate")} value={pct(basePass)} />
        <Kpi label={L("新版本通过率", "New pass rate")} value={pct(newPass)} tone="acc" />
        <Kpi label={L("95% 置信区间", "95% CI half-width")} value={`±${nf(ci, 1)}%`}
          tone={significant ? "ok" : "warn"} />
        <Kpi label={L("结论", "Verdict")} value={significant ? L("有统计意义", "significant") : L("噪声", "noise")}
          tone={significant ? "ok" : "warn"} />
      </div>

      <div className="lm-bars" style={{ marginTop: 14 }}>
        <Bar label={L("变好的样本", "Items improved")} value={gains} max={n} tone="ok" valText={`${gains}`} />
        <Bar label={L("变坏的样本(回归)", "Items regressed")} value={regressions} max={n} tone="warn" valText={`${regressions}`} />
        <Bar label={L("没变的样本", "Unchanged")} value={Math.max(0, n - gains - regressions)} max={n} valText={`${Math.max(0, n - gains - regressions)}`} />
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        {!significant && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`在 ${n} 条样本上,${delta > 0 ? "+" : ""}${delta}% 的变化落在 ±${nf(ci, 1)}% 的置信区间内——它在统计上什么也没说明。这是大模型项目里最常见的自欺:改一个提示词,通过率从 68% 变成 72%,团队宣布改进成功,而这两个数字的差别和抛硬币差不多。要检测 4 个点的真实差异,你需要大约 ${Math.round(1.96 ** 2 * 2 * basePass * (1 - basePass) / (0.04 ** 2))} 条样本。`,
              `On ${n} items, a ${delta > 0 ? "+" : ""}${delta}% change sits inside a ±${nf(ci, 1)}% confidence interval — it proves nothing. This is the commonest self-deception in LLM work: tweak a prompt, watch pass rate move from 68% to 72%, declare success, when the difference is roughly a coin flip. To detect a real 4-point difference you need about ${Math.round(1.96 ** 2 * 2 * basePass * (1 - basePass) / (0.04 ** 2))} items.`)}
          </div></div>
        )}
        {regressions > 0 && (
          <div className="lm-step now"><span className="sn">i</span><div>
            {L(`即使总分上升,仍有 ${regressions} 条样本变坏了。只看总通过率会完全错过这件事——而客户记住的恰恰是这 ${regressions} 条。所以评估报告必须分开列出「提升项」和「回归项」,并且每一条回归都要被看一眼。`,
              `Even with the total rising, ${regressions} items got worse. A single pass-rate number hides this completely — and those ${regressions} are exactly what the customer will remember. Evaluation reports must list gains and regressions separately, and every regression deserves a look.`)}
          </div></div>
        )}
        {contaminated && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L("评估集被污染时,这里所有数字都是无效的。污染有两种来路:一是你的评估样本进了训练数据(常见于用同一批数据切分训练集和评估集但没去重),二是你反复用同一个评估集调参——那叫过拟合评估集,分数照样虚高。对策:留一份从头到尾没被看过的保留集,只在最终验收时用一次。",
              "With a contaminated set every number here is void. Contamination arrives two ways: your eval items entered the training data (common when splitting one dataset without deduplication), or you tuned repeatedly against the same eval set — that is overfitting your own evaluation, and it inflates the score just as effectively. The remedy: keep one held-out set nobody has ever looked at, and spend it once at final acceptance.")}
          </div></div>
        )}
        <div className="lm-step"><span className="sn">→</span><div>{L(graderInfo.zh, graderInfo.en)}</div></div>
      </div>

      <p className="viz-caption">
        {L("这一章其实只想让你养成三个习惯。第一,在动手改任何东西之前先建一个 50–200 条的黄金评估集,样本来自真实用户的真实问题,而不是你想象出来的问题。第二,每次改动跑全集,并且分开报告提升和回归——总分是给管理层看的,回归项是给你自己看的。第三,永远把置信区间写在提升数字旁边;当你学会问「这个提升出了置信区间吗」,你就再也不会被一次好看的抽样骗到了。",
          "This chapter really only wants you to form three habits. First, before changing anything, build a golden set of 50–200 items drawn from real user questions rather than imagined ones. Second, rerun the whole set on every change and report gains and regressions separately — the total is for management, the regressions are for you. Third, always write the confidence interval next to the gain; once you habitually ask 'does this clear the interval?', a flattering sample can never fool you again.")}
      </p>
    </div>
  );
};

/* =========================================================
   EV2 · redTeam — safety against over-refusal
   ========================================================= */
const ATTACKS = [
  { k: "direct", zh: "直接询问有害内容", en: "Direct harmful request", hard: 0.1, kind: "jailbreak" },
  { k: "roleplay", zh: "角色扮演绕过(「假设你是…」)", en: "Role-play framing ('suppose you were…')", hard: 0.45, kind: "jailbreak" },
  { k: "encode", zh: "编码/多语言混淆", en: "Encoding or multilingual obfuscation", hard: 0.6, kind: "jailbreak" },
  { k: "manystep", zh: "分步拆解(每步无害)", en: "Step-wise decomposition (each step benign)", hard: 0.75, kind: "jailbreak" },
  { k: "inject", zh: "文档里的提示注入", en: "Prompt injection inside a document", hard: 0.85, kind: "injection" },
  { k: "tool", zh: "通过工具调用越权", en: "Privilege escalation via tool call", hard: 0.9, kind: "injection" },
];
const BENIGN = [
  { k: "med", zh: "「我妈的药和这个药能一起吃吗」", en: "'Can my mother take this drug alongside that one?'" },
  { k: "sec", zh: "「帮我看看这段代码有没有 SQL 注入漏洞」", en: "'Check this code for SQL injection'" },
  { k: "hist", zh: "「二战期间的化学武器使用历史」", en: "'The history of chemical weapon use in WWII'" },
  { k: "fic", zh: "「帮我写一个反派角色的独白」", en: "'Write a villain's monologue for my novel'" },
];
const RedTeamViz = () => {
  const L = useL();
  const lang = useLang();
  const [safety, setSafety] = React.useState(60);
  const [ftPressure, setFtPressure] = React.useState(40);
  const [sysPrompt, setSysPrompt] = React.useState(true);
  const [toolGuard, setToolGuard] = React.useState(true);

  // Fine-tuning on task data erodes the base model's refusal behaviour.
  const effSafety = clamp(safety / 100 - (ftPressure / 100) * 0.45 + (sysPrompt ? 0.08 : 0), 0, 1);
  const overRefuse = clamp(Math.pow(safety / 100, 2.2) * 0.55, 0, 1);
  const rows = ATTACKS.map((a) => {
    let block = clamp(effSafety * (1.25 - a.hard), 0, 1);
    if (a.kind === "injection") block = clamp(block * 0.5 + (toolGuard ? 0.45 : 0), 0, 1);
    return { ...a, block };
  });
  const jailbreakRate = 1 - rows.filter((r) => r.kind === "jailbreak").reduce((s, r) => s + r.block, 0) / 4;
  const injectionRate = 1 - rows.filter((r) => r.kind === "injection").reduce((s, r) => s + r.block, 0) / 2;
  const usable = clamp(1 - overRefuse * 1.15, 0, 1);

  return (
    <div>
      <VizHead idx="EV2" title={L("红队推演:安全与有用性是同一根滑块的两头", "Red-team drill: safety and helpfulness share one slider")} />
      <div className="viz-ctrl">
        <Slider label={L("安全对齐强度", "Safety alignment strength")} min={0} max={100} step={5} value={safety} onChange={setSafety} unit="%" />
        <Slider label={L("任务微调强度", "Task fine-tuning pressure")} min={0} max={100} step={5} value={ftPressure} onChange={setFtPressure} unit="%" />
        <label><span>{L("系统提示约束", "System-prompt rules")}</span>
          <Seg value={sysPrompt ? "y" : "n"} onChange={(v) => setSysPrompt(v === "y")}
            options={[{ v: "y", l: L("有", "on") }, { v: "n", l: L("无", "off") }]} /></label>
        <label><span>{L("工具层权限控制", "Tool-layer permissions")}</span>
          <Seg value={toolGuard ? "y" : "n"} onChange={(v) => setToolGuard(v === "y")}
            options={[{ v: "y", l: L("有", "on") }, { v: "n", l: L("无", "off") }]} /></label>
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("越狱成功率", "Jailbreak success")} value={pct(jailbreakRate)} tone={jailbreakRate > 0.35 ? "warn" : "ok"} />
        <Kpi label={L("注入成功率", "Injection success")} value={pct(injectionRate)} tone={injectionRate > 0.3 ? "warn" : "ok"} />
        <Kpi label={L("过度拒绝率", "Over-refusal rate")} value={pct(overRefuse)} tone={overRefuse > 0.25 ? "warn" : "ok"} />
        <Kpi label={L("正常请求可用率", "Legitimate requests served")} value={pct(usable)} tone={usable > 0.85 ? "ok" : "warn"} />
      </div>

      <span className="lm-label" style={{ marginTop: 14 }}>{L("攻击拦截率(越难的攻击越靠下)", "Block rate by attack (harder attacks lower down)")}</span>
      <div className="lm-bars">
        {rows.map((r) => (
          <Bar key={r.k} label={pick(lang, r)} value={r.block} max={1}
            tone={r.block > 0.8 ? "ok" : r.block < 0.5 ? "warn" : ""} valText={pct(r.block)} />
        ))}
      </div>

      <span className="lm-label" style={{ marginTop: 14 }}>{L("正常请求会不会被误拒", "Do legitimate requests get refused")}</span>
      <div className="lm-bars">
        {BENIGN.map((b, i) => {
          const refused = clamp(overRefuse * (0.7 + i * 0.15), 0, 1);
          return <Bar key={b.k} label={pick(lang, b)} value={refused} max={1}
            tone={refused > 0.3 ? "warn" : "ok"} valText={refused > 0.3 ? L("常被拒", "often refused") : L("正常回答", "answered")} />;
        })}
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        {ftPressure > 50 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`任务微调强度 ${ftPressure}% 时,基座模型的安全行为被冲掉了很大一部分——即使你的训练数据里完全没有有害内容。原因很朴素:你在几百条同质样本上反复优化,而拒答行为在这些样本里从未出现过,于是它被「训练不到」的方向自然衰减。对策:在 SFT 数据里混入一小部分安全样本(通常 2–5% 就有明显效果),并在微调后重跑安全评估。`,
              `At ${ftPressure}% task fine-tuning pressure, a large part of the base model's safety behaviour has washed out — even though your training data contains nothing harmful. The reason is plain: you optimised repeatedly on a few hundred homogeneous examples in which refusal never appears, so refusal decays in the untrained direction. Remedy: mix a small share of safety examples into the SFT data (2–5% is usually visibly effective) and rerun the safety evaluation after tuning.`)}
          </div></div>
        )}
        {overRefuse > 0.3 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`过度拒绝 ${pct(overRefuse)}:模型开始拒绝那些完全正常的请求——问药物相互作用的护士、查 SQL 注入漏洞的开发者、写反派台词的作者。这一类失败很少被报告(用户不会投诉,他们直接不用了),但它在商业上和越狱一样致命。`,
              `Over-refusal at ${pct(overRefuse)}: the model starts declining entirely legitimate requests — the nurse asking about drug interactions, the developer checking for SQL injection, the novelist writing a villain. This failure class is rarely reported (users do not complain, they just leave) but it is as commercially fatal as a jailbreak.`)}
          </div></div>
        )}
        {!toolGuard && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L("关掉工具层权限后,提示注入的拦截率断崖式下降。这一点必须说清楚:提示注入不是一个可以靠对齐解决的问题。模型无法可靠区分「用户的指令」和「文档里假装是指令的一段文字」,所以防线必须在模型之外——只暴露只读工具、对写操作要求人工确认、把不可信内容明确标注为数据。",
              "With tool-layer permissions off, injection block rates collapse. This must be stated plainly: prompt injection is not a problem alignment can solve. The model cannot reliably distinguish the user's instruction from text in a document pretending to be one, so the defence must live outside the model — expose only read-only tools, require human confirmation for writes, and mark untrusted content explicitly as data.")}
          </div></div>
        )}
        {jailbreakRate < 0.2 && overRefuse < 0.2 && (
          <div className="lm-step"><span className="sn">✓</span><div>
            {L("这是一个平衡得不错的位置:难攻击仍有漏网,但正常请求几乎不受影响。请注意「零越狱」不是一个现实目标——足够有耐心的攻击者总能找到路径。现实的目标是:让攻击的成本高于收益,并且让所有真正危险的操作都需要经过模型之外的一道闸。",
              "This is a reasonably balanced position: hard attacks still get through occasionally, while legitimate requests are barely affected. Note that zero jailbreaks is not a realistic target — a sufficiently patient attacker always finds a path. The realistic target is to make attacks cost more than they yield, and to put every genuinely dangerous action behind a gate outside the model.")}
          </div></div>
        )}
      </div>

      <p className="viz-caption">
        {L("这个推演想说清两件常被忽略的事。第一,微调会侵蚀安全行为,而且不需要你的数据里有任何有害内容——这是训练分布单一化的自然后果,所以「微调后重跑安全评估」应该是一条硬性流程。第二,安全和有用是同一根滑块的两头,不存在同时最大化的位置,你必须显式地选一个点并把它写下来:哪些请求宁可误拒,哪些请求宁可放过。把这个决定留给默认值,等于让别人替你决定你的产品能不能用。",
          "This drill makes two commonly ignored points. First, fine-tuning erodes safety behaviour, and it needs no harmful content in your data — it is the natural consequence of a narrow training distribution, which is why 'rerun the safety eval after tuning' should be a hard rule in your process. Second, safety and helpfulness are two ends of one slider; there is no position maximising both, so you must explicitly choose a point and write it down: which requests you would rather wrongly refuse, and which you would rather let through. Leaving that decision to defaults means letting someone else decide whether your product is usable.")}
      </p>
    </div>
  );
};

/* =========================================================
   EV3 · prodCost — routing, caching, and the monthly bill
   ========================================================= */
const PROD_TIERS = [
  { k: "small", zh: "微调过的小模型", en: "Fine-tuned small model", price: 0.25, lat: 240, quality: 0.82 },
  { k: "large", zh: "通用大模型", en: "General large model", price: 9, lat: 1400, quality: 0.94 },
];
const ProdCostViz = () => {
  const L = useL();
  const [daily, setDaily] = React.useState(50000);
  const [inTok, setInTok] = React.useState(900);
  const [outTok, setOutTok] = React.useState(220);
  const [threshold, setThreshold] = React.useState(65);
  const [cacheHit, setCacheHit] = React.useState(25);
  const [escalate, setEscalate] = React.useState(true);

  const billable = daily * (1 - cacheHit / 100);
  const smallShare = escalate ? clamp(threshold / 100, 0, 1) : 0;
  const largeShare = 1 - smallShare;
  const tokPerCall = (inTok + outTok) / 1e6;
  const costSmall = billable * smallShare * tokPerCall * PROD_TIERS[0].price;
  // Escalated calls pay twice: once for the small attempt, once for the large model.
  const costLarge = billable * largeShare * tokPerCall * PROD_TIERS[1].price;
  const retryCost = escalate ? billable * largeShare * tokPerCall * PROD_TIERS[0].price : 0;
  const monthly = (costSmall + costLarge + retryCost) * 30;
  const allLarge = daily * tokPerCall * PROD_TIERS[1].price * 30;
  const saving = 1 - monthly / allLarge;
  const quality = smallShare * PROD_TIERS[0].quality + largeShare * PROD_TIERS[1].quality;
  const p95 = (cacheHit / 100) * 15 + smallShare * PROD_TIERS[0].lat + largeShare * (PROD_TIERS[1].lat + (escalate ? PROD_TIERS[0].lat : 0));

  return (
    <div>
      <VizHead idx="EV3" title={L("生产成本沙盘:路由、缓存与月账单", "Production sandbox: routing, caching and the monthly bill")} />
      <div className="viz-ctrl">
        <Slider label={L("日调用量", "Daily calls")} min={1000} max={500000} step={1000} value={daily} onChange={setDaily} fmt={(v) => big(v)} />
        <Slider label={L("平均输入 token", "Avg input tokens")} min={100} max={8000} step={100} value={inTok} onChange={setInTok} />
        <Slider label={L("平均输出 token", "Avg output tokens")} min={20} max={2000} step={20} value={outTok} onChange={setOutTok} />
        <Slider label={L("小模型承担比例", "Share handled by small model")} min={0} max={100} step={5} value={threshold} onChange={setThreshold} unit="%" />
        <Slider label={L("缓存命中率", "Cache hit rate")} min={0} max={70} step={5} value={cacheHit} onChange={setCacheHit} unit="%" />
        <label><span>{L("级联(小模型先试)", "Cascade (small first)")}</span>
          <Seg value={escalate ? "y" : "n"} onChange={(v) => setEscalate(v === "y")}
            options={[{ v: "y", l: L("开", "on") }, { v: "n", l: L("关", "off") }]} /></label>
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("月成本", "Monthly cost")} value={`$${big(monthly)}`} tone="acc" />
        <Kpi label={L("相比全用大模型", "vs all-large")} value={saving > 0 ? `-${pct(saving)}` : `+${pct(-saving)}`}
          tone={saving > 0.5 ? "ok" : saving < 0 ? "warn" : ""} hint={`$${big(allLarge)}`} />
        <Kpi label={L("综合质量", "Blended quality")} value={pct(quality)} tone={quality > 0.9 ? "ok" : quality < 0.85 ? "warn" : ""} />
        <Kpi label={L("P95 延迟", "P95 latency")} value={nf(p95, 0)} unit=" ms" tone={p95 > 1500 ? "warn" : "ok"} />
      </div>

      <div className="lm-bars" style={{ marginTop: 14 }}>
        <Bar label={L("缓存命中(零成本)", "Cache hits (free)")} value={daily * (cacheHit / 100)} max={daily} tone="ok"
          valText={`${big(daily * (cacheHit / 100))} ${L("次/天", "/day")}`} />
        <Bar label={L("小模型处理", "Handled by small model")} value={billable * smallShare} max={daily} tone="acc"
          valText={`$${big(costSmall * 30)}/mo`} />
        <Bar label={L("升级到大模型", "Escalated to large model")} value={billable * largeShare} max={daily} tone="warn"
          valText={`$${big((costLarge + retryCost) * 30)}/mo`} />
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        {cacheHit >= 25 && (
          <div className="lm-step"><span className="sn">✓</span><div>
            {L(`缓存命中 ${cacheHit}% 直接省掉了同样比例的成本和几乎全部延迟,而它通常是这四个旋钮里最容易实现的一个:真实流量里重复问题的比例常常出乎意料地高(FAQ、模板化请求、重试)。上线前先量一下你的重复率,这往往是投入产出比最高的一次优化。`,
              `A ${cacheHit}% cache hit rate removes the same share of cost and nearly all of its latency, and it is usually the easiest of these four knobs: the proportion of repeated questions in real traffic is often surprisingly high (FAQs, templated requests, retries). Measure your repeat rate before launch — it is frequently the highest-return optimisation available.`)}
          </div></div>
        )}
        {escalate && threshold > 30 && (
          <div className="lm-step"><span className="sn">i</span><div>
            {L(`注意级联的隐藏成本:升级的那 ${pct(largeShare)} 请求付了两次钱(小模型试一次 + 大模型再来一次),延迟也是两段相加。所以级联的收益取决于小模型能独立解决的比例——低于六七成时,级联可能不如直接按请求类型硬路由。`,
              `Mind the cascade's hidden cost: the ${pct(largeShare)} that escalate pay twice (one small attempt plus the large call), and their latency is the sum of both. So the cascade's value depends on how much the small model resolves alone — below roughly two-thirds, hard routing by request type often beats cascading.`)}
          </div></div>
        )}
        {quality < 0.85 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`综合质量掉到 ${pct(quality)} 了。省钱不能以看不见的质量下降为代价——请把路由后的综合质量当成一个必须持续监控的指标,并且用同一份评估集去测「路由之后」而不是只测两个模型各自的水平。`,
              `Blended quality has fallen to ${pct(quality)}. Savings must not be paid for in invisible quality loss — treat post-routing blended quality as a continuously monitored metric, and measure it with the same eval set applied after routing, not just to each model in isolation.`)}
          </div></div>
        )}
        <div className="lm-step"><span className="sn">→</span><div>
          {L(`上线后必须持续看的四个指标:单次成本(会随提示词膨胀而悄悄上涨)、P95 延迟(不是平均值——用户感受的是最慢的那些)、路由后的综合质量、以及输入分布漂移(用户问的东西变了,而你的微调数据没变)。前三个今天就能在这个沙盘里看到,第四个需要你把线上请求采样存下来定期回看。`,
            `Four metrics to watch after launch: cost per call (it creeps up as prompts grow), P95 latency (not the mean — users feel the slow tail), blended post-routing quality, and input distribution drift (what users ask changed, while your fine-tuning data did not). The first three are visible in this sandbox today; the fourth requires sampling live requests and reviewing them periodically.`)}
        </div></div>
      </div>

      <p className="viz-caption">
        {L("到这里,整个课程闭合了:你在模块一学会用 6ND 估算训练成本,在这里用 token × 单价 × 调用量估算服务成本,而中间八个模块都是在这两个数字之间找一个可接受的点。生产环境里最有效的优化顺序通常是:先缓存(免费的钱)、再路由(让微调过的小模型承担大部分流量)、再压缩提示词(每次调用省下的 token 乘以调用量)、最后才是换更大的模型。请注意最后一条的顺序——换大模型是最贵也最容易做的选择,所以它常常被最先做。",
          "The course closes here: in module one you learned to estimate training cost with 6ND; here you estimate service cost with tokens × price × volume, and the eight modules between are about finding an acceptable point between those two numbers. In production the most effective order is usually: cache first (free money), then route (let the fine-tuned small model carry the bulk), then compress the prompt (tokens saved per call times volume), and only then reach for a bigger model. Note that last ordering — upgrading the model is the most expensive and the easiest choice to make, which is why it is so often made first.")}
      </p>
    </div>
  );
};

/* =========================================================
   IN4 · localDeploy — will this machine actually run it
   ---------------------------------------------------------
   Calibrated against a real measurement taken on the machine
   described in content/lm25.*.md: ChatGLM3-6B, bf16, a 15.7GB
   LPDDR5-5200 laptop with 4.85GB available and no CUDA —
   629.3s for 13 tokens = 48.4 s/token. The default state of
   this sandbox reproduces that number.
   ========================================================= */
const LD_MODELS = [
  { v: "1b", l: "1.5B", params: 1.5e9 },
  { v: "6b", l: "ChatGLM3-6B", params: 6.24e9 },
  { v: "7b", l: "7B", params: 7e9 },
  { v: "13b", l: "13B", params: 13e9 },
];
const LD_DEVICES = [
  { v: "lap", l: { zh: "笔记本 CPU · 16GB LPDDR5", en: "Laptop CPU · 16GB LPDDR5" }, mem: 15.7, bw: 83, kind: "cpu" },
  { v: "desk", l: { zh: "台式 CPU · 32GB DDR5", en: "Desktop CPU · 32GB DDR5" }, mem: 32, bw: 90, kind: "cpu" },
  { v: "3060", l: { zh: "RTX 3060 · 12GB", en: "RTX 3060 · 12GB" }, mem: 12, bw: 360, kind: "gpu" },
  { v: "4090", l: { zh: "RTX 4090 · 24GB", en: "RTX 4090 · 24GB" }, mem: 24, bw: 1008, kind: "gpu" },
  { v: "a100", l: { zh: "A100 · 80GB", en: "A100 · 80GB" }, mem: 80, bw: 2039, kind: "gpu" },
];
/* Effective disk throughput under accelerate's per-layer on-demand reads.
   Back-solved from the real 48.4 s/token measurement — far below NVMe
   sequential speed because the pattern is seek + deserialize per layer. */
const LD_DISK_BW = 0.1726; // GiB/s

const LocalDeployViz = () => {
  const L = useL();
  const [mv, setMv] = React.useState("6b");
  const [bits, setBits] = React.useState(16);
  const [dv, setDv] = React.useState("lap");
  const [used, setUsed] = React.useState(10.9);
  const [offload, setOffload] = React.useState(true);

  const m = LD_MODELS.find((x) => x.v === mv);
  const d = LD_DEVICES.find((x) => x.v === dv);
  const isCpu = d.kind === "cpu";
  const devOpts = LD_DEVICES.map((x) => ({ v: x.v, l: L(x.l.zh, x.l.en) }));

  const GiB = 1024 ** 3;
  const wGB = (m.params * (bits / 8)) / GiB;
  const overhead = isCpu ? 1.5 : 1.0;
  const otherUse = isCpu ? Math.min(used, d.mem - 0.5) : 0.6;
  const capacity = Math.max(0, d.mem - otherUse - overhead);
  const fits = wGB <= capacity;

  // Bandwidth actually reachable, then the penalty for bf16 without hardware support.
  const memBw = d.bw * (isCpu ? 0.65 : 0.8);
  const dtypePenalty = isCpu ? (bits >= 16 ? 0.35 : 0.6) : 1;
  const bwCeil = memBw / wGB;             // pure roofline, tok/s
  const residentGB = Math.min(wGB, capacity);
  const offloadGB = Math.max(0, wGB - residentGB);

  const tResident = residentGB / memBw;
  const tOffload = offloadGB / LD_DISK_BW;
  const secPerTok = fits
    ? 1 / (bwCeil * dtypePenalty)
    : (tResident / dtypePenalty) + tOffload;
  const tokS = 1 / secPerTok;
  const runnable = fits || offload;
  const offloadPct = wGB > 0 ? offloadGB / wGB : 0;
  const diskShare = secPerTok > 0 ? (tOffload / secPerTok) * 100 : 0;
  const diskShareTxt = diskShare > 99 ? `${nf(diskShare, 1)}%` : `${Math.round(diskShare)}%`;

  // Is this the exact configuration that was measured?
  const isMeasured = mv === "6b" && bits === 16 && dv === "lap" && offload && Math.abs(used - 10.9) < 0.35;

  const verdict = !runnable
    ? { t: L("起不来", "will not start"), tone: "warn" }
    : offloadGB > 0.05
      ? { t: L("会跑,但慢到不可用", "runs, unusably slowly"), tone: "warn" }
      : tokS < 3
        ? { t: L("跑得动,偏慢", "runs, on the slow side"), tone: "" }
        : { t: L("跑得动", "runs fine"), tone: "ok" };

  return (
    <div>
      <VizHead idx="IN4" title={L("部署沙盘:下载 12GB 之前先把结论算出来", "Deployment sandbox: reach the verdict before downloading 12GB")} />
      <div className="viz-ctrl">
        <Choice label={L("模型", "Model")} value={mv} onChange={setMv} options={LD_MODELS} />
        <Slider label={L("权重精度", "Weight bits")} min={4} max={16} step={4} value={bits} onChange={setBits} unit=" bit" />
        <Choice label={L("设备", "Device")} value={dv} onChange={setDv} options={devOpts} />
        {isCpu && (
          <Slider label={L("其他程序占用", "Used by other programs")} min={0} max={14} step={0.1}
            value={used} onChange={setUsed} unit=" GB" />
        )}
        <label><span>{L("device_map=\"auto\"", "device_map=\"auto\"")}</span>
          <Seg value={offload ? "on" : "off"} onChange={(v) => setOffload(v === "on")}
            options={[{ v: "on", l: L("允许卸载", "allow offload") }, { v: "off", l: L("禁止", "off") }]} /></label>
      </div>

      <div className="lm-bars" style={{ marginTop: 14 }}>
        <Bar label={L("模型权重", "Weights")} value={wGB} max={d.mem}
          tone={fits ? "acc" : "warn"} valText={`${nf(wGB, 1)} GB`} />
        <Bar label={L("其他程序 + 运行时", "Other programs + runtime")} value={otherUse + overhead} max={d.mem}
          valText={`${nf(otherUse + overhead, 1)} GB`} />
        <Bar label={L("权重可用空间", "Space left for weights")} value={capacity} max={d.mem}
          tone={fits ? "ok" : "warn"} valText={`${nf(capacity, 1)} / ${d.mem} GB`} />
        {offloadGB > 0.05 && (
          <Bar label={L("被卸载到磁盘", "Offloaded to disk")} value={offloadGB} max={wGB}
            tone="warn" valText={`${nf(offloadGB, 1)} GB · ${pct(offloadPct)}`} />
        )}
      </div>

      <div className="lm-kpi-grid" style={{ marginTop: 14, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Kpi label={L("判定", "Verdict")} value={verdict.t} tone={verdict.tone} />
        <Kpi label={L("带宽上限", "Bandwidth ceiling")} value={nf(bwCeil, 1)} unit=" tok/s"
          hint={L("权重全驻留时", "if fully resident")} />
        <Kpi label={L("预计速度", "Estimated speed")} value={tokS >= 1 ? nf(tokS, 2) : nf(tokS, 3)} unit=" tok/s"
          tone={tokS < 1 ? "warn" : tokS > 5 ? "ok" : ""} />
        <Kpi label={L("每 token", "Per token")}
          value={secPerTok < 1 ? `${nf(secPerTok * 1000, 0)} ms` : `${nf(secPerTok, 1)} s`}
          tone={secPerTok > 5 ? "warn" : ""} />
      </div>

      <div className="lm-steps" style={{ marginTop: 12 }}>
        {isMeasured && (
          <div className="lm-step now"><span className="sn">★</span><div>
            {L(`这正是本章那台实测机器的配置。真实测量结果:629.3 秒生成 13 个 token,即 48.4 秒/token、0.021 tok/s。沙盘算出 ${nf(secPerTok, 1)} 秒/token——模型的磁盘吞吐常数就是从这次测量反推出来的,所以这里对得上是设计使然,不是独立验证。`,
              `This is the exact configuration of the machine measured for this chapter. The real result: 13 tokens in 629.3 seconds — 48.4 s/token, 0.021 tok/s. The sandbox computes ${nf(secPerTok, 1)} s/token. The disk-throughput constant was back-solved from that measurement, so the agreement here is by construction, not independent validation.`)}
          </div></div>
        )}
        {!runnable && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`权重比可用空间多 ${nf(wGB - capacity, 1)} GB,而卸载被禁止,所以进程会直接 OOM 退出。这其实是好消息——你立刻知道要换方案,而不是等一个小时才发现慢得没法用。`,
              `The weights exceed available space by ${nf(wGB - capacity, 1)} GB and offloading is disabled, so the process will die with an OOM. That is the good outcome — you learn immediately, instead of discovering after an hour that it is unusably slow.`)}
          </div></div>
        )}
        {runnable && offloadGB > 0.05 && (
          <div className="lm-step now"><span className="sn">!</span><div>
            {L(`${pct(offloadPct)} 的权重放不进内存,被卸载到磁盘。每生成一个 token 都要把这 ${nf(offloadGB, 1)} GB 重新读一遍,这 ${nf(secPerTok, 1)} 秒里有 ${diskShareTxt} 花在磁盘上。加载时你会看到 "offloaded to the disk and cpu",而且加载快得不合理——因为它根本没读进内存。`,
              `${pct(offloadPct)} of the weights do not fit and are offloaded to disk. Every token re-reads those ${nf(offloadGB, 1)} GB, and ${diskShareTxt} of those ${nf(secPerTok, 1)}s goes to the disk. At load time you will see "offloaded to the disk and cpu" — and loading will be implausibly fast, because nothing was actually read.`)}
          </div></div>
        )}
        {isCpu && bits >= 16 && fits && (
          <div className="lm-step"><span className="sn">i</span><div>
            {L(`纯 CPU 上 bf16 没有硬件乘法支持(Alder Lake 只有 AVX2/AVX-VNNI,没有 AVX-512 与 AMX),PyTorch 要先转成 fp32 再算。所以你付了 bf16 的带宽,却拿不到对应的计算加速——上限 ${nf(bwCeil, 1)} tok/s 实际只能跑到 ${nf(tokS, 2)}。`,
              `On a pure CPU, bf16 has no hardware multiply behind it (Alder Lake has AVX2/AVX-VNNI but neither AVX-512 nor AMX), so PyTorch converts to fp32 first. You pay bf16's bandwidth without collecting its compute speedup — a ${nf(bwCeil, 1)} tok/s ceiling delivers only ${nf(tokS, 2)}.`)}
          </div></div>
        )}
        {isCpu && bits === 4 && (
          <div className="lm-step"><span className="sn">i</span><div>
            {L("注意:ChatGLM3 自带的 quantization.py 第 126 行断言权重必须在 CUDA 设备上,它的 int4 路径在纯 CPU 上用不了。CPU 上要跑 int4,得换 llama.cpp / Ollama 的 GGUF 格式。",
              "Note: line 126 of ChatGLM3's bundled quantization.py asserts the weights are on a CUDA device — its int4 path does not work on a pure CPU. For int4 on CPU you need GGUF via llama.cpp or Ollama.")}
          </div></div>
        )}
        <div className="lm-step"><span className="sn">✓</span><div>
          {L(`记住这条不等式:权重体积 ≤ 可用内存 − 运行时开销。现在是 ${nf(wGB, 1)} GB ${fits ? "≤" : ">"} ${nf(capacity, 1)} GB。它两分钟就能算完,而下载权重要半小时。`,
            `Remember the inequality: weight size ≤ available memory − runtime overhead. Right now that reads ${nf(wGB, 1)} GB ${fits ? "≤" : ">"} ${nf(capacity, 1)} GB. It takes two minutes to evaluate; downloading the weights takes thirty.`)}
        </div></div>
      </div>

      <p className="viz-caption">
        {L("把「其他程序占用」从 2GB 拖到 10GB,看那条判定在什么位置翻转——它翻转得比直觉早得多,因为约束从来不是总内存,而是可用内存再减去运行时开销。这也是「我有 16GB,模型要 12GB,应该能跑」这个推理错在哪里:16 和 12 之间那 4GB 的余量,在真实桌面系统上根本不存在。",
          "Sweep 'used by other programs' from 2GB to 10GB and watch where the verdict flips — considerably earlier than intuition suggests, because the constraint was never total memory but available memory minus runtime overhead. That is precisely where 'I have 16GB and the model needs 12GB, so it should run' goes wrong: the 4GB of headroom between those numbers does not exist on a real desktop.")}
      </p>
    </div>
  );
};

/* =========================================================
   Registry — data.jsx `viz:` names map here
   ========================================================= */
const VIZ = {
  /* L1 模型基础 */ attentionLab: () => <AttentionLabViz />,
  tokenizerLab: () => <TokenizerLabViz />,
  scalingLaw: () => <ScalingLawViz />,
  /* L2 预训练 */ dataPipeline: () => <DataPipelineViz />,
  computeBudget: () => <ComputeBudgetViz />,
  lossCurve: () => <LossCurveViz />,
  /* L3 推理 */ decodingLab: () => <DecodingLabViz />,
  kvCache: () => <KvCacheViz />,
  quantLab: () => <QuantLabViz />,
  localDeploy: () => <LocalDeployViz />,
  /* L4 提示与上下文 */ promptLab: () => <PromptLabViz />,
  toolCall: () => <ToolCallViz />,
  ragVsFt: () => <RagVsFtViz />,
  /* L5 微调基础 */ ftDecision: () => <FtDecisionViz />,
  sftData: () => <SftDataViz />,
  hyperLab: () => <HyperLabViz />,
  /* L6 参数高效微调 */ loraRank: () => <LoraRankViz />,
  vramLedger: () => <VramLedgerViz />,
  peftCompare: () => <PeftCompareViz />,
  /* L7 对齐 */ rlhfPipeline: () => <RlhfPipelineViz />,
  dpoLab: () => <DpoLabViz />,
  rewardHack: () => <RewardHackViz />,
  /* L8 评估与上线 */ evalHarness: () => <EvalHarnessViz />,
  redTeam: () => <RedTeamViz />,
  prodCost: () => <ProdCostViz />,
};

function Viz({ name }) {
  const names = (Array.isArray(name) ? name : [name]).filter((n) => VIZ[n]);
  if (!names.length) return null;
  return (
    <>
      {names.map((n) => <div className="viz" key={n}>{VIZ[n]()}</div>)}
    </>
  );
}

window.Viz = Viz;
