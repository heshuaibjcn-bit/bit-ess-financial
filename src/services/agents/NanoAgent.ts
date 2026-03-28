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

/**
 * GLM Client for智谱AI API
 */
class GLMClient {
  private apiKey: string;
  private baseURL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async messagesCreate(params: {
    model: string;
    max_tokens: number;
    system: string;
    messages: Array<{ role: string; content: string }>;
  }): Promise<{ content: Array<{ type: string; text: string }> }> {
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GLM API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: data.choices[0]?.message?.content || '',
        },
      ],
    };
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
      this.client = new GLMClient(apiKey);
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
   * Run AI reasoning
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
   * Parse structured output from AI
   */
  protected parseJSON<T>(text: string): T | null {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
    } catch (error) {
      console.error('Failed to parse JSON:', error);
    }
    return null;
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
