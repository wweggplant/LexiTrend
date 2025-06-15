# LexiTrend 技术实现规范

**文档版本**: v1.0  
**创建日期**: 2025年1月  
**架构师**: Fred  

## 项目结构

```
src/
├── components/          # React 组件
│   ├── ui/             # 基础 UI 组件
│   ├── onboarding/     # 引导流程组件
│   └── sidepanel/      # 侧边栏组件
├── services/           # 核心服务层
├── utils/              # 工具函数
├── types/              # TypeScript 类型定义
├── hooks/              # 自定义 React Hooks
└── constants/          # 常量定义
```

## 核心服务层规范

### 1. 存储服务 (`services/storage.ts`)

```typescript
interface StorageService {
  // API 密钥管理
  setApiKey(key: string): Promise<void>;
  getApiKey(): Promise<string | null>;
  validateApiKey(key: string): Promise<boolean>;
  
  // 用户配置
  setLanguage(lang: string): Promise<void>;
  getLanguage(): Promise<string>;
  
  // 应用状态
  setOnboardingComplete(complete: boolean): Promise<void>;
  isOnboardingComplete(): Promise<boolean>;
}
```

**实现要求**:
- 使用 `chrome.storage.local` API
- 所有操作必须异步
- API密钥需要加密存储
- 包含错误处理和重试机制

### 2. 缓存服务 (`services/cache.ts`)

```typescript
interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  size(): Promise<number>;
}
```

**实现要求**:
- 基于 IndexedDB 实现
- 不再实现 TTL 或 LRU 策略。缓存将持续增长，直到用户手动清除或达到浏览器存储上限。

### 3. API 服务 (`services/api.ts`)

```typescript
interface InsightResponse {
  definition: string;
  culturalContext: string;
  confidence: number;
  language: string;
  raw_response?: any; // 可选，用于存储原始API响应
}

interface ApiService {
  analyzeKeyword(keyword: string, language: string): Promise<InsightResponse>; // language: AI回复使用的语言
  validateApiKey(key: string): Promise<boolean>;
  getSupportedModels(): string[];
  estimateTokens(text: string): number;
}
```

**语言处理架构**:
- 语言配置统一管理在 `src/constants/languages.ts`
- 核心语言 (`CORE_LANGUAGES`) 支持完整的prompt模板
- 扩展语言 (`EXTENDED_LANGUAGES`) 在UI中显示，但使用英文prompt
- `analyzeKeyword` 方法通过 `getLanguageNativeName()` 获取语言原生名称，明确指示AI使用指定语言回复

**实现要求**:
- 使用 **Vercel AI SDK (`ai` and `@ai-sdk/google-vertex-ai`)** 作为与大模型交互的核心库。
- `analyzeKeyword` 方法应利用 `generateObject` 函数，直接将API响应解析为结构化的 `InsightResponse` 对象。
- 支持的 Gemini 模型将通过 Vercel AI SDK 提供的 `createGoogleVertexAI` 客户端进行配置。
- 无需手动实现重试和超时，利用 AI SDK 内置的健壮性机制。
- 错误处理应重点捕获和转换 AI SDK 抛出的特定错误。
- 无需手动实现请求去重和上下文缓存，这些由上层 React Hooks (如 `useSWR`) 结合 AI SDK 进行管理。

## React 组件规范

### 1. 入口组件 (`components/onboarding/ApiKeyForm.tsx`)

**功能需求**:
- 实时验证 API 密钥有效性
- 显示验证状态 (loading/success/error)
- 支持键盘导航
- 错误信息本地化

**状态管理**:
```typescript
interface ApiKeyFormState {
  apiKey: string;
  isValidating: boolean;
  validationStatus: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
}
```

### 2. 侧边栏主容器 (`components/sidepanel/SidePanelApp.tsx`)

**功能需求**:
- 监听来自 content script 的消息
- 管理全局应用状态
- 处理多关键词并发分析
- 实现 360px 固定宽度布局

**消息处理**:
```typescript
interface MessageHandler {
  onKeywordSelected(keywords: string[]): void;
  onInsightReceived(keyword: string, insight: InsightResponse): void;
  onError(error: ApiError): void;
}
```

