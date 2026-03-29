/**
 * Agent Orchestrator - High-Performance Agent Execution
 *
 * Provides optimized execution strategies for multiple agents:
 * - Parallel execution for independent agents
 * - Batched execution with controlled concurrency
 * - Dependency management for agent workflows
 * - Performance monitoring and optimization
 */

import { getAgentManager } from './NanoAgent';
import type { AgentTask } from './NanoAgent';
import { getCommunicationLogger } from './AgentCommunicationLogger';

export interface AgentExecutionConfig {
  type: string;
  input: any;
  dependencies?: string[]; // Agent types that must complete first
  priority?: 'high' | 'medium' | 'low';
  timeout?: number; // milliseconds
}

export interface OrchestratorResult {
  tasks: AgentTask[];
  totalDuration: number;
  successCount: number;
  failureCount: number;
  performance: {
    sequentialTime: number; // Estimated time if executed sequentially
    parallelTime: number; // Actual time with parallel execution
    speedup: number; // Speedup factor
    efficiency: number; // Efficiency percentage
  };
}

export interface BatchExecutionOptions {
  concurrency?: number;
  continueOnError?: boolean;
  timeout?: number;
}

/**
 * Agent Orchestrator Class
 */
export class AgentOrchestrator {
  private manager = getAgentManager();
  private logger = getCommunicationLogger();

  /**
   * Execute multiple agents in parallel with automatic optimization
   * Analyzes dependencies and executes independent agents in parallel
   */
  async executeOptimized(configs: AgentExecutionConfig[]): Promise<OrchestratorResult> {
    const startTime = Date.now();

    this.log(`Starting optimized execution of ${configs.length} agents`);

    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(configs);

    // Group agents by execution level (can run in parallel)
    const executionLevels = this.topologicalSort(dependencyGraph);

    this.log(
      `Execution plan: ${executionLevels.length} levels, ` +
      `max parallel: ${Math.max(...executionLevels.map(l => l.agents.length))}`
    );

    // Execute each level in sequence, but agents within each level in parallel
    const allTasks: AgentTask[] = [];

    for (let i = 0; i < executionLevels.length; i++) {
      const level = executionLevels[i];
      this.log(`Executing level ${i + 1}/${executionLevels.length} (${level.agents.length} agents)`);

      const levelTasks = await this.executeLevelParallel(level.agents, {
        continueOnError: true,
      });

      allTasks.push(...levelTasks);

      // Check if we should stop due to failures
      const failedInLevel = levelTasks.filter(t => t.status === 'failed');
      if (failedInLevel.length > 0) {
        this.log(
          'warn',
          `${failedInLevel.length} agents failed in level ${i + 1}, ` +
          `continuing with dependent agents`
        );
      }
    }

    const totalDuration = Date.now() - startTime;

    // Calculate performance metrics
    const performance = this.calculatePerformance(configs, allTasks, totalDuration);

    return {
      tasks: allTasks,
      totalDuration,
      successCount: allTasks.filter(t => t.status === 'completed').length,
      failureCount: allTasks.filter(t => t.status === 'failed').length,
      performance,
    };
  }

  /**
   * Execute all agents in parallel (no dependencies)
   * Fastest execution mode when agents are independent
   */
  async executeAllParallel(configs: AgentExecutionConfig[]): Promise<OrchestratorResult> {
    const startTime = Date.now();

    this.log(`Executing ${configs.length} agents in parallel (no dependencies)`);

    const tasks = await this.manager.executeAgentsParallel(configs);

    const totalDuration = Date.now() - startTime;
    const performance = this.calculatePerformance(configs, tasks, totalDuration);

    return {
      tasks,
      totalDuration,
      successCount: tasks.filter(t => t.status === 'completed').length,
      failureCount: tasks.filter(t => t.status === 'failed').length,
      performance,
    };
  }

  /**
   * Execute agents in batches with controlled concurrency
   * Useful for rate limiting or resource management
   */
  async executeBatched(
    configs: AgentExecutionConfig[],
    options: BatchExecutionOptions = {}
  ): Promise<OrchestratorResult> {
    const {
      concurrency = 3,
      continueOnError = true,
      timeout = 300000, // 5 minutes default
    } = options;

    const startTime = Date.now();

    this.log(
      `Executing ${configs.length} agents in batches ` +
      `(concurrency: ${concurrency}, continueOnError: ${continueOnError})`
    );

    const tasks = await this.manager.executeAgentsBatched(configs, concurrency);

    const totalDuration = Date.now() - startTime;
    const performance = this.calculatePerformance(configs, tasks, totalDuration);

    return {
      tasks,
      totalDuration,
      successCount: tasks.filter(t => t.status === 'completed').length,
      failureCount: tasks.filter(t => t.status === 'failed').length,
      performance,
    };
  }

