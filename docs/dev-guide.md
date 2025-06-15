# LexiTrend 开发指南

**文档版本**: v1.0  
**创建日期**: 2025年1月  
**架构师**: Fred  

## 快速开始

### 环境准备

```bash
# 1. 克隆项目
git clone <repository-url>
cd LexiTrend

# 2. 安装依赖
pnpm install
pnpm install ai @ai-sdk/google-vertex-ai zod

# 3. 启动开发环境
pnpm dev

# 4. 构建生产版本
pnpm build
```

### 开发环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Chrome >= 88 (支持 Manifest V3)

## Sprint 1: 项目基础设施实施指南

### 1.1 项目初始化

**第一步: 配置 Vite 项目**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content-script.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
})
```

**第二步: 配置 Manifest V3**

```json
// public/manifest.json
{
  "manifest_version": 3,
  "name": "LexiTrend",
  "version": "1.0.0",
  "description": "AI-powered Google Trends insights",
  "permissions": [
    "storage",
    "activeTab",
    "sidePanel"
  ],
  "host_permissions": [
    "https://trends.google.com/*",
    "https://generativelanguage.googleapis.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://trends.google.com/*"],
      "js": ["content.js"]
    }
  ],
  "action": {
    "default_popup": "popup.html"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  }
}
```

### 1.2 核心工具链开发

**存储服务实现示例**

```typescript
// src/services/storage.ts
class StorageService {
  private static instance: StorageService;
  
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async setApiKey(key: string): Promise<void> {
    // 简单加密 (生产环境需要更强的加密)
    const encrypted = btoa(key);
    await chrome.storage.local.set({ apiKey: encrypted });
  }

  async getApiKey(): Promise<string | null> {
    const result = await chrome.storage.local.get(['apiKey']);
    return result.apiKey ? atob(result.apiKey) : null;
  }

