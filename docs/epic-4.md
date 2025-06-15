# Epic 4: 洞察结果导出 (Insight Export)

## Epic Overview

为用户提供将 AI 生成的洞察报告以标准、通用的格式导出的能力。这增强了 LexiTrend 的实用性，使其不仅仅是一个查看工具，更是一个能融入用户现有工作流的数据源。

## Epic Goal

作为开发团队，我们需要实现灵活的数据导出功能，允许用户以 Markdown 和 CSV 格式保存他们的分析结果，以便于记笔记、撰写报告或进行进一步的数据分析。

## Epic Duration
Sprint 3

## Prerequisites
- [x] Epic 3: 端到端的关键词洞察生成已完成
- [x] 侧边栏 `InsightCard` 组件已能成功展示洞察数据

## Stories in this Epic

| Story ID | 用户故事 (User Story) | 状态 | 负责人 |
| :--- | :--- | :--- | :--- |
| **4.1** | [将洞察报告一键复制为 Markdown 格式](./stories/4.1.story.md) | To Do | Ellyn |
| **4.2** | [将洞察报告下载为 CSV 文件](./stories/4.2.story.md) | To Do | Ellyn |

## Epic Acceptance Criteria

1.  在展示洞察结果的 `InsightCard` 组件中，包含清晰的"导出"或"分享"功能入口。
2.  用户可以成功地将包含关键词、定义和文化背景的完整报告复制到剪贴板，格式为标准的 Markdown。
3.  用户可以成功地将报告下载为一个名为 `lexitrend-export.csv` 的文件。
4.  导出的 CSV 文件包含明确的列头（如 `keyword`, `definition`, `cultural_context`）和对应的数据。
5.  导出功能在各种主流浏览器上表现一致。

## Risks & Mitigation

- **风险**: 浏览器对 `navigator.clipboard` API 的权限限制或实现差异。
  **缓解**: 在实现时进行充分的跨浏览器测试。对于不支持的旧版浏览器，可以考虑优雅降级，例如将内容显示在一个文本区中，让用户手动复制。

- **风险**: CSV 文件在某些电子表格软件（如老版 Excel）中出现乱码。
  **缓解**: 在生成 CSV 文件时，明确指定 UTF-8 编码，并添加 BOM (Byte Order Mark) 头。 