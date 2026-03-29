/**
 * AgentBase - 通用智能体基类
 *
 * 提供所有智能体的通用功能：
 * - 标准 execute 方法
 * - 输入验证
 * - 结果缓存
 * - 错误处理
 * - 日志记录
 */

import { getAIClient, getCache } from './PlatformServices';
import { getCommunicationLogger } from '../agents/AgentCommunicationLogger';

/**
 * 智能体输入验证接口
 */
export interface InputValidator<T> {
  validate(input: T): { valid: boolean; errors: string[] };
}

/**
 * 智能体配置接口
 */
export interface AgentConfig {
  name: string;
  version: string;
  description: string;
  category: string;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

/**
 * 智能体执行结果
 */
export interface AgentExecutionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  executionTime: number;
  cached: boolean;
  timestamp: string;
}

/**
 * 通用智能体基类
 */
export abstract class AgentBase<TInput, TOutput> {
  protected config: AgentConfig;
  protected cache: ReturnType<typeof getCache<TOutput>>;

  constructor(config: AgentConfig) {
    this.config = {
      cacheEnabled: true,
      cacheTTL: 3600000, // 1 hour
      ...config
    };

    if (this.config.cacheEnabled) {
      this.cache = getCache<TOutput>(this.config.cacheTTL);
    }
  }

  /**
   * 执行智能体任务
   * 自动处理缓存、验证、错误等
   */
  async execute(input: TInput): Promise<AgentExecutionResult<TOutput>> {
    const startTime = Date.now();
    const logger = getCommunicationLogger();

    try {
      // 1. 验证输入
      const validation = this.validateInput(input);
      if (!validation.valid) {
        throw new Error(`Input validation failed: ${validation.errors.join(', ')}`);
      }

      // 2. 检查缓存
      const cacheKey = this.generateCacheKey(input);
      if (this.config.cacheEnabled && this.cache?.has(cacheKey)) {
        const cached = this.cache!.get(cacheKey)!;

        logger.logResponse({
          agentType: this.config.name,
          agentName: this.config.name,
          model: 'cached',
          response: JSON.stringify(cached),
          tokens: { input: 0, output: 0, total: 0 },
          duration: Date.now() - startTime,
          requestId: `cache-${Date.now()}`
        });

        return {
          success: true,
          data: cached,
          executionTime: Date.now() - startTime,
          cached: true,
          timestamp: new Date().toISOString()
        };
      }

      // 3. 记录请求
      logger.logRequest({
        agentType: this.config.name,
        agentName: this.config.name,
        model: 'glm',
        prompt: JSON.stringify(input),
        requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

      // 4. 执行核心逻辑
      const result = await this.process(input);

      // 5. 缓存结果
      if (this.config.cacheEnabled && this.cache) {
        this.cache.set(cacheKey, result);
      }

      // 6. 记录响应
      logger.logResponse({
        agentType: this.config.name,
        agentName: this.config.name,
        model: 'glm',
        response: JSON.stringify(result),
        tokens: { input: 0, output: 0, total: 0 },
        duration: Date.now() - startTime,
        requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
        cached: false,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      // 记录错误
      logger.logError({
        agentType: this.config.name,
        agentName: this.config.name,
        model: 'glm',
        error: error instanceof Error ? error.message : String(error),
        requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
        cached: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 批量执行
   */
  async executeBatch(inputs: TInput[]): Promise<AgentExecutionResult<TOutput>[]> {
    return Promise.all(
      inputs.map(input => this.execute(input))
    );
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    if (this.cache) {
      this.cache.clear();
    }
  }

  /**
   * 获取智能体状态
   */
  getStatus() {
    return {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      category: this.config.category,
      cacheEnabled: this.config.cacheEnabled,
      cacheStats: this.cache?.getStats() || null
    };
  }

  /**
   * 抽象方法：输入验证
   */
  protected abstract validateInput(input: TInput): { valid: boolean; errors: string[] };

  /**
   * 抽象方法：核心处理逻辑
   */
  protected abstract process(input: TInput): Promise<TOutput>;

  /**
   * 生成缓存键
   */
  protected generateCacheKey(input: TInput): string {
    return `${this.config.name}-${JSON.stringify(input)}`;
  }

  /**
   * 辅助方法：调用 AI
   */
  protected async callAI(params: {
    messages: Array<{ role: string; content: string }>;
    system?: string;
    maxTokens?: number;
  }): Promise<string> {
    const client = getAIClient();
    return client.chat(params);
  }

  /**
   * 辅助方法：解析 AI 响应
   */
  protected parseJSONResponse(response: string): any {
    try {
      // 尝试直接解析
      return JSON.parse(response);
    } catch {
      // 尝试提取 JSON 代码块
      const patterns = [
        /```json\s*([\s\S]*?)\s*```/,
        /```\s*([\s\S]*?)\s*```/,
        /\{[\s\S]*\}/
      ];

      for (const pattern of patterns) {
        const match = response.match(pattern);
        if (match) {
          try {
            const jsonStr = match[1] || match[0];
            return JSON.parse(jsonStr);
          } catch {
            continue;
          }
        }
      }

      throw new Error('Failed to parse JSON from AI response');
    }
  }

  /**
   * 辅助方法：创建提示词
   */
  protected createPrompt(template: string, variables: Record<string, any>): string {
    let prompt = template;

    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        String(value)
      );
    }

    return prompt;
  }
}

/**
 * 智能体注册表
 */
export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, AgentBase<any, any>> = new Map();

  private constructor() {}

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  register(agent: AgentBase<any, any>): void {
    const status = agent.getStatus();
    this.agents.set(status.name, agent);
    console.log(`[AgentRegistry] Registered agent: ${status.name} (${status.category})`);
  }

  get(name: string): AgentBase<any, any> | null {
    return this.agents.get(name) || null;
  }

  list(): string[] {
    return Array.from(this.agents.keys());
  }

  listByCategory(category: string): string[] {
    return Array.from(this.agents.entries())
      .filter(([_, agent]) => agent.getStatus().category === category)
      .map(([name]) => name);
  }

  getAllStatus() {
    return Array.from(this.agents.values()).map(agent => agent.getStatus());
  }
}

/**
 * 导出便捷函数
 */
export function getAgentRegistry(): AgentRegistry {
  return AgentRegistry.getInstance();
}
