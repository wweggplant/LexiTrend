### **TrendLens Dev – 分阶段 PRD（v0.5 / 2025-01-15）**

*基于 v0.4 版本更新：新增 Tavily Search 实时信息增强功能，提升AI分析准确性。*

#### **1 · 项目概述**

* **定位**：为独立开发者设计的 Chrome 扩展，用于快速捕捉并解析 Google Trends 上的热词。
* **一句话价值主张**："选中 Trends 热词 → 10 秒看懂其含义与文化语境，判断你的 idea 是否值得投入时间。"

#### **2 · 痛点回顾（简）**

* **场景痛点**: 独立开发者在 Google Trends / Product Hunt 等平台寻找灵感时，常因不熟悉俚语或文化背景词，导致产品命名不当（踩坑）或早期调研耗时过长。
* **新增痛点**: AI对新兴词汇、公司名称存在幻觉问题，可能提供过时或错误信息。
* **市场空白**: 现有插件分为两派："数据派"（提供搜索量等）与"释义派"（提供定义），缺少一个将"趋势发现"与"语义理解"无缝整合的工具。

#### **3 · 阶段划分 & 功能矩阵**

| 功能模块 | Phase I (前端 + 用户自填 API Key) | Phase II (引入后端) |
| :--- | :--- | :--- |
| **Trends 关键词抓取** | ✅ content-script 自动侦测 | ✅ |
| **首屏 Onboarding** | ✅ 引导填 Key & **手动选语言** & GIF 教程 | — |
| **AI 语义洞察**（Gemini Flash） | ✅ 直连（用户 Key） | ✅ 后端代理 + 统一计费 |
| **🆕 实时信息增强**（Tavily Search） | ✅ **可选配置Tavily Key** + Function Calling集成 | ✅ 后端代理 + 缓存优化 |
| **SERP & 竞争度 / CPC** | ⏸ 延后至Phase II | ✅ Tavily + 缓存；输出竞争指数+CPC |
| **本地缓存**（IndexedDB） | ✅ | ✅ + KV 共享 |
| **侧边栏 UI / Hover 卡片** | ✅ 360px 固定宽，Tab View + 数据来源显示 | ✅ |
| **数据导出** | ✅ Copy Markdown + CSV | ✅ + Notion/API |
| **错误反馈** | ✅ Toast + Retry | ✅ 结合 Sentry |
| **Loading Skeleton** | ✅ >400 ms 显示 | ✅ |
| **用户管理 & 订阅** | — | ✅ Stripe |
| **团队看板 / CLI** | — | ✅ |

#### **3a. 核心史诗 (Core Epics)**

为了更好地组织和追踪大型功能模块的开发，我们将项目分解为以下几个核心史诗 (Epics)。每个史诗都代表一个重要的用户价值流。

*   **[Epic 1: 核心洞察功能](./epic-1.md)** - 构建 TrendLens 的基础，实现从关键词选择到 AI 分析并展示结果的核心流程。
*   **[Epic 2: Vercel AI SDK 集成](./epic-2.md)** - 将 AI 调用逻辑封装到 Vercel AI SDK 之后，以简化 API 管理并为未来的模型切换做准备。
*   **[Epic 3: 高性能缓存机制](./epic-3.md)** - 设计并实现客户端缓存，以提升重复查询的响应速度和用户体验。
*   **[Epic 4: 流畅的 Onboarding 流程](./epic-4.md)** - 为新用户提供无缝的首次使用体验，包括 API Key 配置和功能引导。
*   **[Epic 5: 实时信息增强](./epic-5.md)** - 专注于通过集成外部搜索API提升AI分析的准确性和时效性。

#### **4 · Phase I MVP 用户流程**

1.  **Onboarding**: 首次安装后，自动弹出 Popup 页面 → 引导用户填入自己的 Gemini API Key (**当场验证有效性**) → **用户可选择性填入 Tavily API Key 以启用实时搜索功能** → 用户**手动选择**默认的结果语言 → 播放 GIF 动画演示核心用法 → 完成设置。
2.  **收集关键词**: 用户在 Google Trends 页面上，通过勾选框选择一个或多个感兴趣的关键词 → 侧边栏自动滑出 (固定宽度 360px)。
3.  **🆕 智能分析**: 如果用户配置了 Tavily Key，AI 会自动判断是否需要搜索实时信息。对于新兴词汇或公司名称，会先通过 Tavily Search 获取最新信息，再进行分析。否则，将只使用 Gemini 进行基础分析。
4.  **查看洞察**: 在侧边栏的 Tab 视图中，用户可以切换查看该词的"**定义 (Definition)**"和"**文化背景 (Culture Context)**"，底部显示信息来源（如果进行了搜索）。
5.  **导出**: 用户可以通过点击按钮，一键"📋 **复制为 Markdown**"格式的洞察报告，或下载为 **CSV** 文件。
6.  **性能**: 从选中关键词到显示洞察，p95 加载时间应不多于 800 毫秒（含搜索时间）。若超过 400 毫秒，则显示 Loading Skeleton 动画。

#### **5 · 非功能需求**

| 类别 | 指标 | 设计措施 |
| :--- | :--- | :--- |
| **性能** | 首词解析 p95 ≤ 400 ms | Gemini+Tavily 并行（未来）；缓存命中 <1 ms |
| **错误反馈** | 100 % API 异常可见 | Toast + Retry 机制；（Phase II: Sentry Tracing） |
| **a11y** | 高对比度/键盘导航 | Tailwind `contrast-more:`；保障 TabIndex 顺序 |

#### **6 · KPI**

| 阶段 | 指标 | 目标 |
| :--- | :--- | :--- |
| **Phase I** | 洞察完成率 (Insight Completion Rate) | ≥ 90 % |
| | D7 留存率 (Day-7 Retention) | ≥ 25 % |
| **Phase II**| 付费转化率 (Conversion to Paid) | ≥ 5 % |
| | 每付费用户平均收入 (ARPPU) | ≥ 5 USD/月 |
