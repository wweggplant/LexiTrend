import { StorageService } from '../storage';

// 模拟 chrome API
const mockChrome = global.chrome as any;

describe('StorageService', () => {
  let storageService: StorageService;
  let mockStorage: { [key: string]: any };

  beforeEach(() => {
    // 每次测试前重置模拟存储
    mockStorage = {};
    mockChrome.storage.local.get.mockImplementation(
        (keys: string | string[] | null, callback: (items: { [key: string]: any }) => void) => {
            const result: { [key: string]: any } = {};
            if (keys === null) {
                Object.assign(result, mockStorage);
            } else {
                const keyList = Array.isArray(keys) ? keys : [keys];
                keyList.forEach(key => {
                    // 确保即使键不存在也不会设置 "undefined"
                    if (key in mockStorage) {
                        result[key] = mockStorage[key];
                    }
                });
            }
            if (callback) callback(result);
            return Promise.resolve(result);
        }
    );
    mockChrome.storage.local.set.mockImplementation(
        (items: { [key: string]: any }, callback?: () => void) => {
            Object.assign(mockStorage, items);
            if (callback) callback();
            return Promise.resolve();
        }
    );
    mockChrome.storage.local.remove.mockImplementation((keys: string | string[], callback?: () => void) => {
        const keyList = typeof keys === 'string' ? [keys] : keys;
        keyList.forEach(key => {
            delete mockStorage[key];
        });
        if(callback) callback();
        return Promise.resolve();
    });
    
    storageService = StorageService.getInstance();
  });

  afterEach(() => {
    // 重置单例，确保测试隔离
    (StorageService as any).instance = null;
    jest.clearAllMocks();
  });

  it('应该能够设置和获取 API key', async () => {
    const apiKey = 'test-api-key';
    await storageService.setApiKey(apiKey);
    const retrievedKey = await storageService.getApiKey();
    expect(retrievedKey).toBe(apiKey);
  });

  it('获取不存在的 API key 时应返回 null', async () => {
    const retrievedKey = await storageService.getApiKey();
    expect(retrievedKey).toBeNull();
  });

  it('设置的 API key 应该是经过加密的', async () => {
    const apiKey = 'unencrypted-key';
    await storageService.setApiKey(apiKey);
    const storedValue = mockStorage['lexitrend_api_key'];
    expect(storedValue).not.toBe(apiKey);
    expect(storedValue).toBe(btoa(apiKey));
  });

  it('获取的 API key 应该是解密后的', async () => {
    const apiKey = 'another-key';
    const encryptedKey = btoa(apiKey);
    mockStorage['lexitrend_api_key'] = encryptedKey;
    
    const retrievedKey = await storageService.getApiKey();
    expect(retrievedKey).toBe(apiKey);
  });
  
  it('设置空的 API key 时应该抛出验证错误', async () => {
    await expect(storageService.setApiKey('')).rejects.toMatchObject({
        type: 'validation'
    });
  });

  it('应该能正确设置和获取用户设置', async () => {
      const settings = { language: 'en', cacheEnabled: false, maxCacheSize: 500, cacheTTL: 3600 };
      await storageService.updateSettings(settings);
      const retrievedSettings = await storageService.getSettings();
      expect(retrievedSettings).toEqual(expect.objectContaining(settings));
  });

  it('应该能正确设置和获取 onboarding 状态', async () => {
    // 初始状态应该是 false
    const initialStatus = await storageService.isOnboardingComplete();
    expect(initialStatus).toBe(false);

    // 设置为 true
    await storageService.setOnboardingComplete(true);
    const updatedStatus = await storageService.isOnboardingComplete();
    expect(updatedStatus).toBe(true);

    // 设置为 false
    await storageService.setOnboardingComplete(false);
    const finalStatus = await storageService.isOnboardingComplete();
    expect(finalStatus).toBe(false);
  });

  it('应该能正确设置和获取语言设置', async () => {
    // 默认语言应该是 'en'
    const defaultLanguage = await storageService.getLanguage();
    expect(defaultLanguage).toBe('en');

    // 设置中文
    await storageService.setLanguage('zh');
    const chineseLanguage = await storageService.getLanguage();
    expect(chineseLanguage).toBe('zh');

    // 设置回英文
    await storageService.setLanguage('en');
    const englishLanguage = await storageService.getLanguage();
    expect(englishLanguage).toBe('en');
  });

  it('应该能清空所有存储数据', async () => {
    // 设置一些数据
    await storageService.setApiKey('test-key');
    await storageService.setLanguage('zh');
    await storageService.setOnboardingComplete(true);

    // 验证数据存在
    expect(await storageService.getApiKey()).toBe('test-key');
    expect(await storageService.getLanguage()).toBe('zh');
    expect(await storageService.isOnboardingComplete()).toBe(true);

    // 清空所有数据
    await storageService.clearAll();

    // 验证数据已清空
    expect(await storageService.getApiKey()).toBeNull();
    expect(await storageService.getLanguage()).toBe('en'); // 应该回到默认值
    expect(await storageService.isOnboardingComplete()).toBe(false); // 应该回到默认值
  });
}); 