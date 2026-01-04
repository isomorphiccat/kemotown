/**
 * tRPC Server Configuration
 * Sets up the tRPC context, router, and procedures
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from './db';
import { auth } from '@/lib/auth';

/**
 * Context creation for tRPC
 * This is called for each request and provides the context for all procedures
 */
export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  const session = await auth();

  return {
    db,
    session,
    headers: opts.req.headers,
  };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * Initialize tRPC with context type and transformer
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller for server components
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * Export router and procedure helpers
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 * Can be used by anyone, authenticated or not
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 * Requires a valid session - throws UNAUTHORIZED if not logged in
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      // Infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Middleware for logging procedure calls in development
 */
const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[tRPC] ${type} ${path} - ${duration}ms`);
  }

  return result;
});

/**
 * Procedure with logging (for development debugging)
 */
export const loggedProcedure = t.procedure.use(loggerMiddleware);
