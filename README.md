# LLM_BOOK · 大模型与微调自学站 / Bilingual LLM & Fine-tuning Course

中英双语的大语言模型自学站,**重点讲透微调**。每章先动手做一个可交互的「训练场实验」,再读「解释」。
A bilingual (Chinese/English) self-study course on large language models with a deep focus on fine-tuning. Every chapter opens with an interactive experiment, then explains the mechanics behind it.

- **8 模块 / 25 章 / 25 个可交互实验**,约 120 小时
- 无构建步骤:React 18 UMD + Babel standalone + marked,直接用静态服务器打开
- 浅色/深色主题、中英切换、进度保存在 localStorage(`llm_book_*`),无需登录
- 不绑定任何框架或厂商;所有公式都给可手算的量级估计

## 运行 / Run

```bash
python -m http.server 5700 --directory D:/webcode/LLM_BOOK
```

然后打开 http://localhost:5700 。必须通过 http 访问(讲义是 `fetch` 加载的 markdown,`file://` 下会被 CORS 拦住)。
项目也在 `D:/other/.claude/launch.json` 里注册为 `llm-book`(端口 5700)。

## 课程结构 / Curriculum

| 模块 | 代码 | 主题 | 章节 |
|---|---|---|---|
| I | FM | 模型基础 — 注意力、分词、缩放定律 | lm1–lm3 |
| II | PT | 预训练与算力 — 数据流水线、6ND 预算、训练稳定性 | lm4–lm6 |
| III | IN | 推理基础 — 解码策略、KV 缓存、量化、本地部署可行性 | lm7–lm9, lm25 |
| IV | PR | 提示与上下文 — 提示工程、工具调用、RAG vs 微调 | lm10–lm12 |
| V | FT | **微调基础** — 何时该微调、SFT 数据集、超参与训练动态 | lm13–lm15 |
| VI | PE | **参数高效微调** — LoRA、QLoRA 与显存账本、方法对比 | lm16–lm18 |
| VII | AL | **对齐与偏好优化** — RLHF、DPO、可验证奖励与奖励黑客 | lm19–lm21 |
| VIII | EV | 评估与上线 — 评估体系、安全红队、成本与路由 | lm22–lm24 |

模块 V–VII 共 9 章是本站的核心,模块 IV 的「RAG 还是微调」是进入它们之前的必读判据。

## 文件结构 / Layout

```
index.html      入口,按顺序加载下面的 jsx(顺序不能改)
i18n.jsx        UI 文案字典 + 语言状态(localStorage: llm_book_lang)
data.jsx        课程元数据:8 个 MODULES + 25 个 CHAPTERS
viz.jsx         共享组件(Slider/Kpi/Bar/LinePlot…) + L1–L3 的 9 个实验
viz2.jsx        L4–L6 的 9 个实验(依赖 viz.jsx 的辅助函数)
viz3.jsx        L7–L8 的 6 个实验 + IN4 部署沙盘 + VIZ 注册表 + <Viz>
pages.jsx       首页 / 模块页 / 章节页 / 关于页
app.jsx         路由、主题、进度、导航
styles.css      设计系统(与 MATH_BOOK 系列同源)
llm.css         实验组件样式(lm-* 前缀)
content/        48 个讲义文件 lm<N>.<zh|en>.md
```

**加载顺序很重要**:`viz.jsx` 定义共享辅助函数,`viz2.jsx` 使用它们,`viz3.jsx` 定义 `VIZ` 注册表和 `<Viz>`(`pages.jsx` 渲染它)。改 `index.html` 时不要打乱这个顺序。

## 加一章 / Adding a chapter

1. 在 `data.jsx` 的 `CHAPTERS` 里加一项(`id`、`code`、`moduleId`、`viz` 名、双语 `title`/`summary`/`objectives`/`outline`)。
2. 在 `viz2.jsx` 或 `viz3.jsx` 里写实验组件,并在 `viz3.jsx` 的 `VIZ` 注册表里登记同名 key。
3. 在 `content/` 下加 `<id>.zh.md` 和 `<id>.en.md`(结构:若干 `##` 小节 + `---` + `## 练习` / `## Exercises`)。
4. 把 `index.html` 里的 `?v=` 版本号加一,以便刷掉浏览器缓存。

## 实验清单 / The 24 experiments

注意力热力图 · 分词实验台 · 缩放沙盘 · 数据流水线 · 算力预算 · 训练曲线 · 采样实验台 · KV 缓存账本 · 量化实验台 · 提示打分台 · 工具调用循环 · RAG/微调决策矩阵 · 微调决策推演 · SFT 数据集构建台 · 超参实验台 · LoRA 实验台 · 显存账本 · PEFT 方法对比与多适配器服务 · RLHF 流水线 · DPO 实验台 · 奖励黑客实验室 · 评估台 · 红队推演 · 生产成本沙盘

每个实验都从控件实时算出它的数字(没有硬编码的结果),所以拖动任何滑块都会看到真实的联动。

## License

MIT
