/**
 * Follow Router
 * Handles follow/unfollow relationships between users
 *
 * Uses ActivityPub-style Activity/InboxItem model for notifications
 * instead of a separate Notification table.
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';
import {
  followUserSchema,
  unfollowUserSchema,
  respondToFollowSchema,
  isFollowingSchema,
  listFollowsSchema,
  listPendingRequestsSchema,
} from '@/schemas/follow.schema';
import {
  followUser,
  unfollowUser,
  acceptFollowRequest,
  rejectFollowRequest,
  isFollowing,
  getFollowStatus,
  getFollowers,
  getFollowing,
  getPendingRequests,
  getFollowCounts,
  getPendingRequestCount,
} from '@/server/services/follow.service';

export const followRouter = createTRPCRouter({
  /**
   * Follow a user
   * Uses the follow service which handles:
   * - requiresFollowApproval check
   * - Activity creation for ActivityPub compliance
   * - InboxItem delivery for notifications
   */
  follow: protectedProcedure
    .input(followUserSchema)
    .mutation(async ({ ctx, input }) => {
      return followUser(ctx.session.user.id, input.targetUserId);
    }),

  /**
   * Unfollow a user
   */
  unfollow: protectedProcedure
    .input(unfollowUserSchema)
    .mutation(async ({ ctx, input }) => {
      return unfollowUser(ctx.session.user.id, input.targetUserId);
    }),

  /**
   * Accept a follow request
   */
  accept: protectedProcedure
    .input(z.object({ followerId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return acceptFollowRequest(ctx.session.user.id, input.followerId);
    }),

  /**
   * Reject a follow request
   */
  reject: protectedProcedure
    .input(z.object({ followerId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return rejectFollowRequest(ctx.session.user.id, input.followerId);
    }),

  /**
   * Respond to a follow request (accept or reject)
   */
  respond: protectedProcedure
    .input(respondToFollowSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.action === 'accept') {
        return acceptFollowRequest(ctx.session.user.id, input.followerId);
      } else {
        return rejectFollowRequest(ctx.session.user.id, input.followerId);
      }
    }),

  /**
   * Check if current user is following a specific user
   * Note: Returns true only if the follow is ACCEPTED
   */
  isFollowing: protectedProcedure
    .input(isFollowingSchema)
    .query(async ({ ctx, input }) => {
      const result = await isFollowing(ctx.session.user.id, input.targetUserId);
      return { isFollowing: result };
    }),

  /**
   * Get detailed follow status between current user and target
   * Includes: isFollowing, isFollowedBy, and pending status
   */
  getStatus: protectedProcedure
    .input(z.object({ targetUserId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return getFollowStatus(ctx.session.user.id, input.targetUserId);
    }),

  /**
   * Get followers of a user
   */
  getFollowers: publicProcedure
    .input(listFollowsSchema)
    .query(async ({ input }) => {
      return getFollowers(input.userId, input.cursor, input.limit);
    }),

  /**
   * Get users that a user is following
   */
  getFollowing: publicProcedure
    .input(listFollowsSchema)
    .query(async ({ input }) => {
      return getFollowing(input.userId, input.cursor, input.limit);
    }),

  /**
   * Get pending follow requests for current user
   */
  getPendingRequests: protectedProcedure
    .input(listPendingRequestsSchema)
    .query(async ({ ctx, input }) => {
      return getPendingRequests(ctx.session.user.id, input.cursor, input.limit);
    }),

  /**
   * Get follow counts for a user
   */
  getCounts: publicProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .query(async ({ input }) => {
      return getFollowCounts(input.userId);
    }),

  /**
   * Get pending request count for current user
   */
  getPendingCount: protectedProcedure.query(async ({ ctx }) => {
    return getPendingRequestCount(ctx.session.user.id);
  }),
});
