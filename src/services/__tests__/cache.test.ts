import { cacheService } from '../cache';
import 'fake-indexeddb/auto';
import { closeDB } from '../indexedDB';

describe('Simple CacheService', () => {
  
  beforeEach(async () => {
    // 确保每个测试都从一个干净的数据库开始
    await cacheService.clear();
  });

  afterAll(async () => {
    // 关闭数据库连接
    await closeDB();
  });

  it('应该能设置和获取一个值', async () => {
    const key = 'test-key';
    const value = { data: 'some-data' };
    await cacheService.set(key, value);
    const result = await cacheService.get(key);
    expect(result).toEqual(value);
  });

  it('获取一个不存在的键时应该返回 null', async () => {
    const result = await cacheService.get('non-existent-key');
    expect(result).toBeNull();
  });

  it('应该能正确计算缓存大小', async () => {
    expect(await cacheService.size()).toBe(0);
    await cacheService.set('key1', 'value1');
    expect(await cacheService.size()).toBe(1);
    await cacheService.set('key2', 'value2');
    expect(await cacheService.size()).toBe(2);
  });

  it('设置一个已存在的键时应该覆盖旧值', async () => {
    const key = 'overwrite-key';
    await cacheService.set(key, 'initial-value');
    await cacheService.set(key, 'updated-value');
    const result = await cacheService.get(key);
    expect(result).toBe('updated-value');
    expect(await cacheService.size()).toBe(1);
  });
  
  it('应该能从缓存中删除一个值', async () => {
    const key = 'delete-key';
    await cacheService.set(key, 'value');
    expect(await cacheService.size()).toBe(1);
    
    await cacheService.remove(key);
    expect(await cacheService.get(key)).toBeNull();
    expect(await cacheService.size()).toBe(0);
  });

  it('clear 方法应该能清空整个缓存', async () => {
    await cacheService.set('key1', 'value1');
    await cacheService.set('key2', 'value2');
    expect(await cacheService.size()).toBe(2);

    await cacheService.clear();
    expect(await cacheService.size()).toBe(0);
    expect(await cacheService.get('key1')).toBeNull();
  });

  it('应该能处理不同类型的值', async () => {
    const objectValue = { a: 1, b: [2] };
    const numberValue = 123;
    const booleanValue = false;

    await cacheService.set('object', objectValue);
    await cacheService.set('number', numberValue);
    await cacheService.set('boolean', booleanValue);

    expect(await cacheService.get('object')).toEqual(objectValue);
    expect(await cacheService.get('number')).toBe(numberValue);
    expect(await cacheService.get('boolean')).toBe(booleanValue);
  });
}); 