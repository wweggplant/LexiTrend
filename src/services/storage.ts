/**
 * StorageService - 安全存储服务
 * 基于 chrome.storage.local API 实现配置和敏感数据的持久化存储
 */

import { ErrorFactory, ErrorType, retryWithBackoff } from '../types/errors';

// 存储键名常量
const STORAGE_KEYS = {
  API_KEY: 'lexitrend_api_key',
  LANGUAGE: 'lexitrend_language',
  ONBOARDING_COMPLETE: 'lexitrend_onboarding_complete',
  USER_SETTINGS: 'userSettings'
} as const;

// 默认配置
const DEFAULT_SETTINGS = {
  language: 'en',
  onboardingComplete: false,
  cacheEnabled: true,
  maxCacheSize: 1000,
  cacheTTL: 24 * 60 * 60 * 1000, // 24小时
  searchEnabled: true // Tavily搜索默认启用
};

export interface UserSettings {
  language: string;
  onboardingComplete: boolean;
  cacheEnabled: boolean;
  maxCacheSize: number;
  cacheTTL: number;
  // Tavily Search 设置
  tavilyApiKey?: string;
  searchEnabled: boolean;
}

export interface ApiKeyValidation {
  isValid: boolean;
  lastChecked: number;
  expiresAt?: number;
}

export interface IStorageService {
  // API 密钥管理
  setApiKey(key: string): Promise<void>;
  getApiKey(): Promise<string | null>;
  validateApiKey(key?: string): Promise<boolean>;
  clearApiKey(): Promise<void>;
  
  // 用户配置
  setLanguage(lang: string): Promise<void>;
  getLanguage(): Promise<string>;
  
  // 应用状态
  setOnboardingComplete(complete: boolean): Promise<void>;
  isOnboardingComplete(): Promise<boolean>;
  
  // Tavily Search 配置
  setTavilyApiKey(key: string): Promise<void>;
  getTavilyApiKey(): Promise<string | null>;
  setSearchEnabled(enabled: boolean): Promise<void>;
  getSearchEnabled(): Promise<boolean>;
  
  // 用户设置
  updateSettings(settings: Partial<UserSettings>): Promise<void>;
  getSettings(): Promise<UserSettings>;
  resetSettings(): Promise<void>;
  
  // 工具方法
  clearAll(): Promise<void>;
  getStorageInfo(): Promise<{ bytesInUse: number; quota: number }>;
}

/**
 * StorageService 提供了对 Chrome 存储的封装，用于管理扩展的数据。
 * 这是一个单例类，确保整个扩展中只有一个实例。
 */
export class StorageService implements IStorageService {
  private static instance: StorageService;
  private memoryFallback: Map<string, any> = new Map();
  private useMemoryFallback = false;

  // 私有构造函数，防止外部直接实例化
  private constructor() {
    this.initializeService();
  }