  async validateApiKey(key: string): Promise<boolean> {
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1/models?key=' + key
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

**缓存服务实现示例**

```typescript
// src/services/cache.ts
class CacheService {
  private dbName = 'LexiTrendDB';
  private storeName = 'lexitrend-cache';

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    await store.put({ key, value });
  }

  async get<T>(key: string): Promise<T | null> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    const result = await new Promise<any>((resolve, reject) => {
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    
    return result ? result.value : null;
  }
}
```

## Sprint 2: Onboarding 系统实施指南

### 2.1 API Key 表单组件

```typescript
// src/components/onboarding/ApiKeyForm.tsx
import React, { useState, useCallback } from 'react';
import { StorageService } from '../../services/storage';

export const ApiKeyForm: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateAndSave = useCallback(async () => {
    if (!apiKey.trim()) return;
    
    setStatus('loading');
    setErrorMessage('');
    
    try {
      const storage = StorageService.getInstance();
      const isValid = await storage.validateApiKey(apiKey);
      
      if (isValid) {
        await storage.setApiKey(apiKey);
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage('无效的 API 密钥，请检查后重试');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('验证失败，请检查网络连接');
    }
  }, [apiKey]);

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">配置 Gemini API</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          API 密钥
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="输入您的 Gemini API 密钥"
          disabled={status === 'loading'}
        />
      </div>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
          {errorMessage}
        </div>
      )}
      
      <button
        onClick={validateAndSave}
        disabled={!apiKey.trim() || status === 'loading'}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {status === 'loading' ? '验证中...' : '验证并保存'}
      </button>
    </div>
  );
};
```

### 2.2 语言选择器组件

```typescript
// src/components/onboarding/LanguageSelector.tsx
import React, { useState } from 'react';
import { CORE_LANGUAGES } from '../../constants/languages';

export const LanguageSelector: React.FC = () => {
  const [selected, setSelected] = useState('zh');

  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-4">选择结果语言</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {CORE_LANGUAGES.map((lang) => (
          <button
            key={lang.value}
            onClick={() => setSelected(lang.value)}
            className={`p-3 rounded-lg border-2 transition-colors ${
              selected === lang.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="font-medium">{lang.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
```

**重要更新**: 语言配置现在统一管理在 `src/constants/languages.ts` 中：

```typescript
// src/constants/languages.ts
export interface Language {
  value: string;
  label: string;
  nativeName: string; // 用于API调用时的语言名称
}

// 核心支持的语言（完全支持，包括prompt模板）
export const CORE_LANGUAGES: Language[] = [
  { value: 'zh', label: '中文', nativeName: '中文' },
  { value: 'en', label: 'English', nativeName: 'English' },
  { value: 'ja', label: '日本語', nativeName: '日本語' },
  { value: 'ko', label: '한국어', nativeName: '한국어' },
];

// 扩展支持的语言（UI显示，但API调用时使用英文prompt）
export const EXTENDED_LANGUAGES: Language[] = [
  ...CORE_LANGUAGES,
  { value: 'es', label: 'Español', nativeName: 'Español' },
  { value: 'fr', label: 'Français', nativeName: 'Français' },
  { value: 'de', label: 'Deutsch', nativeName: 'Deutsch' },
  { value: 'pt', label: 'Português', nativeName: 'Português' },
];
```

## Sprint 3-4: 核心功能实施指南

### 3.1 Content Script 实现

```javascript
// src/content-script.ts
class TrendsContentScript {
  private observer: MutationObserver;
  private selectedKeywords: Set<string> = new Set();

  constructor() {
    this.observer = new MutationObserver(this.handleDOMChanges.bind(this));
    this.init();
  }

  private init(): void {
    // 等待页面加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }

  private start(): void {
    this.injectCheckboxes();
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private handleDOMChanges(mutations: MutationRecord[]): void {
    // 防抖处理
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.injectCheckboxes();
    }, 300);
  }

  private injectCheckboxes(): void {
    const trendItems = document.querySelectorAll('[data-trend-item]');
    
    trendItems.forEach((item) => {
      if (item.querySelector('.lexitrend-checkbox')) return;
      
      const keyword = this.extractKeyword(item);
      if (!keyword) return;
      
      const checkbox = this.createCheckbox(keyword);
      item.prepend(checkbox);
    });
  }

  private createCheckbox(keyword: string): HTMLElement {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'lexitrend-checkbox';
    checkbox.style.cssText = 'margin-right: 8px; cursor: pointer;';
    
    checkbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.checked) {
        this.selectedKeywords.add(keyword);
      } else {
        this.selectedKeywords.delete(keyword);
      }
      
      this.notifyBackground();
    });
    
    return checkbox;
  }

  private notifyBackground(): void {
    chrome.runtime.sendMessage({
      type: 'KEYWORD_SELECTED',
      keywords: Array.from(this.selectedKeywords)
    });
  }

  private extractKeyword(element: Element): string | null {
    // 提取关键词逻辑
    const textContent = element.textContent?.trim();
    return textContent || null;
  }
}

// 启动内容脚本
new TrendsContentScript();
```

### 3.2 Background Service Worker

```typescript
// src/background.ts
import { ApiService } from './services/api';
import { CacheService } from './services/cache';

class BackgroundService {
  private apiService = new ApiService();
  private cacheService = new CacheService();

  constructor() {
    this.setupMessageListeners();
  }

  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener(
      (message, sender, sendResponse) => {
        this.handleMessage(message, sender, sendResponse);
        return true; // 保持消息通道开放
      }
    );
  }

  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'KEYWORD_SELECTED':
          await this.handleKeywordSelection(message.keywords);
          break;
        
        case 'REQUEST_INSIGHT':
          const insight = await this.getInsight(message.keyword, message.language);
          sendResponse({ success: true, data: insight });
          break;
        
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }

  private async handleKeywordSelection(keywords: string[]): Promise<void> {
    // 通知侧边栏更新
    chrome.runtime.sendMessage({
      type: 'KEYWORDS_UPDATED',
      keywords
    });
  }

  private async getInsight(keyword: string, language: string): Promise<any> {
    // 先检查缓存
    const cacheKey = `${keyword}-${language}`;
    const cached = await this.cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // 调用 API
    const insight = await this.apiService.analyzeKeyword(keyword, language);
    
    // 存入缓存
    await this.cacheService.set(cacheKey, insight);
    
    return insight;
  }
}

