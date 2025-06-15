# Epic 2: 核心用户引导与设置 (Core User Onboarding & Setup)

## Epic Overview

为新用户提供一个无缝、直观的首次使用体验，引导他们完成必要的 API Key 配置和个性化设置，为后续成功使用插件的核心功能奠定基础。

## Epic Goal

作为开发团队，我们需要构建一个健壮且用户友好的引导流程，确保用户能够轻松地激活插件，从而提高新用户留存率和产品价值的传递效率。

## Epic Duration
Sprint 2

## Prerequisites
- [x] Epic 1: 项目基础设施已完成
- [x] UI/UX 设计稿已确认

## Stories in this Epic

| Story ID | 用户故事 (User Story) | 状态 | 负责人 |
| :--- | :--- | :--- | :--- |
| **2.1** | [引导用户设置并验证 Gemini API Key](./stories/2.1.story.md) | Done | Ellyn |
| **2.2** | [引导用户选择默认结果语言](./stories/2.2.story.md) | Done | Ellyn |
| **2.3** | [在引导流程中展示 GIF 动画教程](./stories/2.3.story.md) | Done | Ellyn |

## Epic Acceptance Criteria

1.  [x] 新用户在首次启动插件时，能看到清晰的引导界面。
2.  [x] 用户可以成功输入并验证他们的 Gemini API Key，验证结果（成功/失败）会明确展示给用户。
3.  [x] 用户可以选择并成功保存一个默认的结果语言。
4.  [x] 所有引导步骤完成后，用户的设置（API Key、语言）被正确持久化存储。
5.  [x] 完成引导流程后，用户将被导向插件的主界面。

## Risks & Mitigation

- **风险**: 用户提供的 API Key 无效或权限不足。
  **缓解**: 在前端进行实时、明确的有效性验证，并提供清晰的错误提示和帮助链接。

- **风险**: 用户在引导流程中途退出。
  **缓解**: 引导流程应尽可能简洁，并保存用户的部分进度。下次进入时，能从上次中断的地方继续。 