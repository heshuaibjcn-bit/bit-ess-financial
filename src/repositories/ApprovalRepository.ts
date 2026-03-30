/**
 * Approval Workflow Repository
 *
 * Handles approval workflows for projects
 */

import { BaseRepository } from './BaseRepository';
import { supabase, createRealtimeSubscription } from '../lib/supabase';
import { Database } from '../lib/supabase-schema';

/**
 * Approval status
 */
export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

/**
 * Approval step
 */
export enum ApprovalStep {
  REVIEW = 'review',
  FINANCIAL = 'financial',
  TECHNICAL = 'technical',
  FINAL = 'final',
}

/**
 * Approval request
 */
export interface ApprovalRequest {
  id: string;
  project_id: string;
  requested_by_user_id: string;
  current_step: ApprovalStep;
  status: ApprovalStatus;
  title: string;
  description?: string;
  data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Approval action
 */
export interface ApprovalAction {
  id: string;
  approval_request_id: string;
  user_id: string;
  action: 'approve' | 'reject' | 'request_changes' | 'comment';
  comment?: string;
  step: ApprovalStep;
  created_at: string;
}

/**
 * Extended approval with details
 */
export interface ApprovalWithDetails extends ApprovalRequest {
  project?: {
    id: string;
    name: string;
  };
  requested_by_user?: {
    id: string;
    name: string;
    email: string;
  };
  actions?: ApprovalActionWithUser[];
  current_action?: ApprovalActionWithUser;
}

/**
 * Approval action with user info
 */
export interface ApprovalActionWithUser extends ApprovalAction {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Approval workflow configuration
 */
export interface ApprovalWorkflowConfig {
  steps: ApprovalStep[];
  required_approvers: {
    step: ApprovalStep;
    role: string;
    count: number;
  }[];
  auto_advance: boolean;
  notify_on_complete: boolean;
}

/**
 * Approval repository
 */
export class ApprovalRepository {
  private requestsTable = 'approval_requests' as const;
  private actionsTable = 'approval_actions' as const;

  /**
   * Create approval request
   */
  async createRequest(request: {
    projectId: string;
    requestedByUserId: string;
    title: string;
    description?: string;
    data?: Record<string, any>;
    initialStep?: ApprovalStep;
  }): Promise<ApprovalRequest> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from(this.requestsTable)
      .insert({
        project_id: request.projectId,
        requested_by_user_id: request.requestedByUserId,
        current_step: request.initialStep || ApprovalStep.REVIEW,
        status: ApprovalStatus.PENDING,
        title: request.title,
        description: request.description,
        data: request.data,
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, create it
      if (error.code === '42P01') {
        await this.createTables();
        // Retry
        return this.createRequest(request);
      }
      throw error;
    }

    return data;
  }

  /**
   * Get approval request by ID
   */
  async getRequest(requestId: string): Promise<ApprovalWithDetails | null> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from(this.requestsTable)
      .select(`
        *,
        project:projects!approval_requests_project_id_fkey(
          id,
          name
        ),
        requested_by_user:users!approval_requests_requested_by_user_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    // Get actions
    const actions = await this.getActions(requestId);
    return {
      ...data,
      actions,
    };
  }

  /**
   * Get approval requests for project
   */
  async getProjectRequests(projectId: string): Promise<ApprovalWithDetails[]> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from(this.requestsTable)
      .select(`
        *,
        project:projects!approval_requests_project_id_fkey(
          id,
          name
        ),
        requested_by_user:users!approval_requests_requested_by_user_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }

    // Fetch actions for each request
    const requestWithActions = await Promise.all(
      (data || []).map(async (request) => ({
        ...request,
        actions: await this.getActions(request.id),
      }))
    );

    return requestWithActions;
  }

  /**
   * Get pending approvals for user
   */
  async getPendingApprovals(userId: string): Promise<ApprovalWithDetails[]> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from(this.requestsTable)
      .select(`
        *,
        project:projects!approval_requests_project_id_fkey(
          id,
          name
        ),
        requested_by_user:users!approval_requests_requested_by_user_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('status', ApprovalStatus.PENDING)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }

    // Filter by user's role and fetch actions
    const requestWithActions = await Promise.all(
      (data || []).map(async (request) => ({
        ...request,
        actions: await this.getActions(request.id),
      }))
    );

    return requestWithActions;
  }

  /**
   * Add approval action
   */
  async addAction(action: {
    approvalRequestId: string;
    userId: string;
    actionType: 'approve' | 'reject' | 'request_changes' | 'comment';
    comment?: string;
    step?: ApprovalStep;
  }): Promise<ApprovalAction> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from(this.actionsTable)
      .insert({
        approval_request_id: action.approvalRequestId,
        user_id: action.userId,
        action: action.actionType,
        comment: action.comment,
        step: action.step || ApprovalStep.REVIEW,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update request status based on action
    if (action.actionType === 'reject') {
      await this.updateRequestStatus(action.approvalRequestId, ApprovalStatus.REJECTED);
    } else if (action.actionType === 'approve') {
      // Check if all steps are complete
      await this.checkAndAdvanceRequest(action.approvalRequestId);
    }

    return data;
  }

  /**
   * Get actions for approval request
   */
  async getActions(requestId: string): Promise<ApprovalActionWithUser[]> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from(this.actionsTable)
      .select(`
        *,
        user:users!approval_actions_user_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('approval_request_id', requestId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }

    return data || [];
  }