// 启动后台服务
new BackgroundService();
```

## 性能优化最佳实践

### 1. 组件优化

```typescript
// 使用 React.memo 优化组件重渲染
export const InsightCard = React.memo<InsightCardProps>(({ keyword, insight }) => {
  // 组件实现
});

// 使用 useMemo 优化计算
const processedContent = useMemo(() => {
  return processMarkdown(insight.content);
}, [insight.content]);

// 使用 useCallback 优化函数引用
const handleCopy = useCallback(() => {
  navigator.clipboard.writeText(insight.markdown);
}, [insight.markdown]);
```

### 2. 代码分割

```typescript
// 路由级别的代码分割
const LazyOnboarding = React.lazy(() => import('./components/Onboarding'));
const LazySidePanel = React.lazy(() => import('./components/SidePanel'));

// 组件级别的代码分割
const LazyInsightCard = React.lazy(() => import('./components/InsightCard'));
```

### 3. 缓存策略

```typescript
// 实现多级缓存
class CacheManager {
  private memoryCache = new Map();
  private indexedDBCache = new CacheService();

  async get(key: string): Promise<any> {
    // 1. 内存缓存
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    
    // 2. IndexedDB 缓存
    const result = await this.indexedDBCache.get(key);
    if (result) {
      this.memoryCache.set(key, result);
      return result;
    }
    
    return null;
  }
}
```

## 测试指南

### 1. 单元测试示例

```typescript
// src/services/__tests__/storage.test.ts
import { StorageService } from '../storage';

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = StorageService.getInstance();
    // Mock chrome.storage.local
    global.chrome = {
      storage: {
        local: {
          set: jest.fn().mockResolvedValue(undefined),
          get: jest.fn().mockResolvedValue({}),
        }
      }
    } as any;
  });

  test('should store and retrieve API key', async () => {
    const testKey = 'test-api-key';
    
    await storageService.setApiKey(testKey);
    expect(chrome.storage.local.set).toHaveBeenCalled();
    
    // Mock 返回值
    (chrome.storage.local.get as jest.Mock).mockResolvedValue({
      apiKey: btoa(testKey)
    });
    
    const retrievedKey = await storageService.getApiKey();
    expect(retrievedKey).toBe(testKey);
  });
});
```

## ApiService Implementation

```typescript
import { createGoogleVertexAI } from '@ai-sdk/google-vertex-ai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { StorageService } from './storage';
import { CacheService } from './cache';
import { InsightResponse, LexiTrendError } from '../types';

// ApiService Implementation
class ApiService {
  private google: ReturnType<typeof createGoogleVertexAI>;
  private cache: CacheService;

  constructor(apiKey: string) {
    this.google = createGoogleVertexAI({ apiKey });
    this.cache = new CacheService();
  }

  async analyzeKeyword(keyword: string, language: string): Promise<InsightResponse> {
    const cacheKey = `insight:${keyword}:${language}`;
    const cached = await this.cache.get<InsightResponse>(cacheKey);
    if (cached) return cached;

    const model = this.google('models/gemini-1.5-flash-001');
    
    try {
      const { object } = await generateObject({
        model,
        schema: z.object({
          definition: z.string(),
          culturalContext: z.string(),
          confidence: z.number(),
        }),
        prompt: `You are a professional vocabulary analyst. Your response must be in JSON format. Analyze the keyword: "${keyword}" in the following language: ${language}.`,
      });
      
      const response = { ...object, language, raw_response: null };
      await this.cache.set(cacheKey, response);
      return response;

    } catch (error) {
      console.error('Error analyzing keyword with Vercel AI SDK:', error);
      throw new LexiTrendError('API_ERROR', 'Failed to analyze keyword.', error);
    }
  }
}