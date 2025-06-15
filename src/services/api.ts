/**
 * ApiService - AI API通信服务
 * 使用 Vercel AI SDK 与 Google Gemini模型进行交互。
 */
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject, generateText, tool } from 'ai';
import { z } from 'zod';
import { ErrorFactory } from '../types/errors';
import type { InsightResponse } from '../types/api';
import { InsightSchema } from '../types/api';
import { storageService, type IStorageService } from './storage';
import { cacheService, type CacheService } from './cache';
import { getLanguageNativeName } from '../constants/languages';
import { tavilyService } from './tavily';
import type { EnhancedInsightResponse, TavilySearchResult } from '../types/tavily';

// Zod Schema for structured response validation
// MOVED to src/types/api.ts

// Enhanced Schema for Function Calling results
const EnhancedInsightSchema = z.object({
  definition: z.string().describe('The definition of the keyword.'),
  culturalContext: z.string().describe('The cultural context and relevance of the keyword.'),
  confidence: z.number().min(0).max(1).describe('A confidence score (0-1) for the analysis.'),
  searchPerformed: z.boolean().describe('Whether real-time search was performed.'),
  searchQuery: z.string().optional().describe('The search query used if search was performed.'),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string(),
    relevance: z.string()
  })).optional().describe('Sources used for the analysis.')
});

// TypeScript type inferred from the Zod schema
// MOVED to src/types/api.ts

export type SupportedModel = 'gemini-1.5-flash' | 'gemini-2.0-flash-lite';

// API配置
const API_CONFIG = {
  DEFAULT_MODEL: 'gemini-1.5-flash' as SupportedModel,
  SUPPORTED_MODELS: ['gemini-1.5-flash', 'gemini-2.0-flash-lite'] as SupportedModel[],
} as const;

// 提示词模板
const PROMPT_TEMPLATES: Record<string, { system: string; user: string }> = {
  zh: {
    system: '你是一个专业的词汇分析师，专门帮助用户理解互联网热词、流行语和文化现象。你的回答必须是严格遵循提供的Zod Schema的JSON格式。',
    user: '请分析关键词："{keyword}"',
  },
  en: {
    system: 'You are a professional vocabulary analyst specializing in internet slang and cultural phenomena. You must respond in a structured JSON format that strictly follows the provided Zod Schema.',
    user: 'Please analyze the keyword: "{keyword}"',
  },
};

// Enhanced prompts for Function Calling
const ENHANCED_PROMPT_TEMPLATES: Record<string, { system: string; user: string }> = {
  zh: {
    system: '你是一个专业的词汇分析师，专门帮助用户理解互联网热词、流行语和文化现象。你可以使用实时搜索工具来获取最新信息。当分析的关键词可能涉及以下情况时，请使用搜索工具：\n\n1. 最近的热点事件或趋势\n2. 新兴的网络流行语或梗\n3. 当前正在发生的社会现象\n4. 最新的科技术语或产品\n5. 近期的娱乐圈事件或人物\n\n请根据获取的信息提供准确、最新的分析。',
    user: '请分析关键词："{keyword}"。如果这个关键词涉及最新信息或当前热点，请使用搜索工具获取实时信息。'
  },
  en: {
    system: 'You are a professional vocabulary analyst specializing in internet slang and cultural phenomena. You have access to real-time search tools. Use the search tool when analyzing keywords that might involve:\n\n1. Recent trending events or topics\n2. New internet slang or memes\n3. Current social phenomena\n4. Latest technology terms or products\n5. Recent entertainment industry events or figures\n\nProvide accurate, up-to-date analysis based on the retrieved information.',
    user: 'Please analyze the keyword: "{keyword}". If this keyword involves recent information or current trends, use the search tool to get real-time information.'
  }
};

interface IApiService {
  analyzeKeyword(keyword: string, language: string): Promise<InsightResponse>; // language: AI回复使用的语言
  analyzeKeywordEnhanced(keyword: string, language: string): Promise<EnhancedInsightResponse>;
  getSupportedModels(): SupportedModel[];
  estimateTokens(text: string): number;
  validateApiKey(apiKey: string): Promise<boolean>;
  validateTavilyApiKey(apiKey: string): Promise<boolean>;
}

export class ApiService implements IApiService {
  private static instance: ApiService;
  private requestCache = new Map<string, Promise<InsightResponse>>();
  private enhancedRequestCache = new Map<string, Promise<EnhancedInsightResponse>>();
  private apiCallTimestamps: number[] = [];
  private readonly RATE_LIMIT_COUNT = 5; // 5 calls
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
  private tavilyService?: typeof tavilyService;