### 3. 洞察卡片 (`components/sidepanel/InsightCard.tsx`)

**功能需求**:
- 双Tab切换 (定义/文化背景)
- Markdown 渲染支持
- 复制和导出功能
- 骨架屏加载状态

**性能要求**:
- 组件懒加载
- 虚拟滚动 (如果内容过长)
- 图片懒加载

## Chrome Extension 架构

### 1. Background Service Worker (`public/background.js`)

**核心职责**:
- 消息路由中心
- API 调用管理
- 缓存策略执行
- 错误监控和上报

**消息类型定义**:
```typescript
interface Messages {
  KEYWORD_SELECTED: { keywords: string[] };
  REQUEST_INSIGHT: { keyword: string; language: string };
  INSIGHT_RESPONSE: { keyword: string; data: InsightResponse };
  API_ERROR: { error: ApiError };
}
```

### 2. Content Script (`public/content-script.js`)

**核心职责**:
- DOM 监听和注入
- 用户交互捕获
- 数据提取和清理

**注入策略**:
- 使用 MutationObserver 监听 DOM 变化
- 防抖处理用户选择事件
- 提取关键词时去除HTML标签

## 性能优化规范

### 1. 加载性能
- **代码分割**: 按路由和功能模块分割
- **Tree Shaking**: 移除未使用的代码
- **Bundle 大小**: 主包 < 500KB，总包 < 2MB

### 2. 运行时性能
- **400ms 规则**: 超过400ms显示骨架屏
- **内存使用**: < 50MB 常驻内存
- **缓存命中率**: > 90%

### 3. 监控指标
```typescript
interface PerformanceMetrics {
  insightLoadTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  apiErrorRate: number;
}
```

## 错误处理规范

### 1. 错误分类
```typescript
enum ErrorType {
  NETWORK_ERROR = 'network',
  API_ERROR = 'api',
  VALIDATION_ERROR = 'validation',
  STORAGE_ERROR = 'storage',
  UNKNOWN_ERROR = 'unknown'
}
```

### 2. 错误处理策略
- **网络错误**: 3次指数退避重试
- **API错误**: 显示用户友好的错误信息
- **验证错误**: 实时反馈和修正建议
- **存储错误**: 降级到内存存储

### 3. 用户反馈
- Toast 通知 (3秒自动消失)
- 错误页面 (严重错误)
- 重试按钮 (可恢复错误)

## 无障碍性规范

### 1. 键盘导航
- 所有交互元素支持 Tab 键导航
- 明确的焦点指示器
- 合理的 tabIndex 顺序

### 2. 屏幕阅读器支持
- 语义化 HTML 标签
- 适当的 ARIA 标签
- 图片和图标的 alt 文本

### 3. 视觉辅助
- 高对比度模式支持
- 字体大小可调节
- 色彩不是唯一的信息传达方式

## 测试规范

### 1. 单元测试
- 覆盖率要求: > 80%
- 核心服务层: > 90%
- 关键路径: 100%

### 2. 集成测试
- Chrome Extension API 模拟
- 端到端用户流程
- 多浏览器兼容性

### 3. 性能测试
- 加载时间基准测试
- 内存泄漏检测
- 并发用户模拟

## 部署和发布

### 1. 构建流程
```bash
# 开发环境
npm run dev

# 生产构建
npm run build:prod

# Extension 打包
npm run package
```

### 2. 版本管理
- 语义化版本控制
- 自动化版本号更新
- Changelog 生成

### 3. 质量门禁
- 代码审查通过
- 所有测试通过
- 性能基准达标
- 安全扫描通过

## 开发工具配置

### 1. TypeScript 配置
```json
{
  "strict": true,
  "noImplicitReturns": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true
}
```

### 2. ESLint 规则
- React Hooks 规则强制执行
- 禁用 console.log (生产环境)
- 强制使用 TypeScript 类型

### 3. Prettier 配置
- 2空格缩进
- 单引号
- 尾逗号 (es5)
- 行宽 80 字符 