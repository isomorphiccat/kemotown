/**
 * Membership Service
 * Business logic for managing user memberships in contexts
 */

import { db } from '@/server/db';
import type { Prisma, MemberRole, MemberStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { isEqualOrHigherRole } from '@/lib/permissions';
import { pluginRegistry } from '@/lib/plugins';

// =============================================================================
// Types
// =============================================================================

/**
 * Membership with user data
 */
export type MembershipWithUser = Prisma.MembershipGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        username: true;
        displayName: true;
        avatarUrl: true;
        species: true;
        lastActiveAt: true;
      };
    };
  };
}>;

/**
 * Options for listing memberships
 */
export interface ListMembershipsOptions {
  contextId: string;
  status?: MemberStatus;
  role?: MemberRole;
  cursor?: string;
  limit?: number;
  search?: string;
}

/**
 * Result of listing memberships
 */
export interface ListMembershipsResult {
  items: MembershipWithUser[];
  nextCursor: string | undefined;
}

// =============================================================================
// Service Implementation
// =============================================================================

export const membershipService = {
  /**
   * Get membership for user in context
   */
  async get(contextId: string, userId: string): Promise<MembershipWithUser | null> {
    return db.membership.findUnique({
      where: { contextId_userId: { contextId, userId } },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            species: true,
            lastActiveAt: true,
          },
        },
      },
    });
  },

  /**
   * List memberships for a context
   */
  async list(options: ListMembershipsOptions): Promise<ListMembershipsResult> {
    const { contextId, status, role, cursor, limit = 50, search } = options;

    const where: Prisma.MembershipWhereInput = {
      contextId,
      ...(status && { status }),
      ...(role && { role }),
      ...(search && {
        user: {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { displayName: { contains: search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const memberships = await db.membership.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            species: true,
            lastActiveAt: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first (based on enum order)
        { joinedAt: 'asc' },
      ],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = memberships.length > limit;
    const items = hasMore ? memberships.slice(0, -1) : memberships;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : undefined,
    };
  },

  /**
   * Count memberships by status
   */
  async countByStatus(
    contextId: string
  ): Promise<Record<MemberStatus, number>> {
    const counts = await db.membership.groupBy({
      by: ['status'],
      where: { contextId },
      _count: true,
    });

    const result: Record<MemberStatus, number> = {
      PENDING: 0,
      APPROVED: 0,
      BANNED: 0,
      LEFT: 0,
    };

    for (const count of counts) {
      result[count.status] = count._count;
    }

    return result;
  },

  /**
   * Update member role
   */
  async updateRole(
    contextId: string,
    targetUserId: string,
    newRole: MemberRole,
    actorId: string
  ): Promise<MembershipWithUser> {
    // Get actor's membership
    const actorMembership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: actorId } },
    });

    if (!actorMembership || actorMembership.status !== 'APPROVED') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not an approved member of this context',
      });
    }

    // Only OWNER and ADMIN can change roles
    if (!['OWNER', 'ADMIN'].includes(actorMembership.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to change roles',
      });
    }

    // Get target membership
    const targetMembership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: targetUserId } },
    });

    if (!targetMembership) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Member not found',
      });
    }

    // Check context ownership
    const context = await db.context.findUnique({ where: { id: contextId } });
    if (!context) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Context not found' });
    }

    // Cannot change owner's role (must use transferOwnership)
    if (context.ownerId === targetUserId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot change owner role. Use transfer ownership instead.',
      });
    }

    // Only owner can promote to ADMIN
    if (newRole === 'ADMIN' && actorMembership.role !== 'OWNER') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only the owner can promote members to admin',
      });
    }

    // Cannot assign OWNER role (must use transferOwnership)
    if (newRole === 'OWNER') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot assign owner role. Use transfer ownership instead.',
      });
    }

    // Cannot change role of someone with equal or higher role (unless owner)
    if (
      actorMembership.role !== 'OWNER' &&
      isEqualOrHigherRole(targetMembership.role, actorMembership.role)
    ) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot change role of member with equal or higher role',
      });
    }

    return db.membership.update({
      where: { contextId_userId: { contextId, userId: targetUserId } },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            species: true,
            lastActiveAt: true,
          },
        },
      },
    });
  },

  /**
   * Approve pending membership
   */
  async approve(
    contextId: string,
    targetUserId: string,
    actorId: string
  ): Promise<MembershipWithUser> {
    // Check actor permissions
    const actorMembership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: actorId } },
    });

    if (!actorMembership || actorMembership.status !== 'APPROVED') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not an approved member',
      });
    }

    if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(actorMembership.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to approve members',
      });
    }

    // Get target membership
    const targetMembership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: targetUserId } },
    });

    if (!targetMembership) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Membership not found' });
    }

    if (targetMembership.status !== 'PENDING') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Membership is not pending approval',
      });
    }

    const updated = await db.membership.update({
      where: { contextId_userId: { contextId, userId: targetUserId } },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: actorId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            species: true,
            lastActiveAt: true,
          },
        },
      },
    });

    // Run plugin hooks
    const context = await db.context.findUnique({ where: { id: contextId } });
    if (context) {
      for (const pluginId of context.features) {
        const plugin = pluginRegistry.get(pluginId);
        try {
          await plugin?.hooks?.onMemberJoin?.(
            {
              id: updated.id,
              role: updated.role,
              status: updated.status,
              pluginData: updated.pluginData as Record<string, unknown>,
            },
            {
              id: context.id,
              type: context.type,
              slug: context.slug,
              name: context.name,
              description: context.description,
              avatarUrl: context.avatarUrl,
              bannerUrl: context.bannerUrl,
              plugins: context.plugins as Record<string, unknown>,
              features: context.features,
            }
          );
        } catch (error) {
          console.error('Plugin hook error:', error);
        }
      }
    }

    return updated;
  },

  /**
   * Reject pending membership
   */
  async reject(
    contextId: string,
    targetUserId: string,
    actorId: string
  ): Promise<void> {
    // Check actor permissions
    const actorMembership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: actorId } },
    });

    if (!actorMembership || actorMembership.status !== 'APPROVED') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not an approved member',
      });
    }

    if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(actorMembership.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to reject members',
      });
    }

    // Get target membership
    const targetMembership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: targetUserId } },
    });

    if (!targetMembership) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Membership not found' });
    }

    if (targetMembership.status !== 'PENDING') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Membership is not pending',
      });
    }

    // Delete the pending membership
    await db.membership.delete({
      where: { contextId_userId: { contextId, userId: targetUserId } },
    });
  },

  /**
   * Ban a member
   */
  async ban(
    contextId: string,
    targetUserId: string,
    actorId: string
  ): Promise<MembershipWithUser> {
    // Check actor permissions
    const actorMembership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: actorId } },
    });

    if (!actorMembership || actorMembership.status !== 'APPROVED') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not an approved member',
      });
    }

    if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(actorMembership.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to ban members',
      });
    }

    // Get target membership
    const targetMembership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: targetUserId } },
    });

    if (!targetMembership) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
    }

    // Check context ownership
    const context = await db.context.findUnique({ where: { id: contextId } });
    if (!context) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Context not found' });
    }

    // Cannot ban owner
    if (context.ownerId === targetUserId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot ban the owner',
      });
    }

    // Cannot ban someone with equal or higher role (unless owner)
    if (
      actorMembership.role !== 'OWNER' &&
      isEqualOrHigherRole(targetMembership.role, actorMembership.role)
    ) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot ban member with equal or higher role',
      });
    }

    return db.membership.update({
      where: { contextId_userId: { contextId, userId: targetUserId } },
      data: { status: 'BANNED' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            species: true,
            lastActiveAt: true,
          },
        },
      },
    });
  },

  /**
   * Unban a member
   */
  async unban(
    contextId: string,
    targetUserId: string,
    actorId: string
  ): Promise<MembershipWithUser> {
    // Check actor permissions
    const actorMembership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: actorId } },
    });

    if (!actorMembership || actorMembership.status !== 'APPROVED') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not an approved member',
      });
    }

    if (!['OWNER', 'ADMIN', 'MODERATOR'].includes(actorMembership.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to unban members',
      });
    }

    // Get target membership
    const targetMembership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: targetUserId } },
    });

    if (!targetMembership) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });
    }

    if (targetMembership.status !== 'BANNED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Member is not banned',
      });
    }

    return db.membership.update({
      where: { contextId_userId: { contextId, userId: targetUserId } },
      data: { status: 'APPROVED' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            species: true,
            lastActiveAt: true,
          },
        },
      },
    });
  },

  /**
   * Update plugin data for a membership
   */
  async updatePluginData(
    contextId: string,
    userId: string,
    pluginId: string,
    data: Record<string, unknown>,
    actorId?: string
  ): Promise<MembershipWithUser> {
    // If actor specified and different from user, check permissions
    if (actorId && actorId !== userId) {
      const actorMembership = await db.membership.findUnique({
        where: { contextId_userId: { contextId, userId: actorId } },
      });

      if (!actorMembership || !['OWNER', 'ADMIN'].includes(actorMembership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        });
      }
    }

    const membership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId } },
    });

    if (!membership) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Membership not found' });
    }

    const currentPluginData = membership.pluginData as Record<string, unknown>;

    return db.membership.update({
      where: { id: membership.id },
      data: {
        pluginData: {
          ...currentPluginData,
          [pluginId]: {
            ...(currentPluginData[pluginId] as Record<string, unknown> || {}),
            ...data,
          },
        } as Prisma.InputJsonValue,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            species: true,
            lastActiveAt: true,
          },
        },
      },
    });
  },

  /**
   * Update notification preferences
   */
  async updateNotifications(
    contextId: string,
    userId: string,
    preferences: {
      notifyPosts?: boolean;
      notifyMentions?: boolean;
      notifyEvents?: boolean;
    }
  ): Promise<MembershipWithUser> {
    return db.membership.update({
      where: { contextId_userId: { contextId, userId } },
      data: {
        ...(preferences.notifyPosts !== undefined && { notifyPosts: preferences.notifyPosts }),
        ...(preferences.notifyMentions !== undefined && { notifyMentions: preferences.notifyMentions }),
        ...(preferences.notifyEvents !== undefined && { notifyEvents: preferences.notifyEvents }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            species: true,
            lastActiveAt: true,
          },
        },
      },
    });
  },

  /**
   * Get user's memberships across all contexts
   */
  async getUserMemberships(
    userId: string,
    options: { status?: MemberStatus; limit?: number; cursor?: string } = {}
  ): Promise<{
    items: Array<Prisma.MembershipGetPayload<{
      include: { context: { select: { id: true; type: true; slug: true; name: true; avatarUrl: true } } };
    }>>;
    nextCursor: string | undefined;
  }> {
    const { status = 'APPROVED', limit = 20, cursor } = options;

    const memberships = await db.membership.findMany({
      where: { userId, status },
      include: {
        context: {
          select: { id: true, type: true, slug: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = memberships.length > limit;
    const items = hasMore ? memberships.slice(0, -1) : memberships;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : undefined,
    };
  },
};