  /**
   * Execute agents by priority (high → medium → low)
   * Ensures important agents run first
   */
  async executeByPriority(configs: AgentExecutionConfig[]): Promise<OrchestratorResult> {
    const startTime = Date.now();

    this.log(`Executing ${configs.length} agents by priority`);

    // Group by priority
    const byPriority = {
      high: configs.filter(c => c.priority === 'high'),
      medium: configs.filter(c => c.priority === 'medium' || !c.priority),
      low: configs.filter(c => c.priority === 'low'),
    };

    const allTasks: AgentTask[] = [];

    // Execute in priority order
    for (const [priority, agentConfigs] of Object.entries(byPriority)) {
      if (agentConfigs.length === 0) continue;

      this.log(`Executing ${priority} priority agents (${agentConfigs.length} agents)`);

      const tasks = await this.manager.executeAgentsParallel(agentConfigs);
      allTasks.push(...tasks);
    }

    const totalDuration = Date.now() - startTime;
    const performance = this.calculatePerformance(configs, allTasks, totalDuration);

    return {
      tasks: allTasks,
      totalDuration,
      successCount: allTasks.filter(t => t.status === 'completed').length,
      failureCount: allTasks.filter(t => t.status === 'failed').length,
      performance,
    };
  }

  /**
   * Build dependency graph from agent configs
   */
  private buildDependencyGraph(configs: AgentExecutionConfig[]): Map<string, {
    config: AgentExecutionConfig;
    dependencies: string[];
  }> {
    const graph = new Map();

    for (const config of configs) {
      graph.set(config.type, {
        config,
        dependencies: config.dependencies || [],
      });
    }

    return graph;
  }

  /**
   * Topological sort to determine execution levels
   * Agents in the same level can be executed in parallel
   */
  private topologicalSort(
    graph: Map<string, { config: AgentExecutionConfig; dependencies: string[] }>
  ): Array<{ level: number; agents: AgentExecutionConfig[] }> {
    const levels: Array<{ level: number; agents: AgentExecutionConfig[] }> = [];
    const executed = new Set<string>();
    const inProgress = new Set<string>();

    const getLevel = (agentType: string): number => {
      if (executed.has(agentType)) return -1;

      const node = graph.get(agentType);
      if (!node) return 0;

      let maxDepLevel = -1;
      for (const dep of node.dependencies) {
        if (!graph.has(dep)) continue; // Dependency not in this graph
        const depLevel = getLevel(dep);
        if (depLevel > maxDepLevel) maxDepLevel = depLevel;
      }

      return maxDepLevel + 1;
    };

    // Assign levels to all agents
    const agentLevels = new Map<string, number>();
    for (const agentType of graph.keys()) {
      const level = getLevel(agentType);
      agentLevels.set(agentType, level);
    }

    // Group by level
    const levelGroups = new Map<number, AgentExecutionConfig[]>();
    for (const [agentType, level] of agentLevels) {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      const node = graph.get(agentType);
      if (node) {
        levelGroups.get(level)!.push(node.config);
      }
    }

    // Convert to array and sort by level
    for (const [level, agents] of levelGroups) {
      levels.push({ level, agents });
    }

    levels.sort((a, b) => a.level - b.level);

    return levels;
  }

  /**
   * Execute a single level of agents in parallel
   */
  private async executeLevelParallel(
    configs: AgentExecutionConfig[],
    options: { continueOnError?: boolean }
  ): Promise<AgentTask[]> {
    try {
      return await this.manager.executeAgentsParallel(configs);
    } catch (error) {
      if (!options.continueOnError) {
        throw error;
      }
      // Return partial results if continueOnError is true
      this.log('warn', `Error in level execution: ${error}`);
      return [];
    }
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformance(
    configs: AgentExecutionConfig[],
    tasks: AgentTask[],
    actualTime: number
  ): OrchestratorResult['performance'] {
    // Estimate sequential time (sum of all individual task times)
    const sequentialTime = tasks.reduce((sum, task) => {
      if (task.startTime && task.endTime) {
        return sum + (new Date(task.endTime).getTime() - new Date(task.startTime).getTime());
      }
      return sum;
    }, 0);

    // Fallback: estimate based on average task time if we don't have actual times
    const estimatedSequentialTime = sequentialTime > 0
      ? sequentialTime
      : configs.length * 15000; // Assume 15s per agent average

    const parallelTime = actualTime;
    const speedup = estimatedSequentialTime / parallelTime;
    const efficiency = (speedup / configs.length) * 100;

    return {
      sequentialTime: estimatedSequentialTime,
      parallelTime,
      speedup,
      efficiency: Math.min(efficiency, 100), // Cap at 100%
    };
  }

  /**
   * Log orchestrator activity
   */
  private log(activity: string, data?: any): void {
    console.log(`[AgentOrchestrator] ${activity}`, data || '');
  }
}

// Singleton instance
let orchestratorInstance: AgentOrchestrator | null = null;

export function getAgentOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}
