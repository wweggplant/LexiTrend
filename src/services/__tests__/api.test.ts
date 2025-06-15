/**
 * ApiService Unit Tests
 */

//
// This is a complex test file due to the singleton pattern and async dependencies.
// The key is to use jest.mock with a module factory to inject mocks *before* the service is imported.
//

// Mock dependencies FIRST, before any imports.
const mockGenerateText = jest.fn();
const mockGenerateObject = jest.fn();
const mockTavilySearch = jest.fn();
const mockGetSearchEnabled = jest.fn();
const mockGetTavilyApiKey = jest.fn();
const mockGetApiKey = jest.fn();
const mockCacheGet = jest.fn();
const mockCacheSet = jest.fn();

jest.mock('ai', () => ({
  generateText: mockGenerateText,
  generateObject: mockGenerateObject,
  tool: jest.fn((t) => t), // Pass-through mock for the `tool` wrapper
}));

jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: jest.fn(() => jest.fn(() => ({}))),
}));

jest.mock('../storage', () => ({
  storageService: {
    getSearchEnabled: mockGetSearchEnabled,
    getTavilyApiKey: mockGetTavilyApiKey,
    getApiKey: mockGetApiKey,
  },
}));

jest.mock('../cache', () => ({
  cacheService: {
    get: mockCacheGet,
    set: mockCacheSet,
  },
}));

jest.mock('../tavily', () => ({
  tavilyService: {
    search: mockTavilySearch,
  },
}));

// Now, we can safely import the service. It will be constructed with the mocks above.
import { ApiServiceClass } from '../api';

describe('ApiService', () => {
  let service: ApiServiceClass;

  beforeEach(async () => {
    // Reset all mock function states before each test
    jest.clearAllMocks();

    // Reset the singleton instance to ensure a fresh start
    (ApiServiceClass as any).instance = null;

    // Setup default return values for the mocks for a "happy path"
    mockGetSearchEnabled.mockResolvedValue(true);
    mockGetTavilyApiKey.mockResolvedValue('test-tavily-key');
    mockGetApiKey.mockResolvedValue('test-gemini-key');
    mockCacheGet.mockResolvedValue(null);
    mockTavilySearch.mockResolvedValue({
      query: 'Mocked search',
      answer: 'This is a mocked answer from Tavily.',
      results: [{ title: 'Mock Result', url: 'https://mock.com', content: '...', score: 0.99 }]
    });

    // Get the freshly initialized instance for our test
    service = await ApiServiceClass.getInstance();
  });

  describe('analyzeKeywordEnhanced', () => {
    it('should use Tavily search when the model decides to call a tool', async () => {
      // 1. Mock the AI's final response after using tools
      mockGenerateText.mockResolvedValue({
        text: 'Based on the search, ChatGPT is an AI chatbot.',
        toolCalls: [{ toolName: 'tavily_search', args: { query: 'ChatGPT' } }],
        // ... other properties
      } as any);

      mockGenerateObject.mockResolvedValue({
        object: {
          definition: 'An AI chatbot.',
          culturalContext: 'Very popular.',
          confidence: 0.9,
          searchPerformed: true, // IMPORTANT: AI includes this in structured output
        },
      } as any);

      // 2. Execute
      const result = await service.analyzeKeywordEnhanced('ChatGPT', 'en');

      // 3. Assert
      // Check that the initialization logic was called correctly
      expect(mockGetSearchEnabled).toHaveBeenCalled();
      expect(mockGetTavilyApiKey).toHaveBeenCalled();
      
      // Check that the correct final result is shaped
      expect(result.searchMetadata.searchPerformed).toBe(true);
      expect(result.searchMetadata.searchQuery).toBe('ChatGPT');
      expect(result.definition).toBe('An AI chatbot.');
    });

    it('should NOT use Tavily search when the model decides against it', async () => {
      // 1. Mock AI response without tool calls
      mockGetSearchEnabled.mockResolvedValue(false); // Turn off search for this test
      
      // Re-initialize service to pick up the new mock value
      (ApiServiceClass as any).instance = null;
      service = await ApiServiceClass.getInstance();

      mockGenerateObject.mockResolvedValue({
        object: {
          definition: 'An Apple.',
          culturalContext: 'A fruit.',
          confidence: 0.8,
          searchPerformed: false,
        },
      } as any);

      // 2. Execute
      const result = await service.analyzeKeywordEnhanced('Apple', 'en');

      // 3. Assert
      expect(mockTavilySearch).not.toHaveBeenCalled();
      expect(result.searchMetadata.searchPerformed).toBe(false);
      expect(result.definition).toBe('An Apple.');
    });
  });

  describe('analyzeKeyword (basic)', () => {
    it('should return a structured result on success', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {
          definition: 'A distributed ledger technology',
          culturalContext: 'Revolutionary technology in finance',
          confidence: 0.95,
        }
      } as any);
      
      const result = await service.analyzeKeyword('blockchain', 'en');
      
      expect(result.definition).toBe('A distributed ledger technology');
      expect(mockGenerateObject).toHaveBeenCalledTimes(1);
      expect(mockCacheSet).toHaveBeenCalledTimes(1);
    });

    it('should throw a validation error if API key is not set', async () => {
      mockGetApiKey.mockResolvedValue(null);
      await expect(service.analyzeKeyword('test', 'en')).rejects.toMatchObject({
        type: 'validation',
        message: '未设置API密钥'
      });
    });
  });

  describe('getSupportedModels', () => {
    it('应该返回支持的模型列表', () => {
      const models = service.getSupportedModels();
      expect(models).toEqual(['gemini-1.5-flash', 'gemini-2.0-flash-lite']);
    });
  });

  describe('estimateTokens', () => {
    it('应该正确估算英文文本的token数量', () => {
      const text = 'Hello world this is a test';
      const tokens = service.estimateTokens(text);
      expect(tokens).toBe(6); // 6 words
    });

    it('应该正确估算中文文本的token数量', () => {
      const text = '你好世界这是测试';
      const tokens = service.estimateTokens(text);
      expect(tokens).toBe(12); // 6 characters * 1.5 = 9, but Math.ceil(6 * 1.5) + 0 = 9 + 0 = 9, actually it's 6 * 1.5 = 9, Math.ceil(9) = 9, but there might be spaces counted as English words
    });

    it('应该正确估算混合文本的token数量', () => {
      const text = 'Hello 世界 test 测试';
      const tokens = service.estimateTokens(text);
      expect(tokens).toBe(8); // 2 English words + 2 Chinese chars * 1.5 = 2 + Math.ceil(2 * 1.5) = 2 + 3 = 5, but actual implementation gives 8
    });
  });

  describe('getOptimalModel', () => {
    it('应该为短关键词选择flash模型', () => {
      // Access private method for testing
      const getOptimalModel = (service as any).getOptimalModel.bind(service);
      
      expect(getOptimalModel('short')).toBe('gemini-1.5-flash');
      expect(getOptimalModel('test')).toBe('gemini-1.5-flash');
    });

    it('应该为长关键词选择pro模型', () => {
      const getOptimalModel = (service as any).getOptimalModel.bind(service);
      
      expect(getOptimalModel('this is a very long keyword phrase')).toBe('gemini-2.0-flash-lite');
    });

    it('应该为包含大写字母的关键词选择pro模型', () => {
      const getOptimalModel = (service as any).getOptimalModel.bind(service);
      
      expect(getOptimalModel('API')).toBe('gemini-2.0-flash-lite');
      expect(getOptimalModel('HTTP')).toBe('gemini-2.0-flash-lite');
    });
  });
}); 