  static async getInstance(): Promise<ApiService> {
    if (!ApiService.instance) {
      const instance = new ApiService(storageService, cacheService);
      await instance.initializeTavilyService();
      ApiService.instance = instance;
    }
    return ApiService.instance;
  }

  constructor(
    private storage: IStorageService,
    private cache: CacheService
  ) {
    // Initialization is now handled by the async getInstance method.
  }

  private async initializeTavilyService() {
    try {
      const searchEnabled = await this.storage.getSearchEnabled();
      if (searchEnabled) {
        // 尝试获取用户配置的API密钥
        const apiKey = await this.storage.getTavilyApiKey();
        if (apiKey) {
          this.tavilyService = tavilyService;
        }
        // 如果没有配置API密钥，可以使用免费版本或跳过初始化
        // 这里为了演示，我们暂时跳过没有API密钥的情况
      }
    } catch (error) {
      console.warn('Failed to initialize Tavily service:', error);
    }
  }

  async analyzeKeywordEnhanced(keyword: string, language: string): Promise<EnhancedInsightResponse> {
    if (!keyword?.trim()) {
      throw await ErrorFactory.createValidationError('关键词不能为空');
    }

    const lang = ENHANCED_PROMPT_TEMPLATES[language] ? language : 'en';
    const modelId = this.getOptimalModel(keyword);
    const cacheKey = this.generateEnhancedCacheKey(keyword, lang, modelId);
    
    // 1. Check Cache
    const cached = await this.cache.get<EnhancedInsightResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Debounce concurrent requests
    const requestKey = `enhanced-${keyword}-${language}`;
    if (this.enhancedRequestCache.has(requestKey)) {
      return await this.enhancedRequestCache.get(requestKey)!;
    }

    // 3. Execute request with Function Calling
    const requestPromise = this.executeEnhancedRequest(keyword.trim(), lang, modelId);
    
    this.enhancedRequestCache.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      // 4. Cache successful result
      await this.cache.set(cacheKey, result);
      return result;
    } finally {
      // 5. Clean up cache
      this.enhancedRequestCache.delete(requestKey);
    }
  }

  private async executeEnhancedRequest(keyword: string, language: string, modelId: SupportedModel): Promise<EnhancedInsightResponse> {
    const apiKey = await this.storage.getApiKey();
    if (!apiKey) {
      throw await ErrorFactory.createValidationError('未设置API密钥');
    }

    try {
      const google = createGoogleGenerativeAI({ apiKey });
      const model = google(modelId);
      
      // 如果有Tavily服务，使用Function Calling
      if (this.tavilyService) {
        return await this.executeWithFunctionCalling(keyword, language, model);
      } else {
        // 降级到基础分析
        return await this.executeFallbackAnalysis(keyword, language);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown API error occurred.';
      if (errorMessage.includes('API key not valid')) {
        throw await ErrorFactory.createValidationError('API密钥无效或已过期');
      }
      throw await ErrorFactory.createApiError(`增强关键词分析失败: ${errorMessage}`, {
        operation: 'analyzeKeywordEnhanced',
        details: { keyword, language },
        cause: error,
      });
    }
  }

  private async executeWithFunctionCalling(keyword: string, language: string, model: any): Promise<EnhancedInsightResponse> {
    const prompt = this.buildEnhancedPrompt(keyword, language);
    
    // 定义Tavily搜索工具
    const tools = {
      tavily_search: tool({
        description: 'Search for real-time information about keywords, companies, or trending topics.',
        parameters: z.object({
          query: z.string().describe('A specific and context-rich search query for the keyword.'),
        }),
        execute: async ({ query }) => this.executeTavilySearch({ query, search_depth: 'advanced' })
      })
    };

    // Let the Vercel AI SDK handle the tool execution loop automatically.
    // By providing `maxSteps`, the SDK will call tools, feed results back to the model,
    // and repeat until the model generates a final text response.
    const result = await generateText({
      model,
      tools,
      system: prompt.system,
      prompt: prompt.user,
      temperature: 0.3,
      maxSteps: 3, // Allow up to 3 steps (e.g., model -> tool -> model)
    });

    // After the loop, the result object contains the final text and all tool interactions.
    // We can now generate our final structured insight from this complete result.
    return await this.parseToolCallResult(result, keyword, language);
  }

  private async executeTavilySearch(args: { query: string; search_depth: string }) {
    if (!this.tavilyService) {
      throw new Error('Tavily service is not initialized.');
    }

    try {
      const searchResult = await this.tavilyService.search(
        args.query,
        args.search_depth as 'basic' | 'advanced',
        5 // maxResults
      );

      return {
        query: searchResult.query,
        answer: searchResult.answer,
        sources: searchResult.results.map((result: TavilySearchResult) => ({
          title: result.title,
          url: result.url,
          content: result.content.substring(0, 500), // 限制长度
          score: result.score
        }))
      };
    } catch (error) {
      console.error('Tavily search failed:', error);
      return {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async parseToolCallResult(
    result: { text: string; toolCalls: any[]; }, 
    keyword: string, 
    language: string
  ): Promise<EnhancedInsightResponse> {
    const searchPerformed = result.toolCalls && result.toolCalls.length > 0;
    const sources = searchPerformed ? this.extractSourcesFromToolCalls(result.toolCalls) : [];
    const searchQuery = searchPerformed ? (result.toolCalls[0] as { args: { query: string } }).args.query : undefined;

    const structuredResult = await this.generateStructuredInsight(
      result.text,
      keyword,
      language,
      searchPerformed,
      searchQuery,
      sources
    );
    
    return {
      ...structuredResult,
      language,
      timestamp: Date.now(),
      searchMetadata: {
        searchPerformed,
        searchQuery,
        sources
      }
    };
  }

  private extractSourcesFromToolCalls(toolCalls: any[]): Array<{ title: string; url: string; relevance: string }> {
    const sources: Array<{ title: string; url: string; relevance: string }> = [];
    
    for (const toolCall of toolCalls) {
      // The SDK formats the result of the tool call inside the `result` property
      if (toolCall.toolName === 'tavily_search' && toolCall.result?.sources) {
        for (const source of toolCall.result.sources) {
          sources.push({
            title: source.title,
            url: source.url,
            relevance: `搜索相关性评分: ${source.score}`
          });
        }
      }
    }
    
    return sources;
  }

  private async generateStructuredInsight(
    text: string, 
    keyword: string, 
    language: string,
    searchPerformed: boolean,
    searchQuery?: string,
    sources: Array<{ title: string; url: string; relevance: string }> = []
  ): Promise<Omit<EnhancedInsightResponse, 'language' | 'timestamp' | 'searchMetadata'>> {
    // 使用generateObject生成结构化的洞察数据
    const apiKey = await this.storage.getApiKey();
    const google = createGoogleGenerativeAI({ apiKey: apiKey ?? '' });
    const model = google(this.getOptimalModel(keyword));

    const prompt = this.buildStructuredPrompt(text, keyword, language, searchPerformed, searchQuery, sources);

    try {
      const { object } = await generateObject({
        model,
        schema: EnhancedInsightSchema,
        system: prompt.system,
        prompt: prompt.user,
        temperature: 0.2,
      });

      return object;
    } catch (error) {
      // 如果结构化生成失败，使用文本解析作为后备方案
      console.warn('Structured generation failed, using text parsing fallback:', error);
      return this.parseTextToStructuredInsight(text, searchPerformed, searchQuery, sources);
    }
  }

  private buildStructuredPrompt(
    text: string, 
    keyword: string, 
    language: string,
    searchPerformed: boolean,
    searchQuery?: string,
    sources: Array<{ title: string; url: string; relevance: string }> = []
  ) {
    const langName = getLanguageNativeName(language);
    
    const systemPrompt = `你是一个专业的数据结构化专家。请根据以下分析文本生成结构化的关键词洞察数据。使用${langName}回复。`;
    
    const userPrompt = `
基于以下信息，生成关键词"${keyword}"的结构化洞察数据：

分析文本：
${text}

搜索信息：
- 是否进行了搜索：${searchPerformed ? '是' : '否'}
${searchQuery ? `- 搜索查询：${searchQuery}` : ''}
${sources.length > 0 ? `- 信息来源数量：${sources.length}` : ''}

请生成包含definition、culturalContext、confidence、searchPerformed、searchQuery（如果有）和sources（如果有）的结构化数据。
    `.trim();

    return {
      system: systemPrompt,
      user: userPrompt
    };
  }

  private parseTextToStructuredInsight(
    text: string,
    searchPerformed: boolean,
    searchQuery?: string,
    sources: Array<{ title: string; url: string; relevance: string }> = []
  ): Omit<EnhancedInsightResponse, 'language' | 'timestamp' | 'searchMetadata'> {
    // 简单的文本解析作为后备方案
    const lines = text.split('\n').filter(line => line.trim());
    let definition = '';
    let culturalContext = '';
    let confidence = 0.7; // 默认置信度

    // 基本的解析逻辑
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      if (line.includes('定义') || line.includes('Definition') || line.includes('是指') || line.includes('refers to')) {
        definition = this.extractContent(line, lines, i);
      } else if (line.includes('文化') || line.includes('Cultural') || line.includes('背景') || line.includes('context')) {
        culturalContext = this.extractContent(line, lines, i);
      }
    }

    // 如果解析失败，使用整个文本作为定义
    if (!definition && !culturalContext) {
      const sentences = text.split(/[。！？.!?]/).filter(s => s.trim());
      definition = sentences[0] || text.substring(0, 200);
      culturalContext = sentences.slice(1).join('。') || '需要更多文化背景信息。';
    }

    // 根据搜索结果调整置信度
    if (searchPerformed && sources.length > 0) {
      confidence = Math.min(0.9, confidence + 0.2);
    }

    return {
      definition: definition || '定义解析中...',
      culturalContext: culturalContext || '文化背景分析中...',
      confidence
    };
  }

  private extractContent(line: string, lines: string[], index: number): string {
    // 尝试从当前行提取内容
    const colonIndex = line.indexOf('：') || line.indexOf(':');
    if (colonIndex > -1) {
      const content = line.substring(colonIndex + 1).trim();
      if (content) return content;
    }
    
    // 如果当前行没有内容，尝试下一行
    if (index + 1 < lines.length) {
      return lines[index + 1]?.trim() ?? '';
    }
    
    return '';
  }

  private async executeFallbackAnalysis(keyword: string, language: string): Promise<EnhancedInsightResponse> {
    // 使用基础的分析方法作为后备方案
    const basicResult = await this.executeRequestWithVercelAI(keyword, language, 'gemini-1.5-flash');
    
    return {
      ...basicResult,
      searchMetadata: {
        searchPerformed: false,
        lastUpdated: undefined,
        sources: []
      }
    };
  }

  private buildEnhancedPrompt(keyword: string, language: string) {
    const langName = getLanguageNativeName(language);
    const template = ENHANCED_PROMPT_TEMPLATES[language] ?? ENHANCED_PROMPT_TEMPLATES.en;
    
    if (!template) {
      throw new Error(`Unsupported language: ${language}`);
    }
    
    return {
      system: `${template.system} 请使用${langName}回复。`,
      user: template.user.replace('{keyword}', keyword),
    };
  }

  private generateEnhancedCacheKey(keyword: string, language: string, model: SupportedModel): string {
    return `enhanced-insight:${keyword}:${language}:${model}`;
  }

  async analyzeKeyword(keyword: string, language: string): Promise<InsightResponse> {
    if (!keyword?.trim()) {
      throw await ErrorFactory.createValidationError('关键词不能为空');
    }

    // language参数指定AI返回结果使用的语言
    const lang = PROMPT_TEMPLATES[language] ? language : 'en';
    const modelId = this.getOptimalModel(keyword);
    const cacheKey = this.generateCacheKey(keyword, lang, modelId);
    
    // 1. Check Cache
    const cached = await this.cache.get<InsightResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Debounce concurrent requests for the same keyword
    const requestKey = `${keyword}-${language}`;
    if (this.requestCache.has(requestKey)) {
      return await this.requestCache.get(requestKey)!;
    }

    // 3. Execute request
    const requestPromise = this.executeRequestWithVercelAI(keyword.trim(), lang, modelId);
    
    this.requestCache.set(requestKey, requestPromise);

    try {
        const result = await requestPromise;
        // 4. Cache successful result
        await this.cache.set(cacheKey, result);
        return result;
    } finally {
        // 5. Clean up cache
        this.requestCache.delete(requestKey);
    }
  }

  private async executeRequestWithVercelAI(keyword: string, language: string, modelId: SupportedModel): Promise<InsightResponse> {
    const apiKey = await this.storage.getApiKey();
    if (!apiKey) {
      throw await ErrorFactory.createValidationError('未设置API密钥');
    }

    try {
      const google = createGoogleGenerativeAI({ apiKey });
      const model = google(modelId);
      const prompt = this.buildPrompt(keyword, language);

      const { object } = await generateObject({
        model,
        schema: InsightSchema,
        system: prompt.system,
        prompt: prompt.user,
        temperature: 0.3,
      });

      return {
        ...object,
        language,
        timestamp: Date.now(),
      };
    } catch (error: unknown) {
      // Handle potential API errors from the Vercel AI SDK
      const errorMessage = error instanceof Error ? error.message : 'An unknown API error occurred.';
      if (errorMessage.includes('API key not valid')) {
          throw await ErrorFactory.createValidationError('API密钥无效或已过期');
      }
      throw await ErrorFactory.createApiError(`关键词分析失败: ${errorMessage}`, {
        operation: 'analyzeKeyword',
        details: { keyword, language },
        cause: error,
      });
    }
  }

  private buildPrompt(keyword: string, language: string) {
    // 根据语言动态构建prompt，明确指定AI回复语言
    const langName = getLanguageNativeName(language);
    
    const template = PROMPT_TEMPLATES[language] ?? PROMPT_TEMPLATES.en;
    if (!template) {
      throw ErrorFactory.createValidationError('不支持的语言', { keyword, language });
    }
    
    return {
      system: `${template.system} 请使用${langName}回复。`,
      user: template.user.replace('{keyword}', keyword),
    };
  }

  getSupportedModels(): SupportedModel[] {
    return [...API_CONFIG.SUPPORTED_MODELS];
  }

  estimateTokens(text: string): number {
    // 简单估算：中文按字符*1.5，英文按单词
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = text.replace(/[\u4e00-\u9fff]/g, '').split(/\s+/).filter(w => w.length > 0).length;
    
    return Math.ceil(chineseChars * 1.5) + englishWords;
  }

  private getOptimalModel(keyword: string): SupportedModel {
    if (keyword.length > 20 || /[A-Z]{2,}/.test(keyword)) {
      return 'gemini-2.0-flash-lite';
    }
    return 'gemini-1.5-flash';
  }

  private generateCacheKey(keyword: string, language: string, model: SupportedModel): string {
    return `insight:${keyword}:${language}:${model}`;
  }

  private recordApiCall() {
    const now = Date.now();
    this.apiCallTimestamps.push(now);
    // Clean up old timestamps
    this.apiCallTimestamps = this.apiCallTimestamps.filter(
      timestamp => now - timestamp < this.RATE_LIMIT_WINDOW_MS
    );
  }

  private isRateLimited(): boolean {
    const now = Date.now();
    const recentTimestamps = this.apiCallTimestamps.filter(
      timestamp => now - timestamp < this.RATE_LIMIT_WINDOW_MS
    );
    return recentTimestamps.length >= this.RATE_LIMIT_COUNT;
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    if (this.isRateLimited()) {
      // To prevent key validation from being abused for DDOS
      console.warn('Rate limit exceeded for API key validation.');
      return false;
    }
    this.recordApiCall();

    if (apiKey.trim() === '') {
      return false;
    }
    try {
      // The Vercel AI SDK doesn't expose a direct `listModels` or validation function.
      // The idiomatic way is to make a minimal API call. We'll use `generateText` for this.
      const google = createGoogleGenerativeAI({ apiKey });
      await generateText({
        model: google('gemini-1.5-flash'), // Use a fast, cost-effective model.
        prompt: 'test',
        maxTokens: 1, // We only need a successful response, not content.
      });
      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  async validateTavilyApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey?.trim()) {
      return false;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'VALIDATE_TAVILY_KEY',
        payload: { apiKey }
      });

      if (response.error) {
        console.error('Tavily key validation error:', response.error);
        return false;
      }
      
      return response.isValid;
    } catch (error) {
      console.error('Failed to send message to background script for Tavily validation:', error);
      // If the background script is not available or throws an error, consider it a failure.
      return false;
    }
  }

  private async generateStructuredInsightWithTools(
    keyword: string,
    language: string,
    model: any,
    toolResults: any[]
  ): Promise<EnhancedInsightResponse> {
    const { object } = await generateObject({
      model,
      schema: EnhancedInsightSchema,
      prompt: `Based on the following search results, analyze the keyword "${keyword}" in ${getLanguageNativeName(language)}: ${JSON.stringify(toolResults)}`,
    });

    return {
      ...object,
      language,
      timestamp: Date.now(),
      searchMetadata: {
        searchPerformed: true,
        searchQuery: toolResults[0]?.result?.query || keyword,
      },
    };
  }
}

// Export the interface for type hinting
export type { IApiService };
// Keep the singleton export for the main app
export const apiService = ApiService.getInstance();
// Export the class for testing
export { ApiService as ApiServiceClass }; 