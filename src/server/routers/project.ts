/**
 * Project Router
 *
 * Type-safe API endpoints for project operations
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { t, protectedProcedure } from '../trpc';
import { projectRepository } from '../../repositories/ProjectRepository';
import { ProjectInput } from '../../domain/schemas/ProjectSchema';
import { CalculationEngine } from '../../domain/services/CalculationEngine';

export const projectRouter = t.router({
  /**
   * List all projects for current user
   */
  list: protectedProcedure
    .input(z.object({
      includeDemo: z.boolean().optional().default(false),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const projects = await projectRepository.findByUserId(ctx.user.id, {
        includeDemo: input.includeDemo,
        limit: input.limit,
        offset: input.offset,
      });

      return projects;
    }),

  /**
   * Get single project by ID
   */
  byId: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const project = await projectRepository.findById(input.id);

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Check access
      if (project.user_id !== ctx.user.id) {
        // Check if shared with user
        const hasAccess = await shareRepository.checkAccess(input.id, ctx.user.id);
        if (!hasAccess.hasAccess) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this project',
          });
        }
      }

      return project;
    }),

  /**
   * Create new project
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      description: z.string().optional(),
      input: z.custom<ProjectInput>(),
      saveToDatabase: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Calculate results
      const engine = new CalculationEngine();
      const result = engine.calculate(input.input);

      if (input.saveToDatabase) {
        // Save to database
        const project = await projectRepository.createFromCalculation(
          ctx.user.id,
          input.name,
          input.input,
          result,
          {
            description: input.description,
            isDemo: false,
          }
        );

        return {
          project,
          result,
        };
      }

      // Return result without saving
      return {
        project: null,
        result,
      };
    }),

  /**
   * Update project
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await projectRepository.findById(input.id);

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
          message: 'You can only update your own projects',
        });
      }

      // Update project
      const updated = await projectRepository.update(input.id, {
        name: input.name,
        description: input.description,
      });

      return updated;
    }),

  /**
   * Delete project
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await projectRepository.findById(input.id);

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
          message: 'You can only delete your own projects',
        });
      }

      await projectRepository.delete(input.id);

      return { success: true };
    }),

  /**
   * Clone project
   */
  clone: protectedProcedure
    .input(z.object({
      id: z.string(),
      newName: z.string().min(1).max(200),
    }))
    .mutation(async ({ ctx, input }) => {
      const project = await projectRepository.findById(input.id);

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        });
      }

      // Check access
      if (project.user_id !== ctx.user.id) {
        const hasAccess = await shareRepository.checkAccess(input.id, ctx.user.id);
        if (!hasAccess.hasAccess || hasAccess.permission === 'view') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to clone this project',
          });
        }
      }

      const cloned = await projectRepository.cloneProject(input.id, input.newName);

      return cloned;
    }),

  /**
   * Get project statistics
   */
  statistics: protectedProcedure
    .query(async ({ ctx }) => {
      const stats = await projectRepository.getStatistics(ctx.user.id);

      return stats;
    }),

  /**
   * Search projects
   */
  search: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      limit: z.number().optional().default(20),
      offset: z.number().optional().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const results = await projectRepository.search(
        ctx.user.id,
        input.query,
        {
          limit: input.limit,
          offset: input.offset,
        }
      );

      return results;
    }),
});

// Import shareRepository for access checks
import { shareRepository } from './collaboration';