/**
 * CacheService - 高性能缓存服务
 * 基于 IndexedDB 实现，支持 TTL 和 LRU 策略
 */

import { dbPromise } from './indexedDB';
import { retryWithBackoff, ErrorType } from '../types/errors';

const STORE_NAME = 'lexitrend-cache';

export interface CacheEntry<T> {
  key: string;
  value: T;
  // TTL and lastAccessed are no longer needed
}

/**
 * 一个简化的、基于 IndexedDB 的缓存服务。
 * 不再实现 TTL 或 LRU 淘汰策略。
 */
class CacheService {
  private static instance: CacheService;

  private constructor() {}

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * 从缓存中获取一个值。
   */
  async get<T>(key: string): Promise<T | null> {
    return retryWithBackoff(async () => {
      const db = await dbPromise;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const entry = await this.promisifyRequest<CacheEntry<T> | undefined>(store.get(key));
      return entry ? entry.value : null;
    }, ErrorType.CACHE_ERROR);
  }

  /**
   * 向缓存中设置一个值。
   */
  async set<T>(key: string, value: T): Promise<void> {
    return retryWithBackoff(async () => {
      const db = await dbPromise;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const entry: CacheEntry<T> = { key, value };
      await this.promisifyRequest(store.put(entry));
    }, ErrorType.CACHE_ERROR);
  }

  /**
   * 从缓存中移除一个值。
   */
  async remove(key: string): Promise<void> {
    return retryWithBackoff(async () => {
      const db = await dbPromise;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      await this.promisifyRequest(store.delete(key));
    }, ErrorType.CACHE_ERROR);
  }

  /**
   * 清空整个缓存。
   */
  async clear(): Promise<void> {
    return retryWithBackoff(async () => {
      const db = await dbPromise;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      await this.promisifyRequest(store.clear());
    }, ErrorType.CACHE_ERROR);
  }
  
  /**
   * 获取当前缓存的大小。
   */
  async size(): Promise<number> {
    return retryWithBackoff(async () => {
        const db = await dbPromise;
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        return await this.promisifyRequest(store.count());
    }, ErrorType.CACHE_ERROR);
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async waitForTransaction(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
  }
}

export const cacheService = CacheService.getInstance();
// Export the class for type hinting and testing
export { CacheService }; 