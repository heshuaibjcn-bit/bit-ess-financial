/**
 * Platform Services - 平台通用服务
 *
 * 提供整个应用可复用的 AI 服务：
 * - AI 客户端（支持多个 LLM 提供者）
 * - 智能体基类（统一智能体开发）
 * - 缓存管理（性能优化）
 * - 服务注册（依赖注入）
 */

// 核心服务
export {
  AIClient,
  GLMProvider,
  RateLimiter,
  getAIClient
} from './PlatformServices';

export {
  CacheManager,
  ServiceRegistry,
  PlatformServiceFactory,
  getCache,
  getServiceRegistry,
  resetPlatformServices,
  getPlatformHealth
} from './PlatformServices';

// 智能体基类
export {
  AgentBase,
  AgentRegistry,
  InputValidator,
  AgentConfig,
  AgentExecutionResult,
  getAgentRegistry
} from './AgentBase';

// 类型导出
export type {
  LLMProvider
} from './PlatformServices';

export type {
  CacheEntry
} from './PlatformServices';

export type {
  AgentConfig,
  AgentExecutionResult,
  InputValidator
} from './AgentBase';
