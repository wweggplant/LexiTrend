### **LexiTrend - 项目文档中心**

欢迎来到 LexiTrend 项目文档中心。这里的文档旨在为所有团队成员——无论是开发者、产品经理还是项目管理者——提供一个清晰、统一的信息来源。

#### **文档结构**

我们采用"中心化辐射型"（Hub and Spoke）的文档组织模式。每个核心领域都有一个"中心"（Hub）文档，作为该领域的入口和索引，并链接到更具体的"辐射"（Spoke）文档。

#### **核心文档入口**

1.  **[产品需求文档 (PRD)](./prd.md)**
    *   **负责人**: PO
    *   **内容**: 项目的"为什么"和"是什么"。包含产品愿景、核心功能、用户故事地图，并链接到所有详细的 Epic 文档。

2.  **[技术架构文档 (Architecture)](./arch.md)**
    *   **负责人**: Tech Lead
    *   **内容**: 项目的"如何实现"。包含高阶架构图 (C4)、核心组件拆解、技术选型，并链接到所有架构决策记录 (ADR)。

3.  **[开发指南 (Development Guide)](./dev-guide.md)**
    *   **负责人**: SM / Dev Team
    *   **内容**: 开发者上手指南，包括环境搭建、代码规范、构建和部署流程。

4.  **[项目规划与追踪 (Project Management)](./sprint-backlog.md)**
    *   **负责人**: PM
    *   **内容**: 冲刺规划、任务分解和进度追踪。

---

*   **原始 Epic 文档**: 
    *   [Epic 1: 核心洞察功能](./epic-1.md)
    *   [Epic 2: Vercel AI SDK 集成](./epic-2.md)
    *   [Epic 3: 缓存机制](./epic-3.md)
    *   [Epic 4: Onboarding 流程](./epic-4.md)
    *   [Epic 5: UI/UX 优化](./epic-5.md)
*   **架构决策记录 (ADR)**:
    *   [ADR-001: Tavily API 集成](./architecture/ADR-001-tavily-api-integration.md)

## 项目概述文档

- **[产品需求文档 (PRD)](prd.md)** - 产品功能定义和业务需求
- **[技术架构文档](arch.md)** - 系统架构和技术选型  
- **[产品负责人审查](po.md)** - PO的Go/No-Go决策和审查结果
- **[任务拆分文档](task-breakdown.md)** - 详细的开发阶段和任务规划
- **[技术实现规范](tech-spec.md)** - 技术组件和实现标准
- **[开发指南](dev-guide.md)** - 具体实现步骤和最佳实践

## Epic 规划

### Epic 1: 项目基础设施 
**文件**: [epic-1.md](epic-1.md)  
**状态**: Draft  
**Sprint**: 1 (2-3 weeks)  
**目标**: 建立开发环境和核心架构

**Stories**:
- [Story 1.1: 项目初始化和开发环境配置](stories/1.1.story.md) - **Status: Draft**
- Story 1.2: 核心服务层开发 - *待创建*
- Story 1.3: Chrome扩展核心架构 - *待创建*

### Epic 2: 用户引导系统 (计划中)
**Sprint**: 2 (2 weeks)  
**目标**: 实现用户首次使用体验

### Epic 3: 核心功能实现 (计划中)  
**Sprint**: 3-4 (4-5 weeks)  
**目标**: Google Trends集成和AI洞察

### Epic 4: 用户体验优化 (计划中)
**Sprint**: 5 (2-3 weeks)  
**目标**: 性能优化和交互体验

### Epic 5: 集成测试与发布 (计划中)
**Sprint**: 6 (2-3 weeks)  
**目标**: 质量保证和生产发布

## 当前开发状态

### 活跃 Stories
- **[Story 1.1](stories/1.1.story.md)**: 项目初始化和开发环境配置
  - 状态: Draft  
  - 优先级: Must Have
  - 预估: 3 Story Points
  - 下一步: 需要开发工程师开始实施

### 下一个 Stories (优先级排序)
1. Story 1.2: 核心服务层开发
2. Story 1.3: Chrome扩展核心架构  
3. Story 2.1: Onboarding UI组件 (待Epic 2创建)

## 技术文档参考

### 架构设计
- **数据流**: 详见 [arch.md#高阶架构图](arch.md)
- **组件设计**: 详见 [tech-spec.md#React组件规范](tech-spec.md)
- **服务层**: 详见 [tech-spec.md#核心服务层规范](tech-spec.md)

### 开发实践
- **代码规范**: 详见 [dev-guide.md#开发工具配置](dev-guide.md)
- **测试策略**: 详见 [dev-guide.md#测试指南](dev-guide.md)  
- **部署流程**: 详见 [dev-guide.md#部署和发布流程](dev-guide.md)

## 开发团队指南

### 开始开发
1. 查看当前活跃的Story: [Story 1.1](stories/1.1.story.md)
2. 按照Story中的Tasks/Subtasks逐步实施
3. 参考Dev Technical Guidance部分的技术指导
4. 完成后更新Story状态为"Done"

### Story 完成标准
- 所有Acceptance Criteria已满足 ✅
- 所有Tasks/Subtasks已完成 ✅  
- 代码已通过测试和代码审查 ✅
- 技术文档已更新 ✅

### 获取下一个Story
当前Story完成后，联系Scrum Master Bob生成下一个Story。

## 联系信息

- **Scrum Master**: Bob (Story生成和流程指导)
- **Architect**: Fred (技术架构和设计决策)
- **Product Owner**: Sarah (需求验证和优先级决策) 