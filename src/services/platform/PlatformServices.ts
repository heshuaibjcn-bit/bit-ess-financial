/**
 * Platform Services - 通用 AI 服务层
 *
 * 将智能体系统的核心功能抽象为平台通用服务：
 * - AIClient: 统一的 LLM API 客户端
 * - ServiceRegistry: 服务注册与发现
 * - CacheManager: 通用缓存管理
 * - RetryManager: 重试逻辑管理
 */

import { getSettingsManager } from '@/config/Settings';

/**
 * 通用 LLM 提供者接口
 */
export interface LLMProvider {
  name: string;
  baseURL: string;
  models: string[];
  validateApiKey(key: string): boolean;
  formatMessage(messages: any[]): any;
}

/**
 * GLM API 提供者实现
 */
export class GLMProvider implements LLMProvider {
  name = 'GLM';
  baseURL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  models = ['glm-4-turbo', 'glm-4', 'glm-3-turbo'];

  validateApiKey(key: string): boolean {
    return key.length >= 20;
  }

  formatMessage(messages: any[]) {
    return messages;
  }
}

/**
 * 统一的 AI 客户端
 * 支持多个 LLM 提供者，自动处理重试、速率限制等
 */
export class AIClient {
  private provider: LLMProvider;
  private apiKey: string;
  private model: string;
  private rateLimiter?: RateLimiter;

  constructor(
    provider: LLMProvider,
    apiKey: string,
    model: string,
    options?: {
      rateLimit?: { capacity: number; refillRate: number };
    }
  ) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.model = model;

    if (options?.rateLimit) {
      this.rateLimiter = new RateLimiter(
        options.rateLimit.capacity,
        options.rateLimit.refillRate
      );
    }
  }

  /**
   * 发送聊天请求
   */
  async chat(params: {
    messages: Array<{ role: string; content: string }>;
    system?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<string> {
    // 检查速率限制
    if (this.rateLimiter) {
      await this.rateLimiter.waitForAvailability(1);
    }

    const response = await fetch(this.provider.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          ...(params.system ? [{ role: 'system', content: params.system }] : []),
          ...params.messages,
        ],
        max_tokens: params.maxTokens || 4096,
        temperature: params.temperature || 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * 流式聊天（返回 AsyncGenerator）
   */
  async *chatStream(params: {
    messages: Array<{ role: string; content: string }>;
    system?: string;
  }): AsyncGenerator<string> {
    // 流式实现待完成
    const response = await this.chat(params);
    yield response;
  }

  /**
   * 批量处理多个请求
   */
  async batchChat(
    requests: Array<{
      messages: Array<{ role: string; content: string }>;
      system?: string;
    }>
  ): Promise<string[]> {
    return Promise.all(
      requests.map(req => this.chat(req))
    );
  }

  /**
   * 获取客户端状态
   */
  getStatus() {
    return {
      provider: this.provider.name,
      model: this.model,
      rateLimit: this.rateLimiter?.getStats(),
      configured: !!this.apiKey
    };
  }
}

/**
 * 速率限制器
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;

    if (elapsed >= 1000) {
      const refillAmount = Math.floor(elapsed / 1000) * this.refillRate;
      this.tokens = Math.min(this.capacity, this.tokens + refillAmount);
      this.lastRefill = now;
    }
  }

  async waitForAvailability(tokens = 1): Promise<void> {
    while (!this.tryConsume(tokens)) {
      const waitTime = Math.ceil((tokens - this.tokens) / this.refillRate * 1000);
      await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 5000)));
    }
  }

  tryConsume(tokens = 1): boolean {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  getStats() {
    this.refill();
    return {
      capacity: this.capacity,
      available: this.tokens,
      used: this.capacity - this.tokens,
      utilizationPercent: ((this.capacity - this.tokens) / this.capacity) * 100,
      refillRate: this.refillRate
    };
  }
}

/**
 * 通用缓存管理器
 */
export class CacheManager<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTTL: number;
  private maxSize: number;

  constructor(defaultTTL = 3600000, maxSize = 100) {
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
  }

  set(key: string, value: T, ttl?: number): void {
    this.evictIfNeeded();

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        ...entry,
        expired: this.isExpired(entry)
      }))
    };
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictIfNeeded(): void {
    if (this.cache.size >= this.maxSize) {
      // LRU: 删除最少使用的条目
      let minHits = Infinity;
      let lruKey: string | null = null;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.hits < minHits) {
          minHits = entry.hits;
          lruKey = key;
        }
      }

      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }
  }

  private calculateHitRate(): number {
    let totalHits = 0;
    let totalRequests = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalRequests += entry.hits + 1; // hits + initial miss
    }

    return totalRequests > 0 ? totalHits / totalRequests : 0;
  }
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

