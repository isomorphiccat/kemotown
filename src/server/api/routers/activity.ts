/**
 * Activity tRPC Router
 * Handles ActivityPub-style activities (posts, likes, reposts, etc.)
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/server/trpc';
import {
  createNoteActivitySchema,
  createLikeActivitySchema,
  createAnnounceActivitySchema,
  updateActivitySchema,
  deleteActivitySchema,
  getActivitySchema,
  getRepliesSchema,
  getLikesSchema,
  getRepostsSchema,
  publicTimelineSchema,
  homeTimelineSchema,
  userTimelineSchema,
} from '@/schemas/activity.schema';
import {
  createNoteActivity,
  createLikeActivity,
  createAnnounceActivity,
  removeLikeActivity,
  removeAnnounceActivity,
  updateActivity,
  deleteActivity,
  getActivityById,
  getLikesCount,
  getRepostsCount,
  hasUserLiked,
  hasUserReposted,
} from '@/server/services/activity.service';
import {
  getPublicTimeline,
  getHomeTimeline,
  getContextTimeline,
  getActivityThread,
  getUserTimeline,
  getReplies,
  getLikers,
  getReposters,
} from '@/server/services/timeline.service';
import { contextTimelineSchema } from '@/schemas/activity.schema';

export const activityRouter = createTRPCRouter({
  // ==========================================================================
  // Activity CRUD
  // ==========================================================================

  /**
   * Create a new Note activity (post, comment, DM)
   */
  createNote: protectedProcedure
    .input(createNoteActivitySchema)
    .mutation(async ({ ctx, input }) => {
      const activity = await createNoteActivity(ctx.session.user.id, input);
      return activity;
    }),

  /**
   * Like an activity
   */
  like: protectedProcedure
    .input(createLikeActivitySchema)
    .mutation(async ({ ctx, input }) => {
      const activity = await createLikeActivity(ctx.session.user.id, input);
      return activity;
    }),

  /**
   * Unlike an activity
   */
  unlike: protectedProcedure
    .input(z.object({ targetActivityId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await removeLikeActivity(ctx.session.user.id, input.targetActivityId);
      return { success: true };
    }),

  /**
   * Repost (announce) an activity
   */
  repost: protectedProcedure
    .input(createAnnounceActivitySchema)
    .mutation(async ({ ctx, input }) => {
      const activity = await createAnnounceActivity(ctx.session.user.id, input);
      return activity;
    }),

  /**
   * Remove a repost
   */
  unrepost: protectedProcedure
    .input(z.object({ targetActivityId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await removeAnnounceActivity(ctx.session.user.id, input.targetActivityId);
      return { success: true };
    }),

  /**
   * Update an activity (edit content)
   */
  update: protectedProcedure
    .input(updateActivitySchema)
    .mutation(async ({ ctx, input }) => {
      const activity = await updateActivity(ctx.session.user.id, input);
      return activity;
    }),

  /**
   * Delete an activity
   */
  delete: protectedProcedure
    .input(deleteActivitySchema)
    .mutation(async ({ ctx, input }) => {
      await deleteActivity(ctx.session.user.id, input.activityId);
      return { success: true };
    }),

  // ==========================================================================
  // Activity Queries
  // ==========================================================================

  /**
   * Get activity by ID
   */
  getById: publicProcedure
    .input(getActivitySchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id ?? null;
      const activity = await getActivityById(input.activityId, userId);

      if (!activity) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Activity not found',
        });
      }

      // Get engagement counts and user state
      const [likesCount, repostsCount, liked, reposted] = await Promise.all([
        getLikesCount(activity.id),
        getRepostsCount(activity.id),
        userId ? hasUserLiked(activity.id, userId) : false,
        userId ? hasUserReposted(activity.id, userId) : false,
      ]);

      return {
        ...activity,
        likesCount,
        repostsCount,
        liked,
        reposted,
      };
    }),

  /**
   * Get replies to an activity
   */
  getReplies: publicProcedure
    .input(getRepliesSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id ?? null;
      const result = await getReplies(
        input.activityId,
        { cursor: input.cursor, limit: input.limit },
        userId
      );
      return result;
    }),

  /**
   * Get users who liked an activity
   */
  getLikers: publicProcedure
    .input(getLikesSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id ?? null;
      const result = await getLikers(
        input.activityId,
        { cursor: input.cursor, limit: input.limit },
        userId
      );
      return result;
    }),

  /**
   * Get users who reposted an activity
   */
  getReposters: publicProcedure
    .input(getRepostsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id ?? null;
      const result = await getReposters(
        input.activityId,
        { cursor: input.cursor, limit: input.limit },
        userId
      );
      return result;
    }),

  /**
   * Get activity thread (root activity + all replies)
   */
  getThread: publicProcedure
    .input(getActivitySchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id ?? null;
      try {
        const result = await getActivityThread(input.activityId, userId);
        return result;
      } catch {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Activity not found',
        });
      }
    }),

  // ==========================================================================
  // Timeline Queries
  // ==========================================================================

  /**
   * Get public timeline
   */
  publicTimeline: publicProcedure
    .input(publicTimelineSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id ?? null;
      const result = await getPublicTimeline(
        {
          cursor: input.cursor,
          limit: input.limit,
          includeReplies: input.includeReplies,
        },
        userId
      );
      return result;
    }),

  /**
   * Get home timeline (posts from followed users + own posts)
   */
  homeTimeline: protectedProcedure
    .input(homeTimelineSchema)
    .query(async ({ ctx, input }) => {
      const result = await getHomeTimeline(ctx.session.user.id, {
        cursor: input.cursor,
        limit: input.limit,
        includeReplies: input.includeReplies,
      });
      return result;
    }),

  /**
   * Get context timeline (posts in a group, event, or convention)
   * Uses the unified context addressing system
   */
  contextTimeline: publicProcedure
    .input(contextTimelineSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id ?? null;

      // Check if context exists and user can view it
      const context = await ctx.db.context.findUnique({
        where: { id: input.contextId },
        select: { id: true, visibility: true },
      });

      if (!context) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Context not found',
        });
      }

      // For private contexts, user must be a member
      if (context.visibility === 'PRIVATE') {
        if (!userId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to view this content',
          });
        }

        const membership = await ctx.db.membership.findUnique({
          where: { contextId_userId: { contextId: input.contextId, userId } },
          select: { status: true },
        });

        if (membership?.status !== 'APPROVED') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You must be a member to view this content',
          });
        }
      }

      const result = await getContextTimeline(
        input.contextId,
        {
          cursor: input.cursor,
          limit: input.limit,
          includeReplies: input.includeReplies,
        },
        userId
      );
      return result;
    }),

  /**
   * Get user timeline (a specific user's posts)
   */
  userTimeline: publicProcedure
    .input(userTimelineSchema)
    .query(async ({ ctx, input }) => {
      const viewerId = ctx.session?.user?.id ?? null;

      // Check if user exists
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { id: true, isPublic: true },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Private profiles - only visible to self or followers
      if (user.isPublic === false && viewerId !== input.userId) {
        if (!viewerId) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'This profile is private',
          });
        }

        const follow = await ctx.db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerId,
              followingId: input.userId,
            },
          },
          select: { status: true },
        });

        if (follow?.status !== 'ACCEPTED') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This profile is private',
          });
        }
      }

      const result = await getUserTimeline(
        input.userId,
        {
          cursor: input.cursor,
          limit: input.limit,
          includeReplies: input.includeReplies,
          includeReposts: input.includeReposts,
        },
        viewerId
      );
      return result;
    }),
});
