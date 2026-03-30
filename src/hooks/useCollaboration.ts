/**
 * Collaboration Hooks
 *
 * React hooks for collaboration features
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  shareRepository,
  ShareWithDetails,
  SharePermission,
} from '../repositories/ShareRepository';
import {
  commentRepository,
  CommentWithUser,
  CommentRow,
} from '../repositories/CommentRepository';
import {
  approvalRepository,
  ApprovalWithDetails,
  ApprovalStatus,
  ApprovalStep,
} from '../repositories/ApprovalRepository';

/**
 * Hook for project sharing
 */
export function useProjectSharing(projectId: string) {
  const { user } = useAuth();
  const [shares, setShares] = useState<ShareWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchShares = useCallback(async () => {
    if (!projectId) {
      setShares([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await shareRepository.getProjectShares(projectId);
      setShares(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch shares');
      setError(error);
      console.error('Error fetching shares:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  // Real-time updates
  useEffect(() => {
    if (!user || !projectId) {
      return;
    }

    const subscription = shareRepository.subscribeToShares(user.id, {
      onInsert: () => fetchShares(),
      onUpdate: () => fetchShares(),
      onDelete: () => fetchShares(),
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, projectId, fetchShares]);

  const shareWithUser = useCallback(async (
    userId: string,
    permission: SharePermission,
    expiresAt?: Date
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const result = await shareRepository.shareProject(
        projectId,
        user.id,
        {
          sharedToUserId: userId,
          permission,
          expiresAt,
        }
      );

      await fetchShares();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to share project');
      setError(error);
      throw error;
    }
  }, [projectId, user, fetchShares]);

  const createPublicLink = useCallback(async (
    permission: SharePermission,
    expiresAt?: Date
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const result = await shareRepository.createPublicShare(
        projectId,
        user.id,
        { permission, expiresAt }
      );

      await fetchShares();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create share link');
      setError(error);
      throw error;
    }
  }, [projectId, user, fetchShares]);

  const updatePermission = useCallback(async (
    shareId: string,
    permission: SharePermission
  ) => {
    try {
      const result = await shareRepository.updatePermission(shareId, permission);
      await fetchShares();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update permission');
      setError(error);
      throw error;
    }
  }, [fetchShares]);

  const revokeShare = useCallback(async (shareId: string) => {
    try {
      await shareRepository.revokeShare(shareId);
      await fetchShares();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to revoke share');
      setError(error);
      throw error;
    }
  }, [fetchShares]);

  return {
    shares,
    loading,
    error,
    refetch: fetchShares,
    shareWithUser,
    createPublicLink,
    updatePermission,
    revokeShare,
  };
}

/**
 * Hook for shared projects with user
 */
export function useSharedProjects(options?: {
  includeSharedBy?: boolean;
}) {
  const { user } = useAuth();
  const [sharedProjects, setSharedProjects] = useState<ShareWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSharedProjects = useCallback(async () => {
    if (!user) {
      setSharedProjects([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (options?.includeSharedBy) {
        const data = await shareRepository.getUserSharedByProjects(user.id);
        setSharedProjects(data);
      } else {
        const data = await shareRepository.getUserSharedProjects(user.id);
        setSharedProjects(data);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch shared projects');
      setError(error);
      console.error('Error fetching shared projects:', error);
    } finally {
      setLoading(false);
    }
  }, [user, options?.includeSharedBy]);

  useEffect(() => {
    fetchSharedProjects();
  }, [fetchSharedProjects]);

  // Real-time updates
  useEffect(() => {
    if (!user) {
      return;
    }

    const subscription = shareRepository.subscribeToShares(user.id, {
      onInsert: () => fetchSharedProjects(),
      onUpdate: () => fetchSharedProjects(),
      onDelete: () => fetchSharedProjects(),
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchSharedProjects]);

  return {
    sharedProjects,
    loading,
    error,
    refetch: fetchSharedProjects,
  };
}

/**
 * Hook for project comments
 */
export function useProjectComments(projectId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchComments = useCallback(async () => {
    if (!projectId) {
      setComments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await commentRepository.findByProject(projectId);
      setComments(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch comments');
      setError(error);
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Real-time updates
  useEffect(() => {
    if (!projectId) {
      return;
    }

    const subscription = commentRepository.subscribeToComments(projectId, {
      onInsert: (comment) => {
        setComments((prev) => {
          // Check if it's a reply or top-level comment
          if (comment.parent_id) {
            // It's a reply, add to parent's replies
            return prev.map((c) =>
              c.id === comment.parent_id
                ? {
                    ...c,
                    replies: [...(c.replies || []), comment],
                  }
                : c
            );
          } else {
            // It's a top-level comment
            return [comment, ...prev];
          }
        });
      },
      onUpdate: (comment) => {
        setComments((prev) =>
          prev.map((c) =>
            c.id === comment.id
              ? comment
              : {
                  ...c,
                  replies: c.replies?.map((r) =>
                    r.id === comment.id ? comment : r
                  ),
                }
          )
        );
      },
      onDelete: (comment) => {
        setComments((prev) =>
          prev.filter((c) => c.id !== comment.id)
        );
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId]);

  const addComment = useCallback(async (
    content: string,
    parentId?: string,
    mentions?: string[]
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const result = await commentRepository.create({
        project_id: projectId,
        user_id: user.id,
        parent_id: parentId || null,
        content,
        mentions,
        resolved: false,
      });

      await fetchComments();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add comment');
      setError(error);
      throw error;
    }
  }, [projectId, user, fetchComments]);

  const updateComment = useCallback(async (
    commentId: string,
    content: string
  ) => {
    try {
      const result = await commentRepository.update(commentId, { content });
      await fetchComments();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update comment');
      setError(error);
      throw error;
    }
  }, [fetchComments]);

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      await commentRepository.delete(commentId);
      await fetchComments();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete comment');
      setError(error);
      throw error;
    }
  }, [fetchComments]);

  const toggleResolved = useCallback(async (commentId: string) => {
    try {
      const result = await commentRepository.toggleResolved(commentId);
      await fetchComments();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to toggle resolved');
      setError(error);
      throw error;
    }
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    refetch: fetchComments,
    addComment,
    updateComment,
    deleteComment,
    toggleResolved,
  };
}

/**
 * Hook for approval workflow
 */
export function useApprovalWorkflow(projectId?: string) {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (projectId) {
        const data = await approvalRepository.getProjectRequests(projectId);
        setApprovals(data);
      } else if (user) {
        const data = await approvalRepository.getPendingApprovals(user.id);
        setApprovals(data);
      } else {
        setApprovals([]);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch approvals');
      setError(error);
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const createRequest = useCallback(async (
    title: string,
    description?: string,
    data?: Record<string, any>
  ) => {
    if (!user || !projectId) {
      throw new Error('User not authenticated or project not specified');
    }

    try {
      const result = await approvalRepository.createRequest({
        projectId,
        requestedByUserId: user.id,
        title,
        description,
        data,
      });

      await fetchApprovals();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create approval request');
      setError(error);
      throw error;
    }
  }, [projectId, user, fetchApprovals]);

  const addAction = useCallback(async (
    approvalRequestId: string,
    actionType: 'approve' | 'reject' | 'request_changes' | 'comment',
    comment?: string
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const request = await approvalRepository.getRequest(approvalRequestId);
      if (!request) {
        throw new Error('Approval request not found');
      }

      const result = await approvalRepository.addAction({
        approvalRequestId,
        userId: user.id,
        actionType,
        comment,
        step: request.current_step,
      });

      await fetchApprovals();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add action');
      setError(error);
      throw error;
    }
  }, [user, fetchApprovals]);

  const cancelRequest = useCallback(async (approvalRequestId: string) => {
    try {
      await approvalRepository.cancelRequest(approvalRequestId);
      await fetchApprovals();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to cancel request');
      setError(error);
      throw error;
    }
  }, [fetchApprovals]);

  return {
    approvals,
    loading,
    error,
    refetch: fetchApprovals,
    createRequest,
    addAction,
    cancelRequest,
  };
}