/**
 * Share Repository
 *
 * Handles project sharing, permissions, and access control
 */

import { BaseRepository } from './BaseRepository';
import { supabase, createRealtimeSubscription } from '../lib/supabase';
import { Database } from '../lib/supabase-schema';

export type ShareRow = Database['public']['Tables']['shares']['Row'];
export type ShareInsert = Database['public']['Tables']['shares']['Insert'];
export type ShareUpdate = Database['public']['Tables']['shares']['Update'];

export type SharePermission = 'view' | 'edit' | 'admin';

/**
 * Extended share data with user and project info
 */
export interface ShareWithDetails extends ShareRow {
  project?: {
    id: string;
    name: string;
    description?: string;
  };
  shared_by_user?: {
    id: string;
    name: string;
    email: string;
  };
  shared_to_user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

/**
 * Share repository
 */
export class ShareRepository extends BaseRepository<'shares'> {
  constructor() {
    super('shares');
  }

  /**
   * Share project with user
   */
  async shareProject(
    projectId: string,
    sharedByUserId: string,
    options: {
      sharedToUserId?: string;
      permission?: SharePermission;
      expiresAt?: Date;
    }
  ): Promise<ShareRow> {
    // Check if already shared
    const existing = await this.findOne({
      project_id: projectId,
      shared_to_user_id: options.sharedToUserId,
    });

    if (existing) {
      // Update existing share
      return this.update(existing.id, {
        permission: options.permission || existing.permission,
        expires_at: options.expiresAt?.toISOString() || existing.expires_at,
      });
    }

    // Create new share
    const shareData: ShareInsert = {
      project_id: projectId,
      shared_by_user_id: sharedByUserId,
      shared_to_user_id: options.sharedToUserId,
      permission: options.permission || 'view',
      expires_at: options.expiresAt?.toISOString(),
      access_count: 0,
    };

    return this.create(shareData);
  }

  /**
   * Create public share link
   */
  async createPublicShare(
    projectId: string,
    sharedByUserId: string,
    options: {
      permission?: SharePermission;
      expiresAt?: Date;
    }
  ): Promise<ShareRow> {
    // Generate unique share token
    const shareToken = this.generateShareToken();

    const shareData: ShareInsert = {
      project_id: projectId,
      shared_by_user_id: sharedByUserId,
      share_token: shareToken,
      permission: options.permission || 'view',
      expires_at: options.expiresAt?.toISOString(),
      access_count: 0,
    };

    return this.create(shareData);
  }

  /**
   * Get share by token
   */
  async getByToken(token: string): Promise<ShareWithDetails | null> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('shares')
      .select(`
        *,
        project!shares_project_id_fkey(
          id,
          name,
          description
        ),
        shared_by_user!shares_shared_by_user_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('share_token', token)
      .single();

    if (error) {
      throw error;
    }

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      throw new Error('Share link has expired');
    }

    return data;
  }

  /**
   * Get user's shared projects
   */
  async getUserSharedProjects(userId: string): Promise<ShareWithDetails[]> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('shares')
      .select(`
        *,
        project!shares_project_id_fkey(
          id,
          name,
          description
        ),
        shared_by_user!shares_shared_by_user_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('shared_to_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Filter out expired shares
    return data.filter(share => {
      if (!share.expires_at) return true;
      return new Date(share.expires_at) > new Date();
    }) as ShareWithDetails[];
  }

  /**
   * Get projects shared by user
   */
  async getUserSharedByProjects(userId: string): Promise<ShareWithDetails[]> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('shares')
      .select(`
        *,
        project!shares_project_id_fkey(
          id,
          name,
          description
        ),
        shared_to_user!shares_shared_to_user_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('shared_by_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data.filter(share => {
      if (!share.expires_at) return true;
      return new Date(share.expires_at) > new Date();
    }) as ShareWithDetails[];
  }

  /**
   * Update share permission
   */
  async updatePermission(shareId: string, permission: SharePermission): Promise<ShareRow> {
    return this.update(shareId, { permission });
  }

  /**
   * Increment access count
   */
  async incrementAccess(shareId: string): Promise<ShareRow> {
    const share = await this.findById(shareId);
    if (!share) {
      throw new Error('Share not found');
    }

    return this.update(shareId, {
      access_count: share.access_count + 1,
    });
  }

  /**
   * Revoke share
   */
  async revokeShare(shareId: string): Promise<boolean> {
    return this.delete(shareId);
  }

  /**
   * Revoke all shares for a project
   */
  async revokeProjectShares(projectId: string): Promise<boolean> {
    return this.deleteMany({ project_id: projectId });
  }

  /**
   * Check if user has access to project
   */
  async checkAccess(
    projectId: string,
    userId: string
  ): Promise<{ hasAccess: boolean; permission?: SharePermission }> {
    if (!supabase) {
      return { hasAccess: false };
    }

    // Check if user is owner
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (project?.user_id === userId) {
      return { hasAccess: true, permission: 'admin' };
    }

    // Check if project is shared with user
    const share = await this.findOne({
      project_id: projectId,
      shared_to_user_id: userId,
    });

    if (share) {
      // Check if expired
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return { hasAccess: false };
      }

      return { hasAccess: true, permission: share.permission };
    }

    return { hasAccess: false };
  }

  /**
   * Get all shares for a project
   */
  async getProjectShares(projectId: string): Promise<ShareWithDetails[]> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('shares')
      .select(`
        *,
        shared_to_user!shares_shared_to_user_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data as ShareWithDetails[];
  }

  /**
   * Clean up expired shares
   */
  async cleanupExpiredShares(): Promise<number> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from('shares')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) {
      throw error;
    }

    return data?.length || 0;
  }

  /**
   * Generate unique share token
   */
  private generateShareToken(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Subscribe to share changes
   */
  subscribeToShares(
    userId: string,
    callbacks: {
      onInsert?: (share: ShareRow) => void;
      onUpdate?: (share: ShareRow) => void;
      onDelete?: (share: ShareRow) => void;
    }
  ) {
    const subscription = createRealtimeSubscription('shares');

    if (callbacks.onInsert) {
      subscription.onInsert((payload) => {
        const share = payload.new as ShareRow;
        if (share.shared_to_user_id === userId || share.shared_by_user_id === userId) {
          callbacks.onInsert?.(share);
        }
      });
    }

    if (callbacks.onUpdate) {
      subscription.onUpdate((payload) => {
        const share = payload.new as ShareRow;
        if (share.shared_to_user_id === userId || share.shared_by_user_id === userId) {
          callbacks.onUpdate?.(share);
        }
      });
    }

    if (callbacks.onDelete) {
      subscription.onDelete((payload) => {
        const share = payload.old as ShareRow;
        if (share.shared_to_user_id === userId || share.shared_by_user_id === userId) {
          callbacks.onDelete?.(share);
        }
      });
    }

    subscription.subscribe();

    return subscription;
  }
}

/**
 * Global share repository instance
 */
export const shareRepository = new ShareRepository();