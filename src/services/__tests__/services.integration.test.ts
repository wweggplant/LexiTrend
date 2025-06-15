import 'fake-indexeddb/auto';
import { storageService } from '../storage';
import { cacheService } from '../cache';
import { ApiServiceClass } from '../api';
import type { InsightResponse } from '../../types/api';
import { closeDB } from '../indexedDB';

// Mock the Vercel AI SDK
jest.mock('ai', () => ({
  generateObject: jest.fn(),
}));

jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: jest.fn(),
}));

describe('Services Integration Test', () => {
  let mockGenerateObject: jest.Mock;
  let mockCreateGoogleGenerativeAI: jest.Mock;
  let mockModel: jest.Mock;

  beforeEach(async () => {
    // Import and setup mocks
    const { generateObject } = await import('ai');
    const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
    
    mockGenerateObject = generateObject as jest.Mock;
    mockCreateGoogleGenerativeAI = createGoogleGenerativeAI as jest.Mock;
    mockModel = jest.fn();
    
    // Setup the mock chain: createGoogleGenerativeAI returns a function that returns the model
    mockCreateGoogleGenerativeAI.mockReturnValue(() => mockModel);
    
    await storageService.clearAll();
    await cacheService.clear();
    
    // Clear all mocks
    mockGenerateObject.mockClear();
    mockCreateGoogleGenerativeAI.mockClear();
    mockModel.mockClear();
  });

  afterAll(async () => {
    await closeDB();
  });

  it('should handle the full workflow: set key -> analyze (API) -> analyze (cache)', async () => {
    const keyword = 'synergy';
    const language = 'en';
    const apiKey = 'test-api-key';
    
    // Mock the AI SDK response
    const mockAIResponse = {
      object: {
        definition: 'The combined power of a group of things when they are working together that is greater than the total power achieved by each working separately.',
        culturalContext: 'A business term often used to describe collaborative benefits.',
        confidence: 0.9,
      }
    };
    
    // Set up API key
    await storageService.setApiKey(apiKey);
    const retrievedKey = await storageService.getApiKey();
    expect(retrievedKey).toBe(apiKey);

    // Mock the generateObject function
    mockGenerateObject.mockResolvedValue(mockAIResponse);
    
    // Create a test instance of ApiService with real dependencies
    const testApiService = new ApiServiceClass(storageService, cacheService);
    
    // First call - should hit the API
    const result1 = await testApiService.analyzeKeyword(keyword, language);
    
    // Verify the AI SDK was called correctly
    expect(mockCreateGoogleGenerativeAI).toHaveBeenCalledWith({ apiKey });
    expect(mockGenerateObject).toHaveBeenCalledTimes(1);
    expect(mockGenerateObject).toHaveBeenCalledWith(expect.objectContaining({
      model: expect.anything(),
      schema: expect.anything(),
      system: expect.stringContaining('professional vocabulary analyst'),
      prompt: expect.stringContaining(keyword),
      temperature: 0.3,
    }));
    
    expect(result1.definition).toContain('combined power');
    expect(result1.language).toBe(language);
    expect(result1.timestamp).toBeGreaterThan(0);

    // Verify result was cached
    const cachedItem = await cacheService.get(`insight:${keyword}:${language}:gemini-1.5-flash`);
    expect(cachedItem).not.toBeNull();
    expect((cachedItem as InsightResponse).definition).toEqual(result1.definition);

    // Second call - should hit the cache
    const result2 = await testApiService.analyzeKeyword(keyword, language);

    // Verify no additional API calls were made
    expect(mockGenerateObject).toHaveBeenCalledTimes(1);
    expect(result2).toEqual(result1);
  });
  
  it('should fail validation if API key is not set', async () => {
    const key = await storageService.getApiKey();
    expect(key).toBeNull();
    
    const testApiService = new ApiServiceClass(storageService, cacheService);
    
    await expect(testApiService.analyzeKeyword('test', 'en')).rejects.toMatchObject({
      type: 'validation',
      message: '未设置API密钥'
    });
    
    expect(mockGenerateObject).not.toHaveBeenCalled();
    expect(mockCreateGoogleGenerativeAI).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    const keyword = 'test';
    const language = 'en';
    const apiKey = 'invalid-api-key';
    
    await storageService.setApiKey(apiKey);
    
    // Mock an API error
    mockGenerateObject.mockRejectedValue(new Error('API key not valid'));
    
    const testApiService = new ApiServiceClass(storageService, cacheService);
    
    await expect(testApiService.analyzeKeyword(keyword, language)).rejects.toMatchObject({
      type: 'validation',
      message: 'API密钥无效或已过期'
    });
    
    expect(mockCreateGoogleGenerativeAI).toHaveBeenCalledWith({ apiKey });
    expect(mockGenerateObject).toHaveBeenCalledTimes(1);
  });
}); 