  /**
   * Update request status
   */
  async updateRequestStatus(
    requestId: string,
    status: ApprovalStatus
  ): Promise<ApprovalRequest> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from(this.requestsTable)
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Advance to next step
   */
  async advanceToNextStep(requestId: string): Promise<ApprovalRequest> {
    const request = await this.getRequest(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    const steps = [
      ApprovalStep.REVIEW,
      ApprovalStep.FINANCIAL,
      ApprovalStep.TECHNICAL,
      ApprovalStep.FINAL,
    ];

    const currentIndex = steps.indexOf(request.current_step);
    if (currentIndex >= steps.length - 1) {
      // All steps complete, mark as approved
      return this.updateRequestStatus(requestId, ApprovalStatus.APPROVED);
    }

    const nextStep = steps[currentIndex + 1];

    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from(this.requestsTable)
      .update({
        current_step: nextStep,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Cancel request
   */
  async cancelRequest(requestId: string): Promise<ApprovalRequest> {
    return this.updateRequestStatus(requestId, ApprovalStatus.CANCELLED);
  }

  /**
   * Check and advance request if all approvals received
   */
  private async checkAndAdvanceRequest(requestId: string): Promise<void> {
    // Get workflow configuration
    const config = await this.getWorkflowConfig();

    const actions = await this.getActions(requestId);
    const request = await this.getRequest(requestId);

    if (!request) {
      return;
    }

    // Check if current step has required approvals
    const stepConfig = config.required_approvers.find(
      (r) => r.step === request.current_step
    );

    if (stepConfig) {
      const stepApprovals = actions.filter(
        (a) => a.step === request.current_step && a.action === 'approve'
      );

      if (stepApprovals.length >= stepConfig.count) {
        // Advance to next step
        await this.advanceToNextStep(requestId);
      }
    } else if (config.auto_advance) {
      // No specific requirements, auto-advance
      await this.advanceToNextStep(requestId);
    }
  }

  /**
   * Get workflow configuration
   */
  async getWorkflowConfig(): Promise<ApprovalWorkflowConfig> {
    // Default configuration
    return {
      steps: [
        ApprovalStep.REVIEW,
        ApprovalStep.FINANCIAL,
        ApprovalStep.TECHNICAL,
        ApprovalStep.FINAL,
      ],
      required_approvers: [
        { step: ApprovalStep.REVIEW, role: 'manager', count: 1 },
        { step: ApprovalStep.FINANCIAL, role: 'admin', count: 1 },
        { step: ApprovalStep.TECHNICAL, role: 'manager', count: 1 },
        { step: ApprovalStep.FINAL, role: 'admin', count: 1 },
      ],
      auto_advance: true,
      notify_on_complete: true,
    };
  }

  /**
   * Create approval tables if they don't exist
   */
  private async createTables(): Promise<void> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    // Create approval_requests table
    await supabase.rpc('create_approval_tables', {
      if_not_exists: true,
    }).catch(() => {
      // Ignore error if RPC doesn't exist
    });
  }

  /**
   * Subscribe to approval changes
   */
  subscribeToApprovals(
    userId: string,
    callbacks: {
      onRequestCreated?: (request: ApprovalRequest) => void;
      onRequestUpdated?: (request: ApprovalRequest) => void;
      onActionAdded?: (action: ApprovalAction) => void;
    }
  ) {
    const subscription = createRealtimeSubscription(this.requestsTable);

    if (callbacks.onRequestCreated) {
      subscription.onInsert((payload) => {
        const request = payload.new as ApprovalRequest;
        if (request.requested_by_user_id === userId) {
          callbacks.onRequestCreated?.(request);
        }
      });
    }

    if (callbacks.onRequestUpdated) {
      subscription.onUpdate((payload) => {
        const request = payload.new as ApprovalRequest;
        if (request.requested_by_user_id === userId) {
          callbacks.onRequestUpdated?.(request);
        }
      });
    }

    subscription.subscribe();

    return subscription;
  }
}

/**
 * Global approval repository instance
 */
export const approvalRepository = new ApprovalRepository();