# TrendLens Dev - 项目重构计划

## 当前状况
- ❌ NextJS项目结构 (不适用于Chrome扩展)
- ✅ 有用的依赖: React, TypeScript, TailwindCSS, Radix UI组件
- ✅ 完整的PRD和架构文档

## 目标结构 (Chrome Extension Manifest V3)

```
TrendLens/
├── manifest.json                 # 扩展配置文件
├── package.json                 # 新的依赖配置
├── vite.config.ts              # Vite构建配置
├── tsconfig.json               # TypeScript配置
├── tailwind.config.ts          # 保留现有配置
├── src/
│   ├── content-scripts/
│   │   ├── google-trends.ts    # 注入到Google Trends页面
│   │   └── dom-utils.ts        # DOM操作工具
│   ├── background/
│   │   ├── service-worker.ts   # 后台脚本
│   │   ├── api-client.ts       # Gemini API客户端
│   │   └── cache-manager.ts    # 缓存管理
│   ├── popup/
│   │   ├── index.html          # Onboarding弹窗
│   │   ├── Popup.tsx           # React组件
│   │   └── popup.ts            # 入口文件
│   ├── side-panel/
│   │   ├── index.html          # 侧边栏页面
│   │   ├── SidePanelApp.tsx    # 主React应用
│   │   ├── side-panel.ts       # 入口文件
│   │   └── components/         # 侧边栏组件
│   │       ├── InsightCard.tsx
│   │       ├── LoadingSkeleton.tsx
│   │       └── TabView.tsx
│   ├── components/             # 共享组件 (保留现有Radix UI)
│   │   ├── ui/                 # 现有的shadcn组件
│   │   ├── ApiKeyForm.tsx      # API Key配置
│   │   ├── LanguageSelector.tsx
│   │   └── ToastNotification.tsx
│   ├── utils/
│   │   ├── storage.ts          # Chrome storage封装
│   │   ├── cache.ts            # IndexedDB缓存
│   │   ├── constants.ts        # 常量定义
│   │   └── types.ts            # TypeScript类型
│   └── styles/
│       └── globals.css         # 保留TailwindCSS配置
├── public/
│   ├── icons/                  # 扩展图标
│   │   ├── icon-16.png
│   │   ├── icon-48.png
│   │   └── web-app-manifest-192x192.png
│   └── tutorial.gif           # Onboarding教程
└── dist/                      # 构建输出 (Vite生成)
```

## 重构步骤

### 第一步: 清理NextJS文件
1. 删除 `app/`, `pages/` 目录
2. 删除 `next.config.mjs`
3. 更新 `package.json` - 移除NextJS依赖

### 第二步: 创建Chrome扩展配置
1. 创建 `manifest.json` (Manifest V3)
2. 配置 `vite.config.ts` for Chrome扩展构建
3. 更新构建脚本

### 第三步: 迁移现有组件
1. 保留 `components/ui/` 中的shadcn组件
2. 重构为Chrome扩展专用组件
3. 实现扩展特定的通信逻辑

### 第四步: 实现核心功能
1. Content Script - Google Trends集成
2. Background Service Worker - API管理
3. Side Panel - 主UI
4. Popup - Onboarding

## 可保留的依赖
- ✅ React, TypeScript, TailwindCSS
- ✅ Radix UI组件库
- ✅ Lucide图标
- ✅ 表单处理 (react-hook-form, zod)
- ✅ 工具库 (clsx, class-variance-authority)

## 需要替换的依赖
- ❌ NextJS → Vite
- ❌ Next主题 → 自定义主题管理
- ❌ Next特定组件 → Chrome扩展API

## 新增依赖
- ➕ @crxjs/vite-plugin (Vite Chrome扩展插件)
- ➕ @types/chrome (Chrome API类型定义) 