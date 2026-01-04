/**
 * Context tRPC Router
 * Handles Context (Group, Event, Convention) operations
 *
 * Contexts are unified containers that can be extended by plugins.
 * A GROUP context with the "event" plugin becomes an Event.
 * A GROUP context with the "group" plugin becomes a Group.
 */

import { TRPCError } from '@trpc/server';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/server/trpc';
import {
  createContextSchema,
  updateContextSchema,
  updatePluginDataSchema,
  getContextByIdSchema,
  getContextBySlugSchema,
  listContextsSchema,
  joinContextSchema,
  leaveContextSchema,
  archiveContextSchema,
  transferOwnershipSchema,
} from '@/schemas/context.schema';
import { contextService } from '@/server/services/context.service';

export const contextRouter = createTRPCRouter({
  // ==========================================================================
  // Context CRUD
  // ==========================================================================

  /**
   * Create a new context
   * Requires authentication
   */
  create: protectedProcedure
    .input(createContextSchema)
    .mutation(async ({ ctx, input }) => {
      const context = await contextService.create({
        ...input,
        ownerId: ctx.session.user.id,
      });
      return context;
    }),

  /**
   * Update a context
   * Requires OWNER or ADMIN role
   */
  update: protectedProcedure
    .input(updateContextSchema)
    .mutation(async ({ ctx, input }) => {
      const { contextId, ...data } = input;
      const context = await contextService.update(
        contextId,
        data,
        ctx.session.user.id
      );
      return context;
    }),

  /**
   * Update plugin data for a context
   * Requires OWNER or ADMIN role
   */
  updatePluginData: protectedProcedure
    .input(updatePluginDataSchema)
    .mutation(async ({ ctx, input }) => {
      await contextService.updatePluginData(
        input.contextId,
        input.pluginId,
        input.data as Record<string, unknown>,
        ctx.session.user.id
      );
      return { success: true };
    }),

  /**
   * Archive a context (soft delete)
   * Requires OWNER role
   */
  archive: protectedProcedure
    .input(archiveContextSchema)
    .mutation(async ({ ctx, input }) => {
      await contextService.archive(input.contextId, ctx.session.user.id);
      return { success: true };
    }),

  // ==========================================================================
  // Context Queries
  // ==========================================================================

  /**
   * Get context by ID
   * Public contexts are visible to all; private require membership
   */
  getById: publicProcedure
    .input(getContextByIdSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const context = await contextService.getById(input.contextId, userId);

      if (!context) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Context not found',
        });
      }

      // Check access for private contexts
      if (context.visibility === 'PRIVATE') {
        if (!userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Login required to view this context',
          });
        }
        const canAccess = await contextService.canAccess(input.contextId, userId);
        if (!canAccess) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this context',
          });
        }
      }

      return context;
    }),

  /**
   * Get context by slug
   */
  getBySlug: publicProcedure
    .input(getContextBySlugSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const context = await contextService.getBySlug(input.slug, userId);

      if (!context) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Context not found',
        });
      }

      // Check access for private contexts
      if (context.visibility === 'PRIVATE') {
        if (!userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Login required to view this context',
          });
        }
        const canAccess = await contextService.canAccess(context.id, userId);
        if (!canAccess) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this context',
          });
        }
      }

      return context;
    }),

  /**
   * List contexts with pagination and filters
   * Only shows PUBLIC and UNLISTED contexts unless user is member
   */
  list: publicProcedure
    .input(listContextsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;

      // Non-authenticated users only see PUBLIC contexts
      const visibility = !userId && !input.visibility ? 'PUBLIC' : input.visibility;

      const result = await contextService.list({
        ...input,
        visibility,
      });

      return result;
    }),

  // ==========================================================================
  // Membership Actions
  // ==========================================================================

  /**
   * Join a context
   * Returns pending status if approval required
   */
  join: protectedProcedure
    .input(joinContextSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await contextService.join(
        input.contextId,
        ctx.session.user.id
      );
      return result;
    }),

  /**
   * Leave a context
   * Owner cannot leave (must transfer ownership first)
   */
  leave: protectedProcedure
    .input(leaveContextSchema)
    .mutation(async ({ ctx, input }) => {
      await contextService.leave(input.contextId, ctx.session.user.id);
      return { success: true };
    }),

  /**
   * Transfer ownership to another member
   * Requires OWNER role
   */
  transferOwnership: protectedProcedure
    .input(transferOwnershipSchema)
    .mutation(async ({ ctx, input }) => {
      await contextService.transferOwnership(
        input.contextId,
        input.newOwnerId,
        ctx.session.user.id
      );
      return { success: true };
    }),
});
