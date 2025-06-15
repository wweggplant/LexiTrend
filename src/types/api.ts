/**
 * API 相关类型定义
 * 定义与外部AI服务通信的数据结构
 */
import { z } from 'zod';

// AI洞察响应的Zod Schema，这是从AI模型获取的结构化数据的验证标准
export const InsightSchema = z.object({
  definition: z.string().describe('The definition of the keyword.'),
  culturalContext: z.string().describe('The cultural context and relevance of the keyword.'),
  confidence: z.number().min(0).max(1).describe('A confidence score (0-1) for the analysis.'),
});

// API调用后，在服务端组装的完整InsightResponse类型
export type InsightResponse = z.infer<typeof InsightSchema> & {
  language: string;
  timestamp: number;
};

// 支持的AI模型列表
export const SUPPORTED_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite', 
  'gemini-1.5-flash'
] as const;

export type SupportedModel = typeof SUPPORTED_MODELS[number];

// 模型配置
export interface ModelConfig {
  name: SupportedModel;
  maxTokens: number;
  temperature: number;
  topP?: number;
  topK?: number;
  timeout: number;
  costPerToken: number; // 每token成本(美分)
}

// 默认模型配置
export const MODEL_CONFIGS: Record<SupportedModel, ModelConfig> = {
  'gemini-2.0-flash': {
    name: 'gemini-2.0-flash',
    maxTokens: 2000,
    temperature: 0.3,
    topP: 0.9,
    topK: 40,
    timeout: 10000,
    costPerToken: 0.01
  },
  'gemini-2.0-flash-lite': {
    name: 'gemini-2.0-flash-lite',
    maxTokens: 4000,
    temperature: 0.2,
    topP: 0.8,
    topK: 32,
    timeout: 15000,
    costPerToken: 0.05
  },
  'gemini-1.5-flash': {
    name: 'gemini-1.5-flash',
    maxTokens: 1500,
    temperature: 0.4,
    topP: 0.95,
    topK: 50,
    timeout: 8000,
    costPerToken: 0.005
  }
};

// API请求配置
export interface ApiRequestConfig {
  model: SupportedModel;
  keyword: string;
  language: string;
  enableReasoning?: boolean;
  contextPrompt?: string;
  maxRetries?: number;
  timeout?: number;
}

// Token使用统计
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

// API请求结果
export interface ApiResult {
  success: boolean;
  data?: InsightResponse;
  error?: string;
  tokenUsage?: TokenUsage;
  requestId: string;
  duration: number;
  model: SupportedModel;
}

// 请求去重相关
export interface RequestFingerprint {
  keyword: string;
  language: string;
  model: SupportedModel;
  hash: string;
}

// 批量分析请求
export interface BatchAnalysisRequest {
  keywords: string[];
  language: string;
  model?: SupportedModel;
  concurrency?: number;
}

export interface BatchAnalysisResult {
  results: Map<string, ApiResult>;
  totalDuration: number;
  successCount: number;
  errorCount: number;
}

// 模型智能选择策略
export enum TaskComplexity {
  SIMPLE = 'simple',    // 简单词汇，使用 flash 模型
  MEDIUM = 'medium',    // 中等复杂度，使用 1.5-flash
  COMPLEX = 'complex'   // 复杂词汇/专业术语，使用 pro 模型
}

export interface ModelSelectionStrategy {
  getModelForTask(keyword: string, language: string): SupportedModel;
  estimateComplexity(keyword: string): TaskComplexity;
}

// 缓存优化配置
export interface CacheControlConfig {
  useCache: boolean;
  cacheTTL?: number;
  cacheKey?: string;
  bypassCache?: boolean;
}

// API健康检查结果
export interface ApiHealthStatus {
  isHealthy: boolean;
  latency: number;
  errorRate: number;
  lastChecked: number;
  supportedModels: SupportedModel[];
}

// 提示词模板
export interface PromptTemplate {
  system: string;
  user: string;
  examples?: Array<{
    keyword: string;
    expectedResponse: Partial<InsightResponse>;
  }>;
}

// 语言特定的提示词
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  zh: {
    system: `你是一个专业的词汇分析师，专门帮助用户理解互联网热词、流行语和文化现象。
请用中文回答，确保解释准确、全面且易于理解。`,
    user: `请分析关键词"{keyword}"，提供以下信息：
1. 准确的定义和含义
2. 文化背景和使用场景
3. 相关性和流行程度
请用JSON格式回答。`,
    examples: [
      {
        keyword: "卷",
        expectedResponse: {
          definition: "形容竞争激烈，大家都在努力提升自己以获得优势",
          culturalContext: "源于网络用语，反映现代社会的竞争压力"
        }
      }
    ]
  },
  en: {
    system: `You are a professional vocabulary analyst specializing in helping users understand internet slang, popular terms, and cultural phenomena.
Please respond in English with accurate, comprehensive, and easy-to-understand explanations.`,
    user: `Please analyze the keyword "{keyword}" and provide:
1. Accurate definition and meaning
2. Cultural background and usage context  
3. Relevance and popularity
Please respond in JSON format.`,
    examples: [
      {
        keyword: "GOAT",
        expectedResponse: {
          definition: "Acronym for 'Greatest Of All Time', used to describe someone exceptional",
          culturalContext: "Popular in sports and social media to praise outstanding performance"
        }
      }
    ]
  }
};

// 响应验证模式
export interface ResponseValidation {
  isValid: boolean;
  errors: string[];
  completeness: number; // 0-1 分数
}

// API配额和限制
export interface ApiQuotaInfo {
  remainingRequests: number;
  resetTime: number;
  dailyLimit: number;
  monthlyLimit: number;
} 