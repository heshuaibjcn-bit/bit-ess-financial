/**
 * Comment Repository
 *
 * Handles comments and discussions on projects
 */

import { BaseRepository } from './BaseRepository';
import { supabase, createRealtimeSubscription } from '../lib/supabase';
import { Database } from '../lib/supabase-schema';

/**
 * Comment table (not in schema, need to add)
 */
export interface CommentRow {
  id: string;
  project_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  mentions?: string[];
  resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentInsert {
  id?: string;
  project_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  mentions?: string[];
  resolved?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CommentUpdate {
  id?: string;
  project_id?: string;
  user_id?: string;
  parent_id?: string | null;
  content?: string;
  mentions?: string[];
  resolved?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Extended comment with user info
 */
export interface CommentWithUser extends CommentRow {
  user?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  replies?: CommentWithUser[];
}

/**
 * Comment repository
 */
export class CommentRepository {
  private tableName = 'comments' as const;

  /**
   * Find all comments for a project
   */
  async findByProject(projectId: string): Promise<CommentWithUser[]> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        user:users!comments_user_id_fkey(
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('project_id', projectId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      (data || []).map(async (comment) => ({
        ...comment,
        replies: await this.findReplies(comment.id),
      }))
    );

    return commentsWithReplies;
  }

  /**
   * Find replies for a comment
   */
  async findReplies(parentId: string): Promise<CommentWithUser[]> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        user:users!comments_user_id_fkey(
          id,
          name,
          email,
          avatar_url
        )
      `)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }

    return data || [];
  }

  /**
   * Create a comment
   */
  async create(comment: CommentInsert): Promise<CommentRow> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .insert(comment)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Update a comment
   */
  async update(id: string, updates: CommentUpdate): Promise<CommentRow> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Delete a comment
   */
  async delete(id: string): Promise<boolean> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  }

  /**
   * Resolve/unresolve a comment
   */
  async toggleResolved(id: string): Promise<CommentRow> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    return this.update(id, { resolved: !comment.resolved });
  }

  /**
   * Find comment by ID
   */
  async findById(id: string): Promise<CommentRow | null> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Get comment count for project
   */
  async countByProject(projectId: string): Promise<number> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .is('parent_id', null);

    if (error) {
      if (error.code === '42P01') {
        return 0;
      }
      throw error;
    }

    return count || 0;
  }

  /**
   * Get unresolved comment count
   */
  async countUnresolved(projectId: string): Promise<number> {
    if (!supabase) {
      throw new Error('Database not available');
    }

    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('resolved', false);

    if (error) {
      if (error.code === '42P01') {
        return 0;
      }
      throw error;
    }

    return count || 0;
  }

  /**
   * Subscribe to comment changes
   */
  subscribeToComments(
    projectId: string,
    callbacks: {
      onInsert?: (comment: CommentWithUser) => void;
      onUpdate?: (comment: CommentWithUser) => void;
      onDelete?: (comment: CommentRow) => void;
    }
  ) {
    const subscription = createRealtimeSubscription(this.tableName);

    if (callbacks.onInsert) {
      subscription.onInsert(async (payload) => {
        const comment = payload.new;
        if (comment.project_id === projectId) {
          // Fetch with user info
          const commentWithUser = await this.findById(comment.id);
          if (commentWithUser) {
            callbacks.onInsert?.(commentWithUser as CommentWithUser);
          }
        }
      });
    }

    if (callbacks.onUpdate) {
      subscription.onUpdate(async (payload) => {
        const comment = payload.new;
        if (comment.project_id === projectId) {
          const commentWithUser = await this.findById(comment.id);
          if (commentWithUser) {
            callbacks.onUpdate?.(commentWithUser as CommentWithUser);
          }
        }
      });
    }

    if (callbacks.onDelete) {
      subscription.onDelete((payload) => {
        const comment = payload.old;
        if (comment.project_id === projectId) {
          callbacks.onDelete?.(comment as CommentRow);
        }
      });
    }

    subscription.subscribe();

    return subscription;
  }
}

/**
 * Global comment repository instance
 */
export const commentRepository = new CommentRepository();