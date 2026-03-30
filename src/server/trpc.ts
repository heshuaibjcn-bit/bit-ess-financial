/**
 * tRPC API Configuration
 *
 * Type-safe API with end-to-end type safety
 */

import { initTRPC } from '@trpc/server';
import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import * as trpcNext from '@trpc/server/adapters/next';
import { z } from 'zod';

/**
 * Create context for tRPC
 */
export async function createContext(opts: CreateNextContextOptions) {
  const { req, res } = opts;

  // Get user from session
  const user = await getCurrentUser(req);

  return {
    req,
    res,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * Initialize tRPC
 */
const t = initTRPC.context<Context>().create();

/**
 * Protected procedure - requires authentication
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Not authenticated');
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const publicProcedure = t.procedure;

/**
 * tRPC Router
 */
import { projectRouter } from './routers/project';
import { userRouter } from './routers/user';
import { calculationRouter } from './routers/calculation';
import { collaborationRouter } from './routers/collaboration';

const appRouter = t.router({
  project: projectRouter,
  user: userRouter,
  calculation: calculationRouter,
  collaboration: collaborationRouter,
});

export type AppRouter = typeof appRouter;

/**
 * tRPC Server Handler
 */
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
});

/**
 * Helper to get current user from request
 */
async function getCurrentUser(req: any) {
  // Implement user authentication logic
  // For example, decode JWT from headers
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  // Verify token and return user
  // This is a placeholder - implement actual JWT verification
  try {
    const user = await verifyToken(token);
    return user;
  } catch (error) {
    return null;
  }
}

async function verifyToken(token: string) {
  // Implement JWT verification
  // For now, return mock user
  return {
    id: 'user-id',
    email: 'user@example.com',
    name: 'Test User',
    role: 'user',
  };
}
