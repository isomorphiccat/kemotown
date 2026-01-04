/**
 * User Router
 * Handles user profile operations, search, and statistics
 *
 * NOTE: Simplified version - some features (follow, bump) are disabled
 * until their Prisma models are added to the schema.
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';

// Inline schemas to avoid import issues
const userIdSchema = z.object({ userId: z.string() });
const usernameSchema = z.object({ username: z.string() });

export const userRouter = createTRPCRouter({
  /**
   * Get user by ID
   */
  getById: publicProcedure
    .input(userIdSchema)
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        include: {
          _count: {
            select: {
              followers: { where: { status: 'ACCEPTED' } },
              following: { where: { status: 'ACCEPTED' } },
              memberships: { where: { status: 'APPROVED' } },
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '사용자를 찾을 수 없습니다.',
        });
      }

      // Check privacy settings
      if (!user.isPublic && ctx.session?.user?.id !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '비공개 프로필입니다.',
        });
      }

      return user;
    }),

  /**
   * Get user by username
   */
  getByUsername: publicProcedure
    .input(usernameSchema)
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
        include: {
          _count: {
            select: {
              followers: { where: { status: 'ACCEPTED' } },
              following: { where: { status: 'ACCEPTED' } },
              memberships: { where: { status: 'APPROVED' } },
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '사용자를 찾을 수 없습니다.',
        });
      }

      // Check privacy settings
      if (!user.isPublic && ctx.session?.user?.id !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '비공개 프로필입니다.',
        });
      }

      return user;
    }),

  /**
   * Get current user profile
   */
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: {
        _count: {
          select: {
            followers: { where: { status: 'ACCEPTED' } },
            following: { where: { status: 'ACCEPTED' } },
            memberships: { where: { status: 'APPROVED' } },
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '사용자를 찾을 수 없습니다.',
      });
    }

    return user;
  }),

  /**
   * Get user stats
   */
  getStats: publicProcedure
    .input(userIdSchema)
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          isPublic: true,
          _count: {
            select: {
              followers: {
                where: { status: 'ACCEPTED' },
              },
              following: {
                where: { status: 'ACCEPTED' },
              },
              memberships: {
                where: { status: 'APPROVED' },
              },
              ownedContexts: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '사용자를 찾을 수 없습니다.',
        });
      }

      // Check privacy
      if (!user.isPublic && ctx.session?.user?.id !== user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '비공개 프로필입니다.',
        });
      }

      return {
        ownedContexts: user._count.ownedContexts,
        joinedContexts: user._count.memberships,
        followers: user._count.followers,
        following: user._count.following,
      };
    }),

  /**
   * Get contexts user has joined (events, groups, conventions)
   */
  getJoinedContexts: publicProcedure
    .input(z.object({
      userId: z.string(),
      type: z.enum(['EVENT', 'GROUP', 'CONVENTION', 'CHANNEL']).optional(),
      limit: z.number().default(50),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { userId, type, limit, cursor } = input;

      // Check if user exists and is public
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { isPublic: true },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '사용자를 찾을 수 없습니다.',
        });
      }

      if (!user.isPublic && ctx.session?.user?.id !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '비공개 프로필입니다.',
        });
      }

      // Get memberships with contexts
      const memberships = await ctx.db.membership.findMany({
        where: {
          userId,
          status: 'APPROVED',
          ...(type && { context: { type } }),
        },
        include: {
          context: {
            include: {
              owner: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
              _count: {
                select: {
                  memberships: {
                    where: { status: 'APPROVED' },
                  },
                },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
        take: limit + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
      });

      let nextCursor: string | undefined = undefined;
      if (memberships.length > limit) {
        const nextItem = memberships.pop();
        nextCursor = nextItem?.id;
      }

      return {
        contexts: memberships.map((m) => m.context),
        nextCursor,
      };
    }),

  /**
   * Update profile
   */
  updateProfile: protectedProcedure
    .input(z.object({
      displayName: z.string().optional(),
      bio: z.string().optional(),
      avatarUrl: z.string().url().optional().or(z.literal('')),
      bannerUrl: z.string().url().optional().or(z.literal('')),
      species: z.string().optional(),
      interests: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
      socialLinks: z.record(z.string()).optional(),
      locale: z.enum(['ko', 'en']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          ...input,
          // Convert empty strings to null for URL fields
          avatarUrl: input.avatarUrl === '' ? null : input.avatarUrl,
          bannerUrl: input.bannerUrl === '' ? null : input.bannerUrl,
          socialLinks: input.socialLinks ? input.socialLinks : undefined,
        },
      });

      return user;
    }),

  /**
   * Search users
   */
  search: publicProcedure
    .input(z.object({
      query: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { query, page, limit } = input;

      const where = {
        isPublic: true,
        ...(query && {
          OR: [
            { username: { contains: query, mode: 'insensitive' as const } },
            { displayName: { contains: query, mode: 'insensitive' as const } },
          ],
        }),
      };

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            species: true,
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),
});