/**
 * 服务注册表
 * 用于注册和发现平台中的各种服务
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  register(name: string, service: any): void {
    this.services.set(name, service);
    console.log(`[ServiceRegistry] Registered: ${name}`);
  }

  get<T = any>(name: string): T | null {
    return this.services.get(name) || null;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  list(): string[] {
    return Array.from(this.services.keys());
  }

  unregister(name: string): boolean {
    return this.services.delete(name);
  }
}

/**
 * 平台服务工厂
 * 创建和配置平台通用服务
 */
export class PlatformServiceFactory {
  private static aiClient: AIClient | null = null;
  private static cache: CacheManager<any> | null = null;

  /**
   * 获取 AI 客户端实例
   */
  static getAIClient(): AIClient {
    if (!this.aiClient) {
      const settings = getSettingsManager();
      const glmSettings = settings.getSetting('glm');
      const agentSettings = settings.getSetting('agents');

      if (!settings.isGLMConfigured()) {
        throw new Error('AI API not configured. Please configure API key in settings.');
      }

      const provider = new GLMProvider();
      this.aiClient = new AIClient(
        provider,
        glmSettings.apiKey,
        glmSettings.model,
        {
          rateLimit: agentSettings.rateLimit.enabled ? {
            capacity: agentSettings.rateLimit.capacity,
            refillRate: agentSettings.rateLimit.refillRate
          } : undefined
        }
      );

      // 注册到服务注册表
      ServiceRegistry.getInstance().register('ai-client', this.aiClient);
    }

    return this.aiClient;
  }

  /**
   * 获取缓存管理器实例
   */
  static getCache<T>(ttl = 3600000, maxSize = 100): CacheManager<T> {
    if (!this.cache) {
      this.cache = new CacheManager<T>(ttl, maxSize);
      ServiceRegistry.getInstance().register('cache', this.cache);
    }

    return this.cache as CacheManager<T>;
  }

  /**
   * 重置所有服务（用于配置更新后）
   */
  static reset(): void {
    this.aiClient = null;
    this.cache = null;

    const registry = ServiceRegistry.getInstance();
    registry.unregister('ai-client');
    registry.unregister('cache');
  }

  /**
   * 获取服务健康状态
   */
  static getHealthStatus() {
    const registry = ServiceRegistry.getInstance();

    return {
      services: registry.list(),
      aiClient: this.aiClient?.getStatus() || null,
      cache: this.cache?.getStats() || null,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 导出便捷函数
 */
export function getAIClient(): AIClient {
  return PlatformServiceFactory.getAIClient();
}

export function getCache<T>(ttl?: number, maxSize?: number): CacheManager<T> {
  return PlatformServiceFactory.getCache<T>(ttl, maxSize);
}

export function getServiceRegistry(): ServiceRegistry {
  return ServiceRegistry.getInstance();
}

export function resetPlatformServices(): void {
  PlatformServiceFactory.reset();
}

export function getPlatformHealth() {
  return PlatformServiceFactory.getHealthStatus();
}
