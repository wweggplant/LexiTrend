/**
 * 服务层统一导出
 *
 * 这个文件作为服务层的公共入口，统一导出所有服务模块和相关类型。
 * 这样做的好处是：
 * 1. 应用层可以从一个地方导入所有服务，简化了代码。
 * 2. 方便在未来进行依赖注入或服务替换。
 * 3. 有利于代码的组织和维护。
 */

import { ApiService } from './api';
import { CacheService } from './cache';
import { StorageService } from './storage';

// 异步实例化服务
const apiServicePromise = ApiService.getInstance();
const storageService = StorageService.getInstance();
const cacheService = CacheService.getInstance();

// 导出Promise和服务实例，以便应用层可以根据需要处理
export {
  apiServicePromise as apiService,
  storageService,
  cacheService
};

// 导出服务相关的类型定义，供类型检查和组件属性定义使用
export type { IApiService } from './api';
export type { IStorageService, UserSettings } from './storage';
export type { CacheService as ICacheService } from './cache';

// 默认导出一个包含所有服务实例的对象，方便整体注入或访问
const services = {
  api: apiServicePromise,
  cache: cacheService,
  storage: storageService,
};

export default services; 