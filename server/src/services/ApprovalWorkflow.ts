/**
 * 人工审核工作流服务
 * 
 * 功能：
 * 1. 待审核数据队列管理
 * 2. 审核任务分配
 * 3. 审核历史记录
 * 4. 异常数据标记
 */

import type { TariffVersion, TariffDetail, TimePeriodConfig, ValidationResult } from '../../../src/types/real-tariff';

export interface PendingApproval {
  id: string;
  provinceCode: string;
  versionId: string;
  version: TariffVersion;
  tariffs: TariffDetail[];
  timePeriods: TimePeriodConfig;
  validationResult: ValidationResult;
  crawlSource: string;
  submittedAt: string;
  submitter: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected';
  assignedTo?: string;
  reviewedAt?: string;
  reviewer?: string;
  reviewComment?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

export interface ApprovalStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  averageReviewTime: number; // 分钟
  byProvince: Record<string, number>;
}

/**
 * 审核工作流服务
 */
export class ApprovalWorkflowService {
  private pendingQueue: PendingApproval[] = [];
  private history: PendingApproval[] = [];
  private reviewers: string[] = []; // 审核员列表

  /**
   * 提交待审核数据
   */
  async submitForApproval(data: Omit<PendingApproval, 'id' | 'submittedAt' | 'status'>): Promise<PendingApproval> {
    const approval: PendingApproval = {
      ...data,
      id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };

    this.pendingQueue.push(approval);
    console.log(`[ApprovalWorkflow] Submitted ${approval.id} for province ${approval.provinceCode}`);
    
    return approval;
  }

  /**
   * 获取待审核列表
   */
  async getPendingList(options?: {
    provinceCode?: string;
    priority?: 'high' | 'medium' | 'low';
    assignedTo?: string;
    limit?: number;
  }): Promise<PendingApproval[]> {
    let results = this.pendingQueue.filter(a => a.status === 'pending');

    if (options?.provinceCode) {
      results = results.filter(a => a.provinceCode === options.provinceCode);
    }

    if (options?.priority) {
      results = results.filter(a => a.priority === options.priority);
    }

    if (options?.assignedTo) {
      results = results.filter(a => a.assignedTo === options.assignedTo);
    }

    // 按优先级排序
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    results.sort((a, b) => {
      // 先按优先级
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // 再按提交时间
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });

    return options?.limit ? results.slice(0, options.limit) : results;
  }

  /**
   * 获取单个待审核项
   */
  async getPendingById(id: string): Promise<PendingApproval | null> {
    return this.pendingQueue.find(a => a.id === id) || null;
  }

  /**
   * 审核通过
   */
  async approve(
    id: string,
    reviewer: string,
    comment?: string,
    changes?: PendingApproval['changes']
  ): Promise<PendingApproval> {
    const approval = this.pendingQueue.find(a => a.id === id);
    if (!approval) {
      throw new Error(`Approval ${id} not found`);
    }

    if (approval.status !== 'pending') {
      throw new Error(`Approval ${id} is not in pending status`);
    }

    approval.status = 'approved';
    approval.reviewer = reviewer;
    approval.reviewComment = comment;
    approval.reviewedAt = new Date().toISOString();
    approval.changes = changes;

    // 移动到历史记录
    this.moveToHistory(approval);

    console.log(`[ApprovalWorkflow] Approved ${id} by ${reviewer}`);
    return approval;
  }

  /**
   * 审核拒绝
   */
  async reject(
    id: string,
    reviewer: string,
    reason: string
  ): Promise<PendingApproval> {
    const approval = this.pendingQueue.find(a => a.id === id);
    if (!approval) {
      throw new Error(`Approval ${id} not found`);
    }

    approval.status = 'rejected';
    approval.reviewer = reviewer;
    approval.reviewComment = reason;
    approval.reviewedAt = new Date().toISOString();

    // 移动到历史记录
    this.moveToHistory(approval);

    console.log(`[ApprovalWorkflow] Rejected ${id} by ${reviewer}: ${reason}`);
    return approval;
  }

