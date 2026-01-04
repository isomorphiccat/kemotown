/**
 * Group Plugin tRPC Router
 * Handles group-specific operations: moderation, polls, announcements
 */

import { TRPCError } from '@trpc/server';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/server/trpc';
import {
  createAnnouncementSchema,
  createPollSchema,
  votePollSchema,
  issueWarningSchema,
  muteMemberSchema,
  unmuteMemberSchema,
  assignRoleSchema,
  getModLogsSchema,
  getGroupStatsSchema,
} from '@/schemas/group-plugin.schema';
import type { GroupPluginData } from '@/lib/plugins/group/schema';
import { issueMemberWarning, canUserPost } from '@/lib/plugins/group/hooks';

export const groupPluginRouter = createTRPCRouter({
  // ==========================================================================
  // Announcement Operations
  // ==========================================================================

  /**
   * Create announcement (admin only)
   */
  createAnnouncement: protectedProcedure
    .input(createAnnouncementSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify user is admin
      const membership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId } },
        select: { role: true, status: true },
      });

      if (!membership || membership.status !== 'APPROVED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this group',
        });
      }

      if (!['OWNER', 'ADMIN'].includes(membership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can create announcements',
        });
      }

      // Create announcement activity
      const activity = await ctx.db.activity.create({
        data: {
          type: 'CREATE',
          actorType: 'USER',
          actorId: userId,
          objectType: 'NOTE',
          object: {
            content: input.content,
            type: 'announcement',
            pinned: input.pinned,
          },
          to: [`context:${input.contextId}`],
          cc: [],
          contextId: input.contextId,
        },
      });

      return { success: true, activityId: activity.id };
    }),

  // ==========================================================================
  // Poll Operations
  // ==========================================================================

  /**
   * Create poll
   */
  createPoll: protectedProcedure
    .input(createPollSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify user can create polls
      const membership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId } },
        select: { role: true, status: true },
      });

      if (!membership || membership.status !== 'APPROVED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this group',
        });
      }

      if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create polls',
        });
      }

      // Create poll activity
      const activity = await ctx.db.activity.create({
        data: {
          type: 'CREATE',
          actorType: 'USER',
          actorId: userId,
          objectType: 'NOTE',
          object: {
            type: 'poll',
            question: input.question,
            options: input.options.map((opt, idx) => ({
              index: idx,
              text: opt,
              votes: 0,
            })),
            allowMultiple: input.allowMultiple,
            endsAt: input.endsAt,
            votes: {},
          },
          to: [`context:${input.contextId}`],
          cc: [],
          contextId: input.contextId,
        },
      });

      return { success: true, pollId: activity.id };
    }),

  /**
   * Vote on poll
   */
  votePoll: protectedProcedure
    .input(votePollSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get the poll activity
      const poll = await ctx.db.activity.findUnique({
        where: { id: input.pollId },
        select: { object: true, contextId: true },
      });

      if (!poll) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Poll not found',
        });
      }

      // Verify user is member
      const membership = await ctx.db.membership.findUnique({
        where: {
          contextId_userId: {
            contextId: poll.contextId || input.contextId,
            userId,
          },
        },
        select: { status: true },
      });

      if (!membership || membership.status !== 'APPROVED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be a member to vote',
        });
      }

      const pollData = poll.object as {
        type: string;
        options: Array<{ index: number; text: string; votes: number }>;
        allowMultiple: boolean;
        endsAt?: string;
        votes: Record<string, number[]>;
      };

      if (pollData.type !== 'poll') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This is not a poll',
        });
      }

      // Check if poll ended
      if (pollData.endsAt && new Date(pollData.endsAt) < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Poll has ended',
        });
      }

      // Validate option indices
      for (const idx of input.optionIndices) {
        if (idx >= pollData.options.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid option index',
          });
        }
      }

      if (!pollData.allowMultiple && input.optionIndices.length > 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This poll only allows one vote',
        });
      }

      // Remove previous votes
      const previousVotes = pollData.votes[userId] || [];
      for (const idx of previousVotes) {
        pollData.options[idx].votes--;
      }

      // Add new votes
      for (const idx of input.optionIndices) {
        pollData.options[idx].votes++;
      }
      pollData.votes[userId] = input.optionIndices;

      // Update poll
      await ctx.db.activity.update({
        where: { id: input.pollId },
        data: { object: pollData },
      });

      return { success: true };
    }),

  // ==========================================================================
  // Moderation Operations
  // ==========================================================================

  /**
   * Issue warning to member
   */
  issueWarning: protectedProcedure
    .input(issueWarningSchema)
    .mutation(async ({ ctx, input }) => {
      const modId = ctx.session.user.id;

      // Verify moderator permission
      const modMembership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId: modId } },
        select: { role: true, status: true },
      });

      if (!modMembership || modMembership.status !== 'APPROVED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this group',
        });
      }

      if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(modMembership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to issue warnings',
        });
      }

      // Issue the warning
      const warningCount = await issueMemberWarning(
        input.contextId,
        input.userId,
        input.reason
      );

      return { success: true, warningCount };
    }),

  /**
   * Mute member
   */
  muteMember: protectedProcedure
    .input(muteMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const modId = ctx.session.user.id;

      // Verify moderator permission
      const modMembership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId: modId } },
        select: { role: true, status: true },
      });

      if (!modMembership || modMembership.status !== 'APPROVED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this group',
        });
      }

      if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(modMembership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to mute members',
        });
      }

      // Get target membership
      const targetMembership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId: input.userId } },
      });

      if (!targetMembership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }

      const mutedUntil = new Date(Date.now() + input.duration * 1000);

      const pluginData = (targetMembership.pluginData as Record<string, unknown>) || {};
      const groupData = (pluginData.group as Record<string, unknown>) || {};

      await ctx.db.membership.update({
        where: { id: targetMembership.id },
        data: {
          pluginData: {
            ...pluginData,
            group: {
              ...groupData,
              mutedUntil: mutedUntil.toISOString(),
              mutedBy: modId,
              muteReason: input.reason,
            },
          },
        },
      });

      return { success: true, mutedUntil };
    }),

  /**
   * Unmute member
   */
  unmuteMember: protectedProcedure
    .input(unmuteMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const modId = ctx.session.user.id;

      // Verify moderator permission
      const modMembership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId: modId } },
        select: { role: true, status: true },
      });

      if (!modMembership || modMembership.status !== 'APPROVED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this group',
        });
      }

      if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(modMembership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to unmute members',
        });
      }

      // Get target membership
      const targetMembership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId: input.userId } },
      });

      if (!targetMembership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }

      const pluginData = (targetMembership.pluginData as Record<string, unknown>) || {};
      const groupData = (pluginData.group as Record<string, unknown>) || {};

      // Remove mute
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { mutedUntil, mutedBy, muteReason, ...restGroupData } = groupData;

      const newPluginData = {
        ...pluginData,
        group: Object.keys(restGroupData).length > 0 ? restGroupData : undefined,
      };

      await ctx.db.membership.update({
        where: { id: targetMembership.id },
        data: {
          pluginData: JSON.parse(JSON.stringify(newPluginData)),
        },
      });

      return { success: true };
    }),

  /**
   * Assign custom role to member
   */
  assignRole: protectedProcedure
    .input(assignRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const adminId = ctx.session.user.id;

      // Verify admin permission
      const adminMembership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId: adminId } },
        select: { role: true, status: true },
      });

      if (!adminMembership || adminMembership.status !== 'APPROVED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this group',
        });
      }

      if (!['OWNER', 'ADMIN'].includes(adminMembership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can assign custom roles',
        });
      }

      // Verify role exists in group settings
      const context = await ctx.db.context.findUnique({
        where: { id: input.contextId },
        select: { plugins: true },
      });

      const groupData = (context?.plugins as Record<string, unknown>)?.group as
        | GroupPluginData
        | undefined;

      const roleExists = groupData?.customRoles?.some(
        (r) => r.name === input.roleName
      );

      if (!roleExists) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Role "${input.roleName}" does not exist`,
        });
      }

      // Get target membership
      const targetMembership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId: input.userId } },
      });

      if (!targetMembership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found',
        });
      }

      const pluginData = (targetMembership.pluginData as Record<string, unknown>) || {};
      const memberGroupData = (pluginData.group as Record<string, unknown>) || {};

      await ctx.db.membership.update({
        where: { id: targetMembership.id },
        data: {
          pluginData: {
            ...pluginData,
            group: {
              ...memberGroupData,
              customRole: input.roleName,
            },
          },
        },
      });

      return { success: true };
    }),

  // ==========================================================================
  // Query Operations
  // ==========================================================================

  /**
   * Check if user can post (respects slow mode)
   */
  canPost: protectedProcedure
    .input(getGroupStatsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      return await canUserPost(input.contextId, userId);
    }),

  /**
   * Get moderation logs
   */
  getModLogs: protectedProcedure
    .input(getModLogsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify user can view mod logs
      const membership = await ctx.db.membership.findUnique({
        where: { contextId_userId: { contextId: input.contextId, userId } },
        select: { role: true, status: true },
      });

      if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view moderation logs',
        });
      }

      // TODO: Implement mod log storage and retrieval
      // For now, return empty array
      return {
        items: [],
        nextCursor: null,
        hasMore: false,
      };
    }),

  /**
   * Get group stats
   */
  getStats: publicProcedure
    .input(getGroupStatsSchema)
    .query(async ({ ctx, input }) => {
      const context = await ctx.db.context.findUnique({
        where: { id: input.contextId },
        select: { type: true, plugins: true },
      });

      if (!context || context.type !== 'GROUP') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Group not found',
        });
      }

      // Get member counts
      const memberCounts = await ctx.db.membership.groupBy({
        by: ['status'],
        where: { contextId: input.contextId },
        _count: true,
      });

      const stats = {
        totalMembers: 0,
        pendingMembers: 0,
        bannedMembers: 0,
      };

      for (const count of memberCounts) {
        if (count.status === 'APPROVED') stats.totalMembers = count._count;
        else if (count.status === 'PENDING') stats.pendingMembers = count._count;
        else if (count.status === 'BANNED') stats.bannedMembers = count._count;
      }

      // Get post count (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentPosts = await ctx.db.activity.count({
        where: {
          contextId: input.contextId,
          type: 'CREATE',
          objectType: 'NOTE',
          published: { gte: thirtyDaysAgo },
          deleted: false,
        },
      });

      return {
        ...stats,
        recentPostCount: recentPosts,
      };
    }),
});
