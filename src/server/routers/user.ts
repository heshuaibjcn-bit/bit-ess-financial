/**
 * User Router
 *
 * Type-safe API endpoints for user operations
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { t, protectedProcedure } from '../trpc';
import { userRepository } from '../../repositories/UserRepository';
import { UserRole } from '../../services/security/RBAC';

export const userRouter = t.router({
  /**
   * Get current user profile
   */
  me: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await userRepository.findById(ctx.user.id);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),

  /**
   * Get user with statistics
   */
  meWithStats: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await userRepository.getWithStats(ctx.user.id);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),

  /**
   * Update user profile
   */
  update: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100).optional(),
      avatar_url: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updated = await userRepository.update(ctx.user.id, input);

      return updated;
    }),

  /**
   * Change password
   */
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(8),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify current password
      const isValid = await verifyPassword(ctx.user.id, input.currentPassword);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }

      // Update password
      await updatePassword(ctx.user.id, input.newPassword);

      return { success: true };
    }),

  /**
   * Update user role (admin only)
   */
  updateRole: protectedProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(['super_admin', 'admin', 'manager', 'user', 'viewer', 'guest']),
    }))
    .use(async ({ ctx, next }) => {
      // Only admins can update roles
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can update user roles',
        });
      }

      return next();
    })
    .mutation(async ({ input }) => {
      const updated = await userRepository.updateRole(input.userId, input.role as UserRole);

      return updated;
    }),

  /**
   * Search users
   */
  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().optional().default(20),
    }))
    .mutation(async ({ input }) => {
      const results = await userRepository.search(input.query, {
        limit: input.limit,
      });

      return results;
    }),
});

/**
 * Helper functions (implement these based on your auth system)
 */
async function verifyPassword(userId: string, password: string): Promise<boolean> {
  // Implement password verification
  // This is a placeholder
  return true;
}

async function updatePassword(userId: string, newPassword: string): Promise<void> {
  // Implement password update
  // This is a placeholder
}