  /**
   * 分配审核任务
   */
  async assignTask(id: string, reviewer: string): Promise<PendingApproval> {
    const approval = this.pendingQueue.find(a => a.id === id);
    if (!approval) {
      throw new Error(`Approval ${id} not found`);
    }

    approval.assignedTo = reviewer;
    console.log(`[ApprovalWorkflow] Assigned ${id} to ${reviewer}`);
    return approval;
  }

  /**
   * 获取审核统计
   */
  async getStats(): Promise<ApprovalStats> {
    const pending = this.pendingQueue.filter(a => a.status === 'pending');
    const approved = this.history.filter(a => a.status === 'approved');
    const rejected = this.history.filter(a => a.status === 'rejected');

    // 计算平均审核时间
    const reviewTimes = this.history
      .filter(a => a.reviewedAt)
      .map(a => {
        const start = new Date(a.submittedAt).getTime();
        const end = new Date(a.reviewedAt!).getTime();
        return (end - start) / 1000 / 60; // 分钟
      });

    const averageReviewTime = reviewTimes.length > 0
      ? reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length
      : 0;

    // 按省份统计
    const byProvince: Record<string, number> = {};
    for (const a of this.pendingQueue) {
      byProvince[a.provinceCode] = (byProvince[a.provinceCode] || 0) + 1;
    }

    return {
      totalPending: pending.length,
      totalApproved: approved.length,
      totalRejected: rejected.length,
      averageReviewTime: Math.round(averageReviewTime * 100) / 100,
      byProvince,
    };
  }

  /**
   * 获取审核历史
   */
  async getHistory(options?: {
    provinceCode?: string;
    reviewer?: string;
    status?: 'approved' | 'rejected';
    limit?: number;
  }): Promise<PendingApproval[]> {
    let results = [...this.history];

    if (options?.provinceCode) {
      results = results.filter(a => a.provinceCode === options.provinceCode);
    }

    if (options?.reviewer) {
      results = results.filter(a => a.reviewer === options.reviewer);
    }

    if (options?.status) {
      results = results.filter(a => a.status === options.status);
    }

    // 按审核时间倒序
    results.sort((a, b) => 
      new Date(b.reviewedAt || b.submittedAt).getTime() - 
      new Date(a.reviewedAt || a.submittedAt).getTime()
    );

    return options?.limit ? results.slice(0, options.limit) : results;
  }

  /**
   * 添加审核员
   */
  addReviewer(reviewerId: string): void {
    if (!this.reviewers.includes(reviewerId)) {
      this.reviewers.push(reviewerId);
    }
  }

  /**
   * 自动分配任务（轮询）
   */
  async autoAssign(): Promise<void> {
    if (this.reviewers.length === 0) return;

    const unassigned = this.pendingQueue.filter(
      a => a.status === 'pending' && !a.assignedTo
    );

    let reviewerIndex = 0;
    for (const task of unassigned) {
      const reviewer = this.reviewers[reviewerIndex % this.reviewers.length];
      await this.assignTask(task.id, reviewer);
      reviewerIndex++;
    }
  }

  /**
   * 移动到历史记录
   */
  private moveToHistory(approval: PendingApproval): void {
    const index = this.pendingQueue.findIndex(a => a.id === approval.id);
    if (index !== -1) {
      this.pendingQueue.splice(index, 1);
      this.history.push(approval);
      
      // 限制历史记录数量
      if (this.history.length > 1000) {
        this.history = this.history.slice(-500);
      }
    }
  }
}

// 单例实例
let workflowInstance: ApprovalWorkflowService | null = null;

export function getApprovalWorkflowService(): ApprovalWorkflowService {
  if (!workflowInstance) {
    workflowInstance = new ApprovalWorkflowService();
  }
  return workflowInstance;
}
