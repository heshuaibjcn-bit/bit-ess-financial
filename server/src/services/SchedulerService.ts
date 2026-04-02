/**
 * 定时任务调度服务
 * 
 * 功能：
 * 1. 定时检查各省电价更新
 * 2. 自动执行数据抓取
 * 3. 任务执行日志记录
 */

import cron from 'node-cron';
import { getTariffUpdateAgent } from '../agents/TariffUpdateAgent';
import { NATIONWIDE_DATA_SOURCES } from '../../../src/config/nationwide-data-sources';

export interface ScheduleConfig {
  checkInterval: string;     // cron表达式
  batchSize: number;         // 每批处理数量
  retryDelay: number;        // 重试延迟（毫秒）
  maxRetries: number;        // 最大重试次数
}

export interface TaskLog {
  id: string;
  type: 'check' | 'crawl' | 'verify';
  provinceCode?: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  result?: any;
  error?: string;
}

/**
 * 调度服务
 */
export class SchedulerService {
  private updateAgent = getTariffUpdateAgent();
  private tasks = new Map<string, cron.ScheduledTask>();
  private logs: TaskLog[] = [];
  private config: ScheduleConfig = {
    checkInterval: '0 2 * * *',  // 每天凌晨2点
    batchSize: 5,
    retryDelay: 5000,
    maxRetries: 3,
  };

  /**
   * 启动定时任务
   */
  start(): void {
    console.log('[Scheduler] Starting scheduler service...');
    
    // 每日检查任务
    const dailyTask = cron.schedule(this.config.checkInterval, async () => {
      console.log('[Scheduler] Daily check triggered at', new Date().toISOString());
      await this.executeDailyCheck();
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai',
    });

    this.tasks.set('daily-check', dailyTask);

    // 健康检查任务（每30分钟）
    const healthTask = cron.schedule('*/30 * * * *', async () => {
      await this.executeHealthCheck();
    }, {
      scheduled: true,
      timezone: 'Asia/Shanghai',
    });

    this.tasks.set('health-check', healthTask);

    console.log('[Scheduler] Scheduler started successfully');
  }

  /**
   * 停止定时任务
   */
  stop(): void {
    console.log('[Scheduler] Stopping scheduler service...');
    for (const [name, task] of this.tasks) {
      task.stop();
      console.log(`[Scheduler] Task ${name} stopped`);
    }
    this.tasks.clear();
  }

  /**
   * 执行每日检查
   */
  private async executeDailyCheck(): Promise<void> {
    const log = this.createTaskLog('check');
    
    try {
      const allCodes = NATIONWIDE_DATA_SOURCES.map(s => s.code);
      const results = [];

      // 分批处理
      for (let i = 0; i < allCodes.length; i += this.config.batchSize) {
        const batch = allCodes.slice(i, i + this.config.batchSize);
        console.log(`[Scheduler] Processing batch ${i / this.config.batchSize + 1}:`, batch);

        const batchResults = await this.updateAgent.updateBatch(batch);
        results.push(...batchResults);

        // 批次间延迟
        if (i + this.config.batchSize < allCodes.length) {
          await this.sleep(10000);
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      log.status = 'completed';
      log.result = {
        total: results.length,
        success: successCount,
        failure: failureCount,
        details: results,
      };

      console.log(`[Scheduler] Daily check completed: ${successCount}/${results.length} succeeded`);
    } catch (error) {
      log.status = 'failed';
      log.error = (error as Error).message;
      console.error('[Scheduler] Daily check failed:', error);
    } finally {
      log.endTime = new Date().toISOString();
    }
  }

  /**
   * 执行健康检查
   */
  private async executeHealthCheck(): Promise<void> {
    const log = this.createTaskLog('check');
    
    try {
      // 检查代理池状态
      const { getProxyPool } = await import('./ProxyPool');
      const proxyStatus = getProxyPool().getStatus();

      // 检查最近的错误日志
      const recentErrors = this.logs
        .filter(l => l.status === 'failed' && l.startTime > new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .length;

      log.status = 'completed';
      log.result = {
        proxyStatus,
        recentErrors,
        timestamp: new Date().toISOString(),
      };

      if (recentErrors > 10) {
        console.warn(`[Scheduler] Health check warning: ${recentErrors} errors in last 24h`);
      }
    } catch (error) {
      log.status = 'failed';
      log.error = (error as Error).message;
    } finally {
      log.endTime = new Date().toISOString();
    }
  }

  /**
   * 手动触发检查（指定省份）
   */
  async manualCheck(provinceCodes: string[]): Promise<any> {
    const log = this.createTaskLog('check');
    
    try {
      console.log(`[Scheduler] Manual check for:`, provinceCodes);
      const results = await this.updateAgent.updateBatch(provinceCodes);
      
      log.status = 'completed';
      log.result = results;
      
      return {
        success: true,
        data: results,
      };
    } catch (error) {
      log.status = 'failed';
      log.error = (error as Error).message;
      throw error;
    } finally {
      log.endTime = new Date().toISOString();
    }
  }

  /**
   * 获取任务日志
   */
  getLogs(limit = 50): TaskLog[] {
    return this.logs
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit);
  }

  /**
   * 获取调度器状态
   */
  getStatus(): {
    isRunning: boolean;
    taskCount: number;
    lastLog: TaskLog | null;
    config: ScheduleConfig;
  } {
    return {
      isRunning: this.tasks.size > 0,
      taskCount: this.tasks.size,
      lastLog: this.logs[this.logs.length - 1] || null,
      config: this.config,
    };
  }

  /**
   * 创建任务日志
   */
  private createTaskLog(type: TaskLog['type']): TaskLog {
    const log: TaskLog = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      status: 'running',
      startTime: new Date().toISOString(),
    };
    this.logs.push(log);
    return log;
  }

  /**
   * 延迟
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 单例实例
let schedulerInstance: SchedulerService | null = null;

export function getSchedulerService(): SchedulerService {
  if (!schedulerInstance) {
    schedulerInstance = new SchedulerService();
  }
  return schedulerInstance;
}