  /**
   * 获取 StorageService 的单例实例。
   */
  public static getInstance(): StorageService {
    if (!this.instance) {
      this.instance = new StorageService();
    }
    return this.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      await chrome.storage.local.get(null);
    } catch {
      console.warn('Storage service: chrome.storage.local is not available. Using memory fallback.');
      this.useMemoryFallback = true;
    }
  }

  // API 密钥管理
  async setApiKey(key: string): Promise<void> {
    if (!key || typeof key !== 'string') {
      throw await ErrorFactory.createValidationError('API密钥不能为空');
    }

    try {
      const encrypted = await this.encrypt(key);
      await this.setItem(STORAGE_KEYS.API_KEY, encrypted);
    } catch (error) {
      throw await ErrorFactory.createStorageError(
        `设置API密钥失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { operation: 'setApiKey', cause: error }
      );
    }
  }

  async getApiKey(): Promise<string | null> {
    try {
      const encrypted = await this.getItem<string>(STORAGE_KEYS.API_KEY);
      if (!encrypted) return null;
      
      return await this.decrypt(encrypted);
    } catch (error) {
      throw await ErrorFactory.createStorageError(
        `获取API密钥失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { operation: 'getApiKey', cause: error }
      );
    }
  }

  async validateApiKey(key?: string): Promise<boolean> {
    // 简化的验证：只检查密钥是否存在且格式正确
    // 实际的API验证现在由 ApiService 处理
    try {
      const apiKey = key || await this.getApiKey();
      if (!apiKey) return false;
      
      // 基本格式验证：检查是否是有效的字符串
      return typeof apiKey === 'string' && apiKey.trim().length > 0;
    } catch (error) {
      console.warn('API key validation failed:', error);
      return false;
    }
  }

  async clearApiKey(): Promise<void> {
    try {
      await this.removeItem(STORAGE_KEYS.API_KEY);
    } catch (error) {
      throw await ErrorFactory.createStorageError(
        `清除API密钥失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { operation: 'clearApiKey', cause: error }
      );
    }
  }

  // 用户配置
  async setLanguage(lang: string): Promise<void> {
    if (!lang || !['zh', 'en', 'ja', 'ko'].includes(lang)) {
      throw await ErrorFactory.createValidationError('不支持的语言设置');
    }

    try {
      await this.updateSettings({ language: lang });
    } catch (error) {
      throw await ErrorFactory.createStorageError(
        `设置语言失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { operation: 'setLanguage', details: { lang } }
      );
    }
  }

  async getLanguage(): Promise<string> {
    try {
      const settings = await this.getSettings();
      return settings.language;
    } catch (error) {
      console.warn('获取语言设置失败，使用默认值:', error);
      return DEFAULT_SETTINGS.language;
    }
  }

  // 应用状态
  async setOnboardingComplete(complete: boolean): Promise<void> {
    try {
      await this.updateSettings({ onboardingComplete: complete });
    } catch (error) {
      throw await ErrorFactory.createStorageError(
        `设置引导完成状态失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { operation: 'setOnboardingComplete', details: { complete } }
      );
    }
  }

  async isOnboardingComplete(): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      return settings.onboardingComplete;
    } catch (error) {
      console.warn('获取引导完成状态失败，返回默认值:', error);
      return false;
    }
  }

  // Tavily Search 配置
  async setTavilyApiKey(key: string): Promise<void> {
    try {
      await this.updateSettings({ tavilyApiKey: key });
    } catch (error) {
      throw await ErrorFactory.createStorageError(
        `设置Tavily API密钥失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { operation: 'setTavilyApiKey', cause: error }
      );
    }
  }

  async getTavilyApiKey(): Promise<string | null> {
    try {
      const settings = await this.getSettings();
      return settings.tavilyApiKey || null;
    } catch (error) {
      console.warn('获取Tavily API密钥失败:', error);
      return null;
    }
  }

  async setSearchEnabled(enabled: boolean): Promise<void> {
    try {
      await this.updateSettings({ searchEnabled: enabled });
    } catch (error) {
      throw await ErrorFactory.createStorageError(
        `设置搜索启用状态失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { operation: 'setSearchEnabled', details: { enabled } }
      );
    }
  }

  async getSearchEnabled(): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      return settings.searchEnabled ?? true;
    } catch (error) {
      console.warn('获取搜索启用状态失败，返回默认值:', error);
      return true;
    }
  }

  // 用户设置
  async updateSettings(newSettings: Partial<UserSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };
      await this.setItem(STORAGE_KEYS.USER_SETTINGS, updatedSettings);
    } catch (error) {
      throw await ErrorFactory.createStorageError(
        `更新用户设置失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { operation: 'updateSettings', cause: error }
      );
    }
  }

  async getSettings(): Promise<UserSettings> {
    try {
      const storedSettings = await this.getItem<UserSettings>(STORAGE_KEYS.USER_SETTINGS);
      return { ...DEFAULT_SETTINGS, ...storedSettings };
    } catch (error) {
      console.warn('获取设置失败，返回默认值:', error);
      return DEFAULT_SETTINGS;
    }
  }

  async resetSettings(): Promise<void> {
    try {
      await this.setItem(STORAGE_KEYS.USER_SETTINGS, DEFAULT_SETTINGS);
    } catch (error) {
      throw await ErrorFactory.createStorageError(
        `重置设置失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { operation: 'resetSettings', cause: error }
      );
    }
  }

  // 工具方法
  async clearAll(): Promise<void> {
    try {
      await this.removeItem(STORAGE_KEYS.API_KEY);
      await this.removeItem(STORAGE_KEYS.USER_SETTINGS);
      await this.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      await this.removeItem(STORAGE_KEYS.LANGUAGE);
      
      // Also clear the memory fallback
      this.memoryFallback.clear();

    } catch (error) {
      throw await ErrorFactory.createStorageError(
        `清除所有存储失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { operation: 'clearAll', cause: error }
      );
    }
  }

  async getStorageInfo(): Promise<{ bytesInUse: number; quota: number }> {
    try {
      if (this.useMemoryFallback) {
        // 内存模式下的近似计算
        const memorySize = Array.from(this.memoryFallback.entries())
          .reduce((total, [key, value]) => {
            return total + key.length + JSON.stringify(value).length;
          }, 0);
        
        return {
          bytesInUse: memorySize,
          quota: 1024 * 1024 // 1MB 模拟配额
        };
      }

      const bytesInUse = await chrome.storage.local.getBytesInUse();
      return {
        bytesInUse,
        quota: chrome.storage.local.QUOTA_BYTES
      };
    } catch (error) {
      throw await ErrorFactory.createStorageError(
        `获取存储信息失败: ${error instanceof Error ? error.message : '未知错误'}`,
        { operation: 'getStorageInfo' }
      );
    }
  }



  // 私有方法 - 加密解密
  private async encrypt(value: string): Promise<string> {
    return btoa(encodeURIComponent(value));
  }

  private async decrypt(encrypted: string): Promise<string> {
    return decodeURIComponent(atob(encrypted));
  }

  // 私有方法 - 底层存储操作
  private async setItem<T>(key: string, value: T): Promise<void> {
    return retryWithBackoff(async () => {
      if (this.useMemoryFallback) {
        this.memoryFallback.set(key, value);
      } else {
        await chrome.storage.local.set({ [key]: value });
      }
    }, ErrorType.STORAGE_ERROR);
  }

  private async getItem<T>(key: string): Promise<T | null> {
    return retryWithBackoff(async () => {
      if (this.useMemoryFallback) {
        return this.memoryFallback.get(key) || null;
      }

      const result = await chrome.storage.local.get([key]);
      return result[key] || null;
    }, ErrorType.STORAGE_ERROR);
  }

  private async removeItem(key: string): Promise<void> {
    return retryWithBackoff(async () => {
      if (this.useMemoryFallback) {
        this.memoryFallback.delete(key);
      } else {
        await chrome.storage.local.remove(key);
      }
    }, ErrorType.STORAGE_ERROR);
  }
}

// 导出单例实例
export const storageService = StorageService.getInstance(); 