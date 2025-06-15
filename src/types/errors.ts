/**
 * LexiTrend 错误处理机制
 * 提供统一的错误分类、处理策略和本地化支持
 */
import { storageService } from '../services/storage';

export enum ErrorType {
  NETWORK_ERROR = 'network',
  API_ERROR = 'api', 
  VALIDATION_ERROR = 'validation',
  STORAGE_ERROR = 'storage',
  CACHE_ERROR = 'cache',
  UNKNOWN_ERROR = 'unknown'
}

export type ErrorContext = {
  operation?: string;
  cause?: unknown;
  [key: string]: unknown;
};

export class LexiTrendError extends Error {
  public readonly type: ErrorType;
  public readonly context: ErrorContext;
  public readonly isRetryable: boolean;
  public userMessage: string;
  public readonly cause?: unknown;

  constructor(
    type: ErrorType,
    message: string,
    context: ErrorContext = {},
    isRetryable = false,
    cause?: unknown
  ) {
    super(message);
    this.name = 'LexiTrendError';
    this.type = type;
    this.context = {
      timestamp: Date.now(),
      ...context
    };
    this.isRetryable = isRetryable;
    this.userMessage = '';
    this.cause = cause;
    
    // 确保堆栈跟踪正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LexiTrendError);
    }
  }

  private async resolveUserMessage(): Promise<string> {
    let language = 'en';
    try {
      language = await storageService.getLanguage();
    } catch (e) {
      console.warn("Could not retrieve language from storage for error message, defaulting to 'en'.", e);
    }
    
    const messages = ERROR_MESSAGES[language as keyof typeof ERROR_MESSAGES] ?? ERROR_MESSAGES.en;
    return messages?.[this.type] ?? messages?.[ErrorType.UNKNOWN_ERROR] ?? 'Unknown error occurred';
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      context: this.context,
      isRetryable: this.isRetryable,
      stack: this.stack
    };
  }

  // 工厂模式来异步创建实例
  static async create(
    type: ErrorType,
    message: string,
    context: ErrorContext = {},
    isRetryable = false,
    cause?: unknown
  ): Promise<LexiTrendError> {
    const error = new LexiTrendError(type, message, context, isRetryable, cause);
    error.userMessage = await error.resolveUserMessage();
    return error;
  }
}

// 错误消息本地化支持
export const ERROR_MESSAGES: Record<string, Record<ErrorType, string>> = {
  zh: {
    [ErrorType.NETWORK_ERROR]: '网络连接失败，请检查网络设置后重试',
    [ErrorType.API_ERROR]: 'API服务暂时不可用，请稍后重试',
    [ErrorType.VALIDATION_ERROR]: '输入验证失败，请检查您的输入。',
    [ErrorType.STORAGE_ERROR]: '存储操作失败，请检查浏览器权限。',
    [ErrorType.CACHE_ERROR]: '缓存操作失败。',
    [ErrorType.UNKNOWN_ERROR]: '发生未知错误。'
  },
  en: {
    [ErrorType.NETWORK_ERROR]: 'Network connection failed, please check your connection and try again',
    [ErrorType.API_ERROR]: 'API service temporarily unavailable, please try again later',
    [ErrorType.VALIDATION_ERROR]: 'Input validation failed, please check your input.',
    [ErrorType.STORAGE_ERROR]: 'Storage operation failed, please check browser permissions.',
    [ErrorType.CACHE_ERROR]: 'Cache operation failed.',
    [ErrorType.UNKNOWN_ERROR]: 'An unknown error occurred.'
  }
};

// 错误处理策略配置
export const ERROR_STRATEGIES = {
  [ErrorType.NETWORK_ERROR]: {
    maxRetries: 3,
    retryDelay: (attempt: number) => Math.pow(2, attempt) * 1000, // 指数退避
    shouldRetry: true
  },
  [ErrorType.API_ERROR]: {
    maxRetries: 2,
    retryDelay: (attempt: number) => attempt * 2000, // 线性增长
    shouldRetry: true
  },
  [ErrorType.VALIDATION_ERROR]: {
    maxRetries: 0,
    shouldRetry: false
  },
  [ErrorType.STORAGE_ERROR]: {
    maxRetries: 2,
    retryDelay: () => 1000,
    shouldRetry: true,
    fallback: 'memory' // 降级到内存存储
  },
  [ErrorType.CACHE_ERROR]: {
    maxRetries: 1,
    retryDelay: () => 500,
    shouldRetry: true,
    fallback: 'skip' // 跳过缓存
  },
  [ErrorType.UNKNOWN_ERROR]: {
    maxRetries: 1,
    retryDelay: () => 1000,
    shouldRetry: false
  }
};

// 错误工厂函数
export class ErrorFactory {
  static createNetworkError(message: string, context?: ErrorContext): Promise<LexiTrendError> {
    return LexiTrendError.create(ErrorType.NETWORK_ERROR, message, context, true);
  }

  static createApiError(message: string, context?: ErrorContext): Promise<LexiTrendError> {
    return LexiTrendError.create(ErrorType.API_ERROR, message, context, true);
  }

  static createValidationError(message: string, context?: ErrorContext): Promise<LexiTrendError> {
    return LexiTrendError.create(ErrorType.VALIDATION_ERROR, message, context, false);
  }

  static createStorageError(message: string, context?: ErrorContext): Promise<LexiTrendError> {
    return LexiTrendError.create(ErrorType.STORAGE_ERROR, message, context, true);
  }

  static createCacheError(message: string, context?: ErrorContext): Promise<LexiTrendError> {
    return LexiTrendError.create(ErrorType.CACHE_ERROR, message, context, true);
  }

  static createUnknownError(message: string, context?: ErrorContext): Promise<LexiTrendError> {
    return LexiTrendError.create(ErrorType.UNKNOWN_ERROR, message, context, false);
  }
}

// 重试工具函数
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  errorType: ErrorType
): Promise<T> {
  const strategy = ERROR_STRATEGIES[errorType];
  let lastError: Error;

  if (!strategy || !strategy.shouldRetry) {
    return operation();
  }

  for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // 如果是最后一次尝试或不应重试，直接抛出错误
      if (attempt === strategy.maxRetries || !strategy.shouldRetry) {
        throw error;
      }

      // 等待指定时间后重试
      const delay = 'retryDelay' in strategy && typeof strategy.retryDelay === 'function' ? strategy.retryDelay(attempt) : 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// 错误记录器
export class ErrorLogger {
  private static logs: LexiTrendError[] = [];
  private static readonly MAX_LOGS = 100;

  static log(error: LexiTrendError): void {
    this.logs.unshift(error);
    
    // 保持日志数量在限制内
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }

    // 在开发环境中输出详细错误信息
    if (process.env.NODE_ENV === 'development') {
      console.error('[LexiTrend Error]', error.toJSON());
    }
  }

  static getLogs(): LexiTrendError[] {
    return [...this.logs];
  }

  static getLogsByType(type: ErrorType): LexiTrendError[] {
    return this.logs.filter(log => log.type === type);
  }

  static clearLogs(): void {
    this.logs = [];
  }
} 