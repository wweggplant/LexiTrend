# Epic 3: 端到端的关键词洞察生成 (End-to-End Keyword Insight Generation)

## Epic Overview

实现应用的核心价值闭环：从在 Google Trends 页面上捕捉用户选择的关键词，到通过 AI 分析并最终在侧边栏展示出富有洞察力的结果。此 Epic 的完成将意味着产品核心功能正式上线，并替换掉所有占位符和假数据。

## Epic Goal

作为开发团队，我们需要构建一个稳定、高效的数据处理管道，实现从关键词捕捉、API 调用、缓存处理到最终 UI 展示的完整流程，为用户提供即时、准确、有价值的语义洞察。

## Epic Duration
Sprint 2-3

## Prerequisites
- [x] Epic 2: 核心用户引导与设置已完成
- [x] `ApiService`, `CacheService` 基础框架已就位

## Stories in this Epic

| Story ID | 用户故事 (User Story) | 状态 | 负责人 |
| :--- | :--- | :--- | :--- |
| **3.1** | [在 Google Trends 页面自动识别并允许选择关键词](./stories/3.1.story.md) | To Do | Ellyn |
| **3.2** | [调用真实 Gemini API 获取关键词洞察以替代假数据](./stories/3.2.story.md) | To Do | Ellyn |
| **3.3** | [将成功的 API 结果缓存在本地 IndexedDB](./stories/3.3.story.md) | To Do | Ellyn |
| **3.4** | [在 AI 分析期间显示加载动画 (Loading Skeleton)](./stories/3.4.story.md) | To Do | Ellyn |
| **3.5** | [在 API 调用失败时显示明确的错误提示和重试选项](./stories/3.5.story.md) | To Do | Ellyn |

## Epic Acceptance Criteria

1.  插件能够可靠地在 Google Trends 页面上检测可分析的关键词。
2.  用户选择关键词后，能成功触发真实的 Gemini API 调用。
3.  API 返回的"定义"和"文化背景"数据能被正确解析并展示在侧边栏 UI 中。
4.  所有静态的占位符数据（如"人工智能"、"元宇宙"）被完全移除。
5.  缓存机制有效工作：重复查询相同关键词时，应从本地 IndexedDB 加载数据，速度明显加快。
6.  整个流程中的加载状态和错误状态都有清晰的 UI 反馈。

## Risks & Mitigation

- **风险**: Google Trends 页面前端结构变更，导致关键词抓取脚本失效。
  **缓解**: 使用更具韧性的 DOM 选择器，并建立一个简单的监控机制。在脚本中添加详细的错误处理和日志，以便快速定位问题。

- **风险**: Gemini API 响应时间过长，超出用户等待耐心。
  **缓解**: 严格执行 p95 ≤ 400ms 的性能指标（对于缓存命中），对于首次查询，通过清晰的 Loading 状态管理用户预期。在 `ApiService` 中实现合理的超时机制。 