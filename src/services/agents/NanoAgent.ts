/**
 * NanoAgent - Lightweight AI Agent Framework
 *
 * Based on NanoClaw design principles:
 * - Lightweight (< 500 lines per agent)
 * - Local-first (data stored in browser)
 * - Secure (API keys managed locally)
 * - Modular (each agent independent)
 * - Transparent (show agent reasoning)
 *
 * Now powered by GLM-5-Turbo (智谱AI)
 */

import { getCommunicationLogger } from './AgentCommunicationLogger';

/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean; // Add random jitter to prevent thundering herd
  retryableErrors: Array<string | RegExp>; // Error patterns that are retryable
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  jitter: true,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    /5\d\d/, // 5xx server errors
    /timeout/i,
    /network/i,
    /connection/i
  ]
};

/**
 * GLM Client for智谱AI API
 */
class GLMClient {
  private apiKey: string;
  private baseURL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
  private agentType: string;
  private agentName: string;
  private retryConfig: RetryConfig;

  constructor(apiKey: string, agentType: string, agentName: string, retryConfig?: Partial<RetryConfig>) {
    this.apiKey = apiKey;
    this.agentType = agentType;
    this.agentName = agentName;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();

    return this.retryConfig.retryableErrors.some(pattern => {
      if (typeof pattern === 'string') {
        return errorMessage.includes(pattern.toLowerCase());
      }
      if (pattern instanceof RegExp) {
        return pattern.test(error.message);
      }
      return false;
    });
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
      this.retryConfig.maxDelay
    );

    if (this.retryConfig.jitter) {
      // Add ±25% random jitter to prevent thundering herd
      const jitterFactor = 0.75 + Math.random() * 0.5; // 0.75 to 1.25
      return Math.round(exponentialDelay * jitterFactor);
    }

    return exponentialDelay;
  }

  /**
   * Sleep for specified milliseconds
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute API call with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    requestId: string
  ): Promise<T> {
    const logger = getCommunicationLogger();
    let lastError: Error;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!(error instanceof Error) || !this.isRetryableError(error)) {
          // Not retryable, throw immediately
          throw error;
        }

        // Check if we have more retries available
        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.calculateDelay(attempt);

          logger.logError({
            agentType: this.agentType,
            agentName: this.agentName,
            model: 'glm-4-turbo',
            error: `Retry ${attempt + 1}/${this.retryConfig.maxRetries} after ${delay}ms: ${error.message}`,
            requestId,
          });

          console.warn(
            `[${this.agentName}] API call failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries}), ` +
            `retrying in ${delay}ms: ${error.message}`
          );

          await this.sleep(delay);
        } else {
          // Max retries reached
          logger.logError({
            agentType: this.agentType,
            agentName: this.agentName,
            model: 'glm-4-turbo',
            error: `Max retries (${this.retryConfig.maxRetries}) reached: ${error.message}`,
            requestId,
          });

          console.error(
            `[${this.agentName}] API call failed after ${this.retryConfig.maxRetries} retries: ${error.message}`
          );

          throw new Error(
            `GLM API call failed after ${this.retryConfig.maxRetries} retries: ${error.message}`
          );
        }
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError;
  }

  async messagesCreate(params: {
    model: string;
    max_tokens: number;
    system: string;
    messages: Array<{ role: string; content: string }>;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
    const logger = getCommunicationLogger();
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // 记录请求
    const prompt = params.messages.map(m => `${m.role}: ${m.content}`).join('\n');
    logger.logRequest({
      agentType: this.agentType,
      agentName: this.agentName,
      model: params.model,
      prompt: `${params.system}\n\n${prompt}`,
      requestId,
      metadata: {
        retryConfig: this.retryConfig
      }
    });

    // Execute with retry logic
    const result = await this.executeWithRetry(async () => {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: params.model,
          messages: [
            { role: 'system', content: params.system },
            ...params.messages,
          ],
          max_tokens: params.max_tokens,
          temperature: 0.3,
        }),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`GLM API error: ${response.status} - ${errorText}`);
        throw error;
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content || '';

      // 记录响应
      logger.logResponse({
        agentType: this.agentType,
        agentName: this.agentName,
        model: params.model,
        response: responseText,
        tokens: {
          input: data.usage?.prompt_tokens || 0,
          output: data.usage?.completion_tokens || 0,
          total: data.usage?.total_tokens || 0,
        },
        duration,
        requestId,
      });

      return {
        content: [
          {
            type: 'text',
            text: responseText,
          },
        ],
      };
    }, requestId);

    return result;
  }
}

}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  reasoning?: string; // Show agent's thought process
}

export interface AgentTask {
  id: string;
  type: string;
  input: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime: string;
  endTime?: string;
  messages: AgentMessage[];
}

export interface AgentConfig {
  name: string;
  description: string;
  version: string;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
}

export interface AgentCapability {
  name: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  estimatedTime: number; // in seconds
}

/**
 * Base NanoAgent Class
 */
export class NanoAgent {
  protected client: GLMClient | null = null;
  protected config: AgentConfig;

  // Rate limiting state (class-level for all agents)
  private static rateLimitState: Map<string, {
    tokens: number;
    lastReset: number;
    queue: Array<() => void>;
  }> = new Map();

  constructor(config: AgentConfig) {
    this.config = config;
    this.initializeClient();
  }

  /**
   * Initialize GLM client
   */
  protected initializeClient(): void {
    const apiKey = this.getApiKey();
    if (apiKey) {
      this.client = new GLMClient(
        apiKey,
        this.config.name,
        this.config.name
      );
    }
  }

  /**
   * Get API key from localStorage or environment
   */
  protected getApiKey(): string | undefined {
    // Try localStorage first (now for GLM API key)
    const userKey = localStorage.getItem('glm_api_key');
    if (userKey) {
      return userKey;
    }

    // Also check for old anthropic key for migration
    const oldKey = localStorage.getItem('anthropic_api_key');
    if (oldKey) {
      // Migrate to new key name
      localStorage.setItem('glm_api_key', oldKey);
      return oldKey;
    }

    // Try environment variable
    if (import.meta.env.VITE_GLM_API_KEY) {
      return import.meta.env.VITE_GLM_API_KEY;
    }

    return undefined;
  }

  /**
   * Check if agent is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Get agent capabilities
   */
  abstract getCapabilities(): AgentCapability[];

  /**
   * Execute a task
   */
  abstract execute(input: any): Promise<any>;

  /**
   * Run AI reasoning with automatic metric tracking
   */
  protected async think(prompt: string): Promise<string> {
    if (!this.client) {
      throw new Error('Agent not available - please configure API key');
    }

    const response = await this.client.messagesCreate({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      system: this.config.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }

  /**
   * Record agent success with timing (for metrics tracking)
   * Call this when an agent completes a task successfully
   */
  protected recordSuccess(duration: number, metadata?: Record<string, any>): void {
    const logger = getCommunicationLogger();
    logger.logResponse({
      agentType: this.config.name,
      agentName: this.config.name,
      model: this.config.model,
      response: 'Task completed successfully',
      tokens: { input: 0, output: 0, total: 0 }, // Will be updated by actual API call
      duration,
      metadata,
    });
  }

  /**
   * Record agent failure with timing (for metrics tracking)
   * Call this when an agent fails to complete a task
   */
  protected recordFailure(duration: number, error: Error, metadata?: Record<string, any>): void {
    const logger = getCommunicationLogger();
    logger.logError({
      agentType: this.config.name,
      agentName: this.config.name,
      model: this.config.model,
      error: error.message,
      metadata,
    });
  }

  /**
   * Execute an async function with retry logic and exponential backoff
   * Useful for API calls that might fail temporarily
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
      backoffMultiplier?: number;
      onRetry?: (attempt: number, error: Error) => void;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000, // 1 second
      maxDelay = 10000, // 10 seconds
      backoffMultiplier = 2,
      onRetry,
    } = options;

    let lastError: Error | undefined;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.log('info', `Retry attempt ${attempt}/${maxRetries}`);
        }

        const result = await fn();

        if (attempt > 0) {
          this.log('info', `Retry successful on attempt ${attempt}`);
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          this.log(
            'warn',
            `Attempt ${attempt + 1} failed: ${lastError.message}. Retrying in ${delay}ms...`
          );

          // Call retry callback if provided
          if (onRetry) {
            onRetry(attempt + 1, lastError);
          }

          // Wait before retry with exponential backoff
          await this.sleep(delay);

          // Calculate next delay with exponential backoff
          delay = Math.min(delay * backoffMultiplier, maxDelay);
        } else {
          this.log('error', `All ${maxRetries + 1} attempts failed: ${lastError.message}`);
        }
      }
    }

    throw lastError;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute with rate limiting
   * Limits the number of concurrent requests per agent type
   */
  protected async withRateLimit<T>(
    fn: () => Promise<T>,
    options: {
      maxConcurrent?: number;
      windowMs?: number;
    } = {}
  ): Promise<T> {
    const { maxConcurrent = 3, windowMs = 60000 } = options;
    const agentKey = this.config.name;

    // Get or create rate limit state for this agent type
    let state = NanoAgent.rateLimitState.get(agentKey);
    if (!state) {
      state = {
        tokens: maxConcurrent,
        lastReset: Date.now(),
        queue: [],
      };
      NanoAgent.rateLimitState.set(agentKey, state);
    }

    // Reset tokens if window has expired
    const now = Date.now();
    if (now - state.lastReset >= windowMs) {
      state.tokens = maxConcurrent;
      state.lastReset = now;

      // Process queued requests
      const queued = state.queue.splice(0, state.tokens);
      queued.forEach(resolve => resolve());
    }

    // Wait for token if rate limited
    if (state.tokens <= 0) {
      this.log('warn', `Rate limit reached for ${agentKey}, queuing request`);

      await new Promise<void>(resolve => {
        state.queue.push(resolve);
      });
    }

    // Consume token
    state.tokens--;

    try {
      // Execute the function
      return await fn();
    } finally {
      // Return token after execution
      state.tokens++;
    }
  }

  /**
   * Execute with both retry logic and rate limiting
   * Combines withRetry and withRateLimit for robust execution
   */
  protected async executeWithRetryAndRateLimit<T>(
    fn: () => Promise<T>,
    options: {
      retry?: Parameters<typeof this.withRetry>[1];
      rateLimit?: Parameters<typeof this.withRateLimit>[1];
    } = {}
  ): Promise<T> {
    return this.withRateLimit(
      () => this.withRetry(fn, options.retry),
      options.rateLimit
    );
  }

  /**
   * Get current rate limit status for all agents
   */
  static getRateLimitStatus(): Record<string, {
    available: number;
    max: number;
    queued: number;
  }> {
    const status: Record<string, any> = {};

    NanoAgent.rateLimitState.forEach((state, key) => {
      status[key] = {
        available: state.tokens,
        max: 3, // Default max concurrent
        queued: state.queue.length,
      };
    });

    return status;
  }

  /**
   * Reset rate limit state (useful for testing or recovery)
   */
  static resetRateLimits(): void {
    NanoAgent.rateLimitState.clear();
  }

  /**
   * Execute the agent's main task with retry logic
   * Wraps the execute method with automatic retries
   */
  async executeWithRetry(input: any, retryOptions?: Parameters<typeof this.withRetry>[1]): Promise<any> {
    const startTime = Date.now();

    try {
      const result = await this.withRetry(
        async () => this.execute(input),
        retryOptions
      );

      const duration = Date.now() - startTime;
      this.recordSuccess(duration, { retry: true });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordFailure(
        duration,
        error instanceof Error ? error : new Error(String(error)),
        { retry: true }
      );
      throw error;
    }
  }

  /**
   * Parse structured output from AI with robust fallback handling
   */
  protected parseJSON<T>(text: string): T | null {
    // Try multiple extraction patterns in order of specificity
    const patterns = [
      /```json\s*([\s\S]*?)\s*```/,  // Standard markdown JSON blocks
      /```\s*([\s\S]*?)\s*```/,      // Generic code blocks
      /\{[\s\S]*\}/                   // Direct JSON object (fallback)
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const jsonStr = match[1] || match[0]; // Use capture group if available, else full match
          const parsed = JSON.parse(jsonStr.trim());
          this.log('info', `Successfully parsed JSON using pattern: ${pattern}`);
          return parsed as T;
        } catch (e) {
          this.log('warn', `Pattern matched but JSON parse failed: ${e}`);
          continue; // Try next pattern
        }
      }
    }

    // Last resort: try parsing entire response as JSON
    try {
      return JSON.parse(text.trim()) as T;
    } catch {
      this.log('error', 'All JSON parsing attempts failed');
      return null;
    }
  }

