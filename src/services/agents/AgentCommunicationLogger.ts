/**
 * Agent Communication Logger - 记录所有智能体与大模型的通信
 *
 * 功能：
 * - 记录所有API请求和响应
 * - 存储通信元数据
 * - 提供查询和过滤功能
 * - 支持实时通信监控
 */

export interface CommunicationLog {
  id: string;
  timestamp: string;
  agentType: string;
  agentName: string;
  direction: 'request' | 'response' | 'error';
  model: string;
  tokens?: {
    input?: number;
    output?: number;
    total?: number;
  };
  duration?: number; // ms
  status: number;
  success: boolean;
  requestId?: string;
  prompt?: string;
  response?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Per-agent metrics for performance tracking
 */
export interface AgentMetrics {
  agentName: string;
  totalCalls: number;
  successCount: number;
  failureCount: number;
  successRate: number; // percentage
  averageLatency: number; // ms
  totalTokens: number;
  lastCallTime: string;
  lastError?: string;
}

class AgentCommunicationLogger {
  private logs: CommunicationLog[] = [];
  private listeners: Set<(logs: CommunicationLog[]) => void> = new Set();
  private maxLogs = 1000; // 最多保存1000条日志
  private readonly STORAGE_KEY = 'agent_communication_logs';

  constructor() {
    // Load logs from localStorage on initialization
    this.loadFromStorage();
  }

  /**
   * Load logs from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load logs from storage:', error);
      this.logs = [];
    }
  }

  /**
   * Save logs to localStorage
   */
  private saveToStorage(): void {
    try {
      // Keep only last maxLogs entries
      const toStore = this.logs.slice(-this.maxLogs);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.warn('Failed to save logs to storage:', error);
    }
  }

  /**
   * 记录API请求
   */
  logRequest(params: {
    agentType: string;
    agentName: string;
    model: string;
    prompt: string;
    requestId?: string;
    metadata?: Record<string, any>;
  }): CommunicationLog {
    const log: CommunicationLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      agentType: params.agentType,
      agentName: params.agentName,
      direction: 'request',
      model: params.model,
      prompt: params.prompt,
      requestId: params.requestId,
      status: 0,
      success: false,
      metadata: params.metadata,
    };

    this.addLog(log);
    return log;
  }

  /**
   * 记录API响应
   */
  logResponse(params: {
    agentType: string;
    agentName: string;
    model: string;
    response: string;
    tokens: {
      input: number;
      output: number;
      total: number;
    };
    duration: number;
    requestId?: string;
    metadata?: Record<string, any>;
  }): CommunicationLog {
    const log: CommunicationLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      agentType: params.agentType,
      agentName: params.agentName,
      direction: 'response',
      model: params.model,
      tokens: params.tokens,
      duration: params.duration,
      response: params.response,
      requestId: params.requestId,
      status: 200,
      success: true,
      metadata: params.metadata,
    };

