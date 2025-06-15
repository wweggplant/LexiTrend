/**
 * Jest 全局设置文件
 * 
 * 在所有测试运行前执行，用于配置和初始化测试环境。
 * 主要用于模拟浏览器API、扩展API等全局依赖。
 */

// 模拟 IndexedDB
import 'fake-indexeddb/auto';

// Mock for chrome.storage.local
const mockChromeStorage = () => {
  let store: { [key: string]: any } = {};

  return {
    get: jest.fn((keys, callback) => {
      const result: { [key: string]: any } = {};
      if (keys === null) {
        callback(store);
        return;
      }
      const keyList = Array.isArray(keys) ? keys : [keys];
      keyList.forEach(key => {
        if (store[key] !== undefined) {
          result[key] = store[key];
        }
      });
      if (callback) {
        callback(result);
      }
      return Promise.resolve(result);
    }),
    set: jest.fn((items, callback) => {
      store = { ...store, ...items };
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    remove: jest.fn((keys, callback) => {
      const keyList = Array.isArray(keys) ? keys : [keys];
      keyList.forEach(key => {
        delete store[key];
      });
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    clear: jest.fn(callback => {
      store = {};
      if (callback) {
        callback();
      }
      return Promise.resolve();
    }),
    // Helper to view the store for debugging tests
    _getStore: () => store,
  };
};

// We need to handle both `chrome` and `browser` objects
if (typeof global.chrome === 'undefined') {
  (global as any).chrome = {};
}
if (typeof (global as any).chrome.storage === 'undefined') {
  (global as any).chrome.storage = {};
}
(global as any).chrome.storage.local = mockChromeStorage();

if (typeof global.browser === 'undefined') {
    (global as any).browser = {};
}
if (typeof (global as any).browser.storage === 'undefined') {
    (global as any).browser.storage = {};
}
(global as any).browser.storage.local = (global as any).chrome.storage.local;

// Mock for i18n
if (typeof (global as any).chrome.i18n === 'undefined') {
    (global as any).chrome.i18n = {};
}
(global as any).chrome.i18n.getUILanguage = jest.fn(() => 'en');
(global as any).chrome.i18n.getMessage = jest.fn((key, substitutions) => {
    if (substitutions) {
        return `${key}_${substitutions.join('_')}`;
    }
    return key;
});

// Mock other chrome APIs if needed
if (typeof global.chrome.runtime === 'undefined') {
    global.chrome.runtime = {
        id: 'test-extension-id',
        lastError: undefined,
        onMessage: {
            addListener: jest.fn(),
            removeListener: jest.fn(),
            hasListener: jest.fn(),
        },
        sendMessage: jest.fn(),
    } as any;
}

// 模拟 atob 和 btoa
// @ts-ignore
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
// @ts-ignore
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64'); 