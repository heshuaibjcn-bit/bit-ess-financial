/**
 * Collaboration Router
 *
 * Type-safe API endpoints for collaboration features
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { t, protectedProcedure } from '../trpc';
import { shareRepository } from '../../repositories/ShareRepository';
import { commentRepository } from '../../repositories/CommentRepository';
import { approvalRepository } from '../../repositories/ApprovalRepository';

export const collaborationRouter = t.router({
  /**
   * Share project with user
   */
  shareProject: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      userId: z.string().optional(),
      permission: z.enum(['view', 'edit', 'admin']),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await projectRepository.findById(input.projectId);

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Check ownership
      if (project.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only share your own projects',
        });
      }

      const expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined;

      const share = await shareRepository.shareProject(
        input.projectId,
        ctx.user.id,
        {
          sharedToUserId: input.userId,
          permission: input.permission,
          expiresAt,
        }
      );

      return share;
    }),

  /**
   * Create public share link
   */
  createPublicLink: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      permission: z.enum(['view', 'edit', 'admin']),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await projectRepository.findById(input.projectId);

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Check ownership
      if (project.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only share your own projects',
        });
      }

      const expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined;

      const share = await shareRepository.createPublicShare(
        input.projectId,
        ctx.user.id,
        {
          permission: input.permission,
          expiresAt,
        }
      );

      return {
        shareToken: share.share_token,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL}/shared/${share.share_token}`,
      };
    }),

  /**
   * Get shared projects
   */
  getSharedProjects: protectedProcedure
    .query(async ({ ctx }) => {
      const shared = await shareRepository.getUserSharedProjects(ctx.user.id);

      return shared;
    }),

  /**
   * Get project shares
   */
  getProjectShares: protectedProcedure
    .input(z.object({
      projectId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const shares = await shareRepository.getProjectShares(input.projectId);

      return shares;
    }),

  /**
   * Update share permission
   */
  updateSharePermission: protectedProcedure
    .input(z.object({
      shareId: z.string(),
      permission: z.enum(['view', 'edit', 'admin']),
    }))
    .mutation(async ({ input }) => {
      const updated = await shareRepository.updatePermission(
        input.shareId,
        input.permission
      );

      return updated;
    }),

  /**
   * Revoke share
   */
  revokeShare: protectedProcedure
    .input(z.object({
      shareId: z.string(),
    }))
    .mutation(async ({ input }) => {
      await shareRepository.revokeShare(input.shareId);

      return { success: true };
    }),

  /**
   * Get project comments
   */
  getComments: protectedProcedure
    .input(z.object({
      projectId: z.string(),
    }))
    .query(async ({ input }) => {
      const comments = await commentRepository.findByProject(input.projectId);

      return comments;
    }),

  /**
   * Add comment
   */
  addComment: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      content: z.string().min(1),
      parentId: z.string().optional(),
      mentions: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const comment = await commentRepository.create({
        project_id: input.projectId,
        user_id: ctx.user.id,
        parent_id: input.parentId || null,
        content: input.content,
        mentions: input.mentions,
        resolved: false,
      });

      return comment;
    }),

  /**
   * Update comment
   */
  updateComment: protectedProcedure
    .input(z.object({
      commentId: z.string(),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const comment = await commentRepository.findById(input.commentId);

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      // Check ownership
      if (comment.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own comments',
        });
      }

      const updated = await commentRepository.update(input.commentId, {
        content: input.content,
      });

      return updated;
    }),

  /**
   * Delete comment
   */
  deleteComment: protectedProcedure
    .input(z.object({
      commentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const comment = await commentRepository.findById(input.commentId);

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      // Check ownership
      if (comment.user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own comments',
        });
      }

      await commentRepository.delete(input.commentId);

      return { success: true };
    }),

  /**
   * Toggle comment resolved
   */
  toggleCommentResolved: protectedProcedure
    .input(z.object({
      commentId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const updated = await commentRepository.toggleResolved(input.commentId);

      return updated;
    }),

  /**
   * Create approval request
   */
  createApprovalRequest: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      title: z.string().min(1),
      description: z.string().optional(),
      data: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const request = await approvalRepository.createRequest({
        projectId: input.projectId,
        requestedByUserId: ctx.user.id,
        title: input.title,
        description: input.description,
        data: input.data,
      });

      return request;
    }),

  /**
   * Get project approval requests
   */
  getApprovalRequests: protectedProcedure
    .input(z.object({
      projectId: z.string(),
    }))
    .query(async ({ input }) => {
      const requests = await approvalRepository.getProjectRequests(input.projectId);

      return requests;
    }),

  /**
   * Get pending approvals
   */
  getPendingApprovals: protectedProcedure
    .query(async ({ ctx }) => {
      const requests = await approvalRepository.getPendingApprovals(ctx.user.id);

      return requests;
    }),

  /**
   * Add approval action
   */
  addApprovalAction: protectedProcedure
    .input(z.object({
      approvalRequestId: z.string(),
      action: z.enum(['approve', 'reject', 'request_changes', 'comment']),
      comment: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const action = await approvalRepository.addAction({
        approvalRequestId: input.approvalRequestId,
        userId: ctx.user.id,
        actionType: input.action,
        comment: input.comment,
      });

      return action;
    }),

  /**
   * Cancel approval request
   */
  cancelApprovalRequest: protectedProcedure
    .input(z.object({
      approvalRequestId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const request = await approvalRepository.getRequest(input.approvalRequestId);

      if (!request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Approval request not found',
        });
      }

      // Check ownership
      if (request.requested_by_user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only cancel your own requests',
        });
      }

      await approvalRepository.cancelRequest(input.approvalRequestId);

      return { success: true };
    }),
});

// Import projectRepository for access checks
import { projectRepository } from './project';
