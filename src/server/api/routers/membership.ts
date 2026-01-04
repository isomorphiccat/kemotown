/**
 * Membership tRPC Router
 * Handles membership operations within contexts (role management, approvals, bans)
 */

import { TRPCError } from '@trpc/server';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/server/trpc';
import {
  getMembershipSchema,
  listMembershipsSchema,
  getUserMembershipsSchema,
  updateRoleSchema,
  approveRejectSchema,
  banUnbanSchema,
  updateMemberPluginDataSchema,
  updateNotificationsSchema,
} from '@/schemas/membership.schema';
import { membershipService } from '@/server/services/membership.service';

export const membershipRouter = createTRPCRouter({
  // ==========================================================================
  // Membership Queries
  // ==========================================================================

  /**
   * Get a specific membership
   */
  get: publicProcedure
    .input(getMembershipSchema)
    .query(async ({ input }) => {
      const membership = await membershipService.get(
        input.contextId,
        input.userId
      );

      if (!membership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Membership not found',
        });
      }

      return membership;
    }),

  /**
   * Get current user's membership in a context
   */
  getMine: protectedProcedure
    .input(getMembershipSchema.pick({ contextId: true }))
    .query(async ({ ctx, input }) => {
      const membership = await membershipService.get(
        input.contextId,
        ctx.session.user.id
      );
      return membership;
    }),

  /**
   * List members of a context
   * Supports filtering by status and role
   */
  list: publicProcedure
    .input(listMembershipsSchema)
    .query(async ({ input }) => {
      const result = await membershipService.list(input);
      return result;
    }),

  /**
   * Count members by status
   * Useful for displaying pending approval counts
   */
  countByStatus: protectedProcedure
    .input(getMembershipSchema.pick({ contextId: true }))
    .query(async ({ input }) => {
      const counts = await membershipService.countByStatus(input.contextId);
      return counts;
    }),

  /**
   * Get current user's memberships across all contexts
   */
  myMemberships: protectedProcedure
    .input(getUserMembershipsSchema)
    .query(async ({ ctx, input }) => {
      const result = await membershipService.getUserMemberships(
        ctx.session.user.id,
        input
      );
      return result;
    }),

  // ==========================================================================
  // Role Management
  // ==========================================================================

  /**
   * Update a member's role
   * Requires appropriate permissions based on role hierarchy
   */
  updateRole: protectedProcedure
    .input(updateRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const membership = await membershipService.updateRole(
        input.contextId,
        input.userId,
        input.role,
        ctx.session.user.id
      );
      return membership;
    }),

  // ==========================================================================
  // Approval Actions
  // ==========================================================================

  /**
   * Approve a pending membership
   * Requires MODERATOR+ role
   */
  approve: protectedProcedure
    .input(approveRejectSchema)
    .mutation(async ({ ctx, input }) => {
      const membership = await membershipService.approve(
        input.contextId,
        input.userId,
        ctx.session.user.id
      );
      return membership;
    }),

  /**
   * Reject a pending membership
   * Requires MODERATOR+ role
   */
  reject: protectedProcedure
    .input(approveRejectSchema)
    .mutation(async ({ ctx, input }) => {
      await membershipService.reject(
        input.contextId,
        input.userId,
        ctx.session.user.id
      );
      return { success: true };
    }),

  // ==========================================================================
  // Ban Actions
  // ==========================================================================

  /**
   * Ban a member
   * Requires MODERATOR+ role and cannot ban equal/higher roles
   */
  ban: protectedProcedure
    .input(banUnbanSchema)
    .mutation(async ({ ctx, input }) => {
      const membership = await membershipService.ban(
        input.contextId,
        input.userId,
        ctx.session.user.id
      );
      return membership;
    }),

  /**
   * Unban a member
   * Requires MODERATOR+ role
   */
  unban: protectedProcedure
    .input(banUnbanSchema)
    .mutation(async ({ ctx, input }) => {
      const membership = await membershipService.unban(
        input.contextId,
        input.userId,
        ctx.session.user.id
      );
      return membership;
    }),

  // ==========================================================================
  // Plugin Data & Preferences
  // ==========================================================================

  /**
   * Update plugin data for a membership
   * Can update own data, or others if ADMIN+
   */
  updatePluginData: protectedProcedure
    .input(updateMemberPluginDataSchema)
    .mutation(async ({ ctx, input }) => {
      const targetUserId = input.userId ?? ctx.session.user.id;
      const membership = await membershipService.updatePluginData(
        input.contextId,
        targetUserId,
        input.pluginId,
        input.data as Record<string, unknown>,
        input.userId ? ctx.session.user.id : undefined
      );
      return membership;
    }),

  /**
   * Update notification preferences for current user's membership
   */
  updateNotifications: protectedProcedure
    .input(updateNotificationsSchema)
    .mutation(async ({ ctx, input }) => {
      const { contextId, ...preferences } = input;
      const membership = await membershipService.updateNotifications(
        contextId,
        ctx.session.user.id,
        preferences
      );
      return membership;
    }),
});