  /**
   * Extract JSON from markdown with enhanced error handling
   * This provides more detailed feedback for debugging
   */
  protected extractJSONFromMarkdown(content: string): {
    success: boolean;
    data?: any;
    error?: string;
    rawMatch?: string;
  } {
    const patterns = [
      { name: 'markdown-json', regex: /```json\s*([\s\S]*?)\s*```/ },
      { name: 'markdown-code', regex: /```\s*([\s\S]*?)\s*```/ },
      { name: 'direct-json', regex: /\{[\s\S]*\}/ }
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern.regex);
      if (match) {
        try {
          const jsonStr = (match[1] || match[0]).trim();
          const data = JSON.parse(jsonStr);
          return {
            success: true,
            data,
            rawMatch: jsonStr.substring(0, 100) // First 100 chars for debugging
          };
        } catch (e) {
          return {
            success: false,
            error: `Pattern "${pattern.name}" matched but JSON parse failed: ${e}`,
            rawMatch: (match[1] || match[0]).substring(0, 100)
          };
        }
      }
    }

    return {
      success: false,
      error: 'No JSON-like patterns found in response'
    };
  }

  /**
   * Validate response structure (for report generation, etc.)
   */
  protected validateResponseStructure(data: any, requiredFields: string[]): boolean {
    if (!data || typeof data !== 'object') {
      this.log('error', 'Response is not an object');
      return false;
    }

    for (const field of requiredFields) {
      if (!data[field]) {
        this.log('error', `Missing required field: ${field}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Log agent activity
   */
  protected log(activity: string, data?: any): void {
    console.log(`[${this.config.name}] ${activity}`, data || '');
  }
}

/**
 * Agent Manager - Orchestrates multiple agents
 */
export class AgentManager {
  private agents: Map<string, NanoAgent> = new Map();
  private tasks: Map<string, AgentTask> = new Map();

  /**
   * Register an agent
   */
  registerAgent(type: string, agent: NanoAgent): void {
    this.agents.set(type, agent);
    this.log(`Agent registered: ${type}`);
  }

  /**
   * Get agent by type
   */
  getAgent(type: string): NanoAgent | undefined {
    return this.agents.get(type);
  }

  /**
   * Create a new task
   */
  createTask(type: string, input: any): AgentTask {
    const task: AgentTask = {
      id: this.generateId(),
      type,
      input,
      status: 'pending',
      messages: [],
      startTime: new Date().toISOString(),
    };

    this.tasks.set(task.id, task);
    this.log(`Task created: ${task.id} (${type})`);

    return task;
  }

  /**
   * Execute a task
   */
  async executeTask(taskId: string): Promise<AgentTask> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const agent = this.getAgent(task.type);
    if (!agent) {
      throw new Error(`Agent not found for type: ${task.type}`);
    }

    task.status = 'running';
    task.messages.push({
      role: 'system',
      content: `Starting task with ${agent.constructor.name}...`,
      timestamp: new Date().toISOString(),
    });

    try {
      const result = await agent.execute(task.input);
      task.status = 'completed';
      task.result = result;
      task.endTime = new Date().toISOString();

      task.messages.push({
        role: 'assistant',
        content: `Task completed successfully`,
        timestamp: task.endTime,
      });
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.endTime = new Date().toISOString();

      task.messages.push({
        role: 'system',
        content: `Task failed: ${task.error}`,
        timestamp: task.endTime,
      });
    }

    this.tasks.set(taskId, task);
    return task;
  }

  /**
   * Execute multiple tasks in parallel
   * All tasks must be created first using createTask()
   */
  async executeTasksParallel(taskIds: string[]): Promise<AgentTask[]> {
    this.log(`Executing ${taskIds.length} tasks in parallel`);

    const startTime = Date.now();

    // Execute all tasks in parallel
    const results = await Promise.all(
      taskIds.map(taskId => this.executeTask(taskId))
    );

    const duration = Date.now() - startTime;
    const successCount = results.filter(t => t.status === 'completed').length;

    this.log(
      `Parallel execution completed: ${successCount}/${taskIds.length} succeeded in ${duration}ms`
    );

    return results;
  }

  /**
   * Execute multiple agents in parallel with their inputs
   * Convenience method that creates tasks and executes them in parallel
   */
  async executeAgentsParallel(
    agentInputs: Array<{ type: string; input: any }>
  ): Promise<AgentTask[]> {
    this.log(`Creating and executing ${agentInputs.length} agents in parallel`);

    // Create all tasks first
    const taskIds = agentInputs.map(({ type, input }) => {
      const task = this.createTask(type, input);
      return task.id;
    });

    // Execute all tasks in parallel
    return this.executeTasksParallel(taskIds);
  }

  /**
   * Execute agents in batches with controlled concurrency
   * Useful for rate limiting or resource management
   */
  async executeAgentsBatched(
    agentInputs: Array<{ type: string; input: any }>,
    concurrency: number = 3
  ): Promise<AgentTask[]> {
    this.log(
      `Executing ${agentInputs.length} agents in batches of ${concurrency}`
    );

    const results: AgentTask[] = [];
    const startTime = Date.now();

    // Process in batches
    for (let i = 0; i < agentInputs.length; i += concurrency) {
      const batch = agentInputs.slice(i, i + concurrency);
      this.log(`Processing batch ${Math.floor(i / concurrency) + 1} (${batch.length} agents)`);

      const batchResults = await this.executeAgentsParallel(batch);
      results.push(...batchResults);
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(t => t.status === 'completed').length;

    this.log(
      `Batch execution completed: ${successCount}/${agentInputs.length} succeeded in ${duration}ms`
    );

    return results;
  }

  /**
   * Get all tasks
   */
  getAllTasks(): AgentTask[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: AgentTask['status']): AgentTask[] {
    return this.getAllTasks().filter(task => task.status === status);
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all agent capabilities
   */
  getAllCapabilities(): Map<string, AgentCapability[]> {
    const capabilities = new Map<string, AgentCapability[]>();

    this.agents.forEach((agent, type) => {
      capabilities.set(type, agent.getCapabilities());
    });

    return capabilities;
  }

  /**
   * Check system health
   */
  getSystemHealth(): {
    agentsAvailable: number;
    agentsTotal: number;
    tasksPending: number;
    tasksRunning: number;
    tasksCompleted: number;
    tasksFailed: number;
  } {
    const availableAgents = Array.from(this.agents.values()).filter(agent => agent.isAvailable()).length;

    return {
      agentsAvailable: availableAgents,
      agentsTotal: this.agents.size,
      tasksPending: this.getTasksByStatus('pending').length,
      tasksRunning: this.getTasksByStatus('running').length,
      tasksCompleted: this.getTasksByStatus('completed').length,
      tasksFailed: this.getTasksByStatus('failed').length,
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log manager activity
   */
  private log(activity: string, data?: any): void {
    console.log(`[AgentManager] ${activity}`, data || '');
  }
}

// Singleton instance
let managerInstance: AgentManager | null = null;

export function getAgentManager(): AgentManager {
  if (!managerInstance) {
    managerInstance = new AgentManager();
  }
  return managerInstance;
}