    this.addLog(log);
    return log;
  }

  /**
   * 记录API错误
   */
  logError(params: {
    agentType: string;
    agentName: string;
    model: string;
    error: string;
    requestId?: string;
    metadata?: Record<string, any>;
  }): CommunicationLog {
    const log: CommunicationLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      agentType: params.agentType,
      agentName: params.agentName,
      direction: 'error',
      model: params.model,
      error: params.error,
      requestId: params.requestId,
      status: 500,
      success: false,
      metadata: params.metadata,
    };

    this.addLog(log);
    return log;
  }

  /**
   * 添加日志并通知监听器
   */
  private addLog(log: CommunicationLog) {
    this.logs.unshift(log);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Save to localStorage for cross-context sharing
    this.saveToStorage();

    // 通知监听器
    this.notifyListeners();
  }

  /**
   * 获取所有日志
   */
  getLogs(filters?: {
    agentType?: string;
    direction?: 'request' | 'response' | 'error';
    model?: string;
    startTime?: string;
    endTime?: string;
  }): CommunicationLog[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.agentType) {
        filteredLogs = filteredLogs.filter(log => log.agentType === filters.agentType);
      }
      if (filters.direction) {
        filteredLogs = filteredLogs.filter(log => log.direction === filters.direction);
      }
      if (filters.model) {
        filteredLogs = filteredLogs.filter(log => log.model === filters.model);
      }
      if (filters.startTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startTime);
      }
      if (filters.endTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endTime);
      }
    }

    return filteredLogs;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const totalRequests = this.logs.filter(log => log.direction === 'request').length;
    const totalResponses = this.logs.filter(log => log.direction === 'response').length;
    const totalErrors = this.logs.filter(log => log.direction === 'error').length;
    const successRate = totalRequests > 0 ? (totalResponses / totalRequests) * 100 : 0;

    const totalTokens = this.logs
      .filter(log => log.direction === 'response')
      .reduce((sum, log) => sum + (log.tokens?.total || 0), 0);

    const avgDuration = this.logs
      .filter(log => log.direction === 'response' && log.duration)
      .reduce((sum, log) => sum + (log.duration || 0), 0) / totalResponses || 0;

    const agentTypes = [...new Set(this.logs.map(log => log.agentType))];
    const agentStats = agentTypes.map(type => {
      const agentLogs = this.logs.filter(log => log.agentType === type);
      const requests = agentLogs.filter(log => log.direction === 'request').length;
      const responses = agentLogs.filter(log => log.direction === 'response').length;
      const errors = agentLogs.filter(log => log.direction === 'error').length;
      const agentTokens = agentLogs
        .filter(log => log.direction === 'response')
        .reduce((sum, log) => sum + (log.tokens?.total || 0), 0);

      return {
        agentType: type,
        requests,
        responses,
        errors,
        successRate: requests > 0 ? (responses / requests) * 100 : 0,
        totalTokens: agentTokens,
      };
    });

    return {
      totalRequests,
      totalResponses,
      totalErrors,
      successRate: successRate.toFixed(1) + '%',
      totalTokens,
      avgDuration: avgDuration.toFixed(0) + 'ms',
      agentStats,
    };
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
    localStorage.removeItem(this.STORAGE_KEY);
    this.notifyListeners();
  }

  /**
   * 订阅日志更新
   */
  subscribe(listener: (logs: CommunicationLog[]) => void) {
    this.listeners.add(listener);
    // 立即返回当前日志
    listener(this.logs);

    // 返回取消订阅函数
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.logs));
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 导出日志为JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * 导出日志为CSV
   */
  exportLogsAsCSV(): string {
    const headers = ['ID', 'Timestamp', 'Agent Type', 'Agent Name', 'Direction', 'Model', 'Tokens', 'Duration', 'Status', 'Success'];
    const rows = this.logs.map(log => [
      log.id,
      log.timestamp,
      log.agentType,
      log.agentName,
      log.direction,
      log.model,
      log.tokens?.total || '',
      log.duration || '',
      log.status,
      log.success,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Get metrics for a specific agent
   */
  getAgentMetrics(agentName: string): AgentMetrics {
    const agentLogs = this.logs.filter(log => log.agentName === agentName);
    const requests = agentLogs.filter(log => log.direction === 'request');
    const responses = agentLogs.filter(log => log.direction === 'response');
    const errors = agentLogs.filter(log => log.direction === 'error');

    const totalCalls = requests.length;
    const successCount = responses.length;
    const failureCount = errors.length;

    // Calculate average latency from successful responses
    const latencies = responses
      .filter(log => log.duration !== undefined)
      .map(log => log.duration!);
    const averageLatency = latencies.length > 0
      ? latencies.reduce((sum, duration) => sum + duration, 0) / latencies.length
      : 0;

    // Total tokens used
    const totalTokens = responses.reduce((sum, log) => sum + (log.tokens?.total || 0), 0);

    // Last call time
    const lastCall = agentLogs[0]; // Logs are unshifted, so first is most recent
    const lastCallTime = lastCall?.timestamp || new Date().toISOString();

    // Last error
    const lastError = errors[0]?.error;

    return {
      agentName,
      totalCalls,
      successCount,
      failureCount,
      successRate: totalCalls > 0 ? (successCount / totalCalls) * 100 : 0,
      averageLatency,
      totalTokens,
      lastCallTime,
      lastError,
    };
  }

  /**
   * Get metrics for all agents
   */
  getAllAgentMetrics(): AgentMetrics[] {
    const agentNames = [...new Set(this.logs.map(log => log.agentName))];
    return agentNames.map(name => this.getAgentMetrics(name));
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    const metrics = this.getAllAgentMetrics();
    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      agents: metrics,
      summary: {
        totalAgents: metrics.length,
        totalCalls: metrics.reduce((sum, m) => sum + m.totalCalls, 0),
        averageSuccessRate: metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length
          : 0,
        totalTokens: metrics.reduce((sum, m) => sum + m.totalTokens, 0),
      },
    }, null, 2);
  }

  /**
   * Get system health score (0-100)
   */
  getHealthScore(): number {
    const metrics = this.getAllAgentMetrics();
    if (metrics.length === 0) return 100;

    // Calculate weighted health score
    const avgSuccessRate = metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length;

    // Penalty for agents with low success rates
    const failedAgents = metrics.filter(m => m.successRate < 50).length;
    const penalty = (failedAgents / metrics.length) * 20;

    return Math.max(0, Math.min(100, avgSuccessRate - penalty));
  }
}

// 单例实例
let loggerInstance: AgentCommunicationLogger | null = null;

export function getCommunicationLogger(): AgentCommunicationLogger {
  if (!loggerInstance) {
    loggerInstance = new AgentCommunicationLogger();
  }
  return loggerInstance;
}
