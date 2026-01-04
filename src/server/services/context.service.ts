/**
 * Context Service
 * Business logic for Context (Group, Event, Convention) management
 */

import { db } from '@/server/db';
import type { Prisma, ContextType, Visibility, JoinPolicy, MemberRole } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { slugify } from '@/lib/utils';
import { pluginRegistry } from '@/lib/plugins';

// =============================================================================
// Types
// =============================================================================

/**
 * Context with relations - uses Prisma's inferred types
 */
export type ContextWithRelations = Prisma.ContextGetPayload<{
  include: {
    owner: {
      select: {
        id: true;
        username: true;
        displayName: true;
        avatarUrl: true;
      };
    };
    _count: {
      select: {
        memberships: true;
      };
    };
  };
}>;

/**
 * Context with user's membership
 */
export interface ContextWithMembership extends ContextWithRelations {
  userMembership?: {
    id: string;
    role: MemberRole;
    status: string;
    pluginData: Prisma.JsonValue;
  } | null;
}

/**
 * Input for creating a context
 */
export interface CreateContextInput {
  type: ContextType;
  name: string;
  description?: string;
  visibility?: Visibility;
  joinPolicy?: JoinPolicy;
  ownerId: string;
  pluginId: string;
  pluginData?: Record<string, unknown>;
  avatarUrl?: string;
  bannerUrl?: string;
}

/**
 * Input for updating a context
 */
export interface UpdateContextInput {
  name?: string;
  description?: string;
  visibility?: Visibility;
  joinPolicy?: JoinPolicy;
  avatarUrl?: string;
  bannerUrl?: string;
  handle?: string;
}

/**
 * Options for listing contexts
 */
export interface ListContextsOptions {
  type?: ContextType;
  visibility?: Visibility;
  ownerId?: string;
  cursor?: string;
  limit?: number;
  search?: string;
}

// =============================================================================
// Service Implementation
// =============================================================================

export const contextService = {
  /**
   * Create a new context with owner membership
   */
  async create(input: CreateContextInput): Promise<ContextWithMembership> {
    const plugin = pluginRegistry.get(input.pluginId);
    if (!plugin) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Plugin "${input.pluginId}" not found`,
      });
    }

    // Validate plugin is compatible with context type
    if (!plugin.contextTypes.includes(input.type)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Plugin "${input.pluginId}" is not compatible with context type "${input.type}"`,
      });
    }

    // Validate plugin data
    let validatedData: unknown;
    try {
      validatedData = input.pluginData
        ? plugin.dataSchema.parse(input.pluginData)
        : plugin.defaultData;
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid plugin data',
        cause: error,
      });
    }

    // Generate unique slug
    const baseSlug = slugify(input.name) || 'context';
    let slug = baseSlug;
    let counter = 1;

    while (await db.context.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Transaction: create context + owner membership
    const context = await db.$transaction(async (tx) => {
      const ctx = await tx.context.create({
        data: {
          type: input.type,
          slug,
          name: input.name,
          description: input.description,
          avatarUrl: input.avatarUrl,
          bannerUrl: input.bannerUrl,
          visibility: input.visibility ?? 'PUBLIC',
          joinPolicy: input.joinPolicy ?? 'OPEN',
          ownerId: input.ownerId,
          plugins: { [input.pluginId]: validatedData } as Prisma.InputJsonValue,
          features: [input.pluginId],
        },
        include: {
          owner: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          _count: { select: { memberships: true } },
        },
      });

      // Create owner membership
      const membership = await tx.membership.create({
        data: {
          contextId: ctx.id,
          userId: input.ownerId,
          role: 'OWNER',
          status: 'APPROVED',
          approvedAt: new Date(),
        },
      });

      return { ctx, membership };
    });

    // Run plugin hook
    try {
      await plugin.hooks?.onContextCreate?.(
        {
          id: context.ctx.id,
          type: context.ctx.type,
          slug: context.ctx.slug,
          name: context.ctx.name,
          description: context.ctx.description,
          avatarUrl: context.ctx.avatarUrl,
          bannerUrl: context.ctx.bannerUrl,
          plugins: context.ctx.plugins as Record<string, unknown>,
          features: context.ctx.features,
        },
        validatedData
      );
    } catch (error) {
      console.error('Plugin hook error:', error);
      // Don't fail the operation if hook fails
    }

    return {
      ...context.ctx,
      userMembership: {
        id: context.membership.id,
        role: context.membership.role,
        status: context.membership.status,
        pluginData: context.membership.pluginData,
      },
    } as ContextWithMembership;
  },

  /**
   * Get context by ID with optional user membership
   */
  async getById(contextId: string, userId?: string): Promise<ContextWithMembership | null> {
    const context = await db.context.findUnique({
      where: { id: contextId, isArchived: false },
      include: {
        owner: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { memberships: { where: { status: 'APPROVED' } } } },
      },
    });

    if (!context) return null;

    let userMembership = null;
    if (userId) {
      userMembership = await db.membership.findUnique({
        where: { contextId_userId: { contextId, userId } },
        select: { id: true, role: true, status: true, pluginData: true },
      });
    }

    return {
      ...context,
      userMembership,
    };
  },

  /**
   * Get context by slug
   */
  async getBySlug(slug: string, userId?: string): Promise<ContextWithMembership | null> {
    const context = await db.context.findUnique({
      where: { slug, isArchived: false },
    });

    if (!context) return null;
    return this.getById(context.id, userId);
  },

  /**
   * Check if user can access context
   */
  async canAccess(contextId: string, userId?: string): Promise<boolean> {
    const context = await db.context.findUnique({
      where: { id: contextId },
      select: { visibility: true },
    });

    if (!context) return false;

    // Public and unlisted are always accessible
    if (context.visibility !== 'PRIVATE') return true;

    // Private requires membership
    if (!userId) return false;

    const membership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId } },
    });

    return membership?.status === 'APPROVED';
  },

  /**
   * List contexts with pagination
   */
  async list(options: ListContextsOptions): Promise<{
    items: ContextWithRelations[];
    nextCursor: string | undefined;
  }> {
    const { type, visibility, ownerId, cursor, limit = 20, search } = options;

    const where: Prisma.ContextWhereInput = {
      isArchived: false,
      ...(type && { type }),
      ...(visibility && { visibility }),
      ...(ownerId && { ownerId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const contexts = await db.context.findMany({
      where,
      include: {
        owner: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { memberships: { where: { status: 'APPROVED' } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = contexts.length > limit;
    const items = hasMore ? contexts.slice(0, -1) : contexts;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : undefined,
    };
  },

  /**
   * Update a context
   */
  async update(
    contextId: string,
    input: UpdateContextInput,
    actorId: string
  ): Promise<ContextWithRelations> {
    // Check permissions
    const membership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: actorId } },
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions to update context',
      });
    }

    // If handle is being changed, check uniqueness
    if (input.handle !== undefined) {
      if (input.handle) {
        const existing = await db.context.findUnique({
          where: { handle: input.handle },
        });
        if (existing && existing.id !== contextId) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Handle is already taken',
          });
        }
      }
    }

    return db.context.update({
      where: { id: contextId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.visibility !== undefined && { visibility: input.visibility }),
        ...(input.joinPolicy !== undefined && { joinPolicy: input.joinPolicy }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        ...(input.bannerUrl !== undefined && { bannerUrl: input.bannerUrl }),
        ...(input.handle !== undefined && { handle: input.handle || null }),
      },
      include: {
        owner: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
        _count: { select: { memberships: { where: { status: 'APPROVED' } } } },
      },
    });
  },

  /**
   * Archive a context (soft delete)
   */
  async archive(contextId: string, actorId: string): Promise<void> {
    const context = await db.context.findUnique({
      where: { id: contextId },
    });

    if (!context) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Context not found' });
    }

    // Only owner can archive
    if (context.ownerId !== actorId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only the owner can archive this context',
      });
    }

    await db.context.update({
      where: { id: contextId },
      data: { isArchived: true, archivedAt: new Date() },
    });

    // Run plugin hooks
    for (const pluginId of context.features) {
      const plugin = pluginRegistry.get(pluginId);
      try {
        await plugin?.hooks?.onContextDelete?.({
          id: context.id,
          type: context.type,
          slug: context.slug,
          name: context.name,
          description: context.description,
          avatarUrl: context.avatarUrl,
          bannerUrl: context.bannerUrl,
          plugins: context.plugins as Record<string, unknown>,
          features: context.features,
        });
      } catch (error) {
        console.error('Plugin hook error:', error);
      }
    }
  },

  /**
   * Join a context
   */
  async join(
    contextId: string,
    userId: string
  ): Promise<{ membership: Prisma.MembershipGetPayload<object>; pending: boolean }> {
    const context = await db.context.findUnique({
      where: { id: contextId },
    });

    if (!context) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Context not found' });
    }

    if (context.isArchived) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Context is archived' });
    }

    if (context.joinPolicy === 'CLOSED') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Context is not accepting members' });
    }

    if (context.joinPolicy === 'INVITE') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Invite required to join' });
    }

    // Check for existing membership
    const existing = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId } },
    });

    if (existing) {
      if (existing.status === 'APPROVED') {
        throw new TRPCError({ code: 'CONFLICT', message: 'Already a member' });
      }
      if (existing.status === 'PENDING') {
        throw new TRPCError({ code: 'CONFLICT', message: 'Membership request pending' });
      }
      if (existing.status === 'BANNED') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are banned from this context' });
      }
    }

    const needsApproval = context.joinPolicy === 'APPROVAL';

    const membership = await db.membership.create({
      data: {
        contextId,
        userId,
        role: 'MEMBER',
        status: needsApproval ? 'PENDING' : 'APPROVED',
        approvedAt: needsApproval ? undefined : new Date(),
      },
    });

    // Run plugin hooks if approved immediately
    if (membership.status === 'APPROVED') {
      for (const pluginId of context.features) {
        const plugin = pluginRegistry.get(pluginId);
        try {
          await plugin?.hooks?.onMemberJoin?.(
            {
              id: membership.id,
              role: membership.role,
              status: membership.status,
              pluginData: membership.pluginData as Record<string, unknown>,
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

    return { membership, pending: needsApproval };
  },

  /**
   * Leave a context
   */
  async leave(contextId: string, userId: string): Promise<void> {
    const context = await db.context.findUnique({ where: { id: contextId } });
    if (!context) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Context not found' });
    }

    // Owner cannot leave - must transfer ownership first
    if (context.ownerId === userId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Owner cannot leave. Transfer ownership first.',
      });
    }

    const membership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId } },
    });

    if (!membership) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Not a member' });
    }

    await db.membership.update({
      where: { id: membership.id },
      data: { status: 'LEFT' },
    });

    // Run plugin hooks
    for (const pluginId of context.features) {
      const plugin = pluginRegistry.get(pluginId);
      try {
        await plugin?.hooks?.onMemberLeave?.(
          {
            id: membership.id,
            role: membership.role,
            status: 'LEFT',
            pluginData: membership.pluginData as Record<string, unknown>,
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
  },

  /**
   * Transfer ownership of a context
   */
  async transferOwnership(
    contextId: string,
    newOwnerId: string,
    currentOwnerId: string
  ): Promise<void> {
    const context = await db.context.findUnique({ where: { id: contextId } });
    if (!context) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Context not found' });
    }

    if (context.ownerId !== currentOwnerId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Only the owner can transfer ownership',
      });
    }

    // Check new owner is a member
    const newOwnerMembership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: newOwnerId } },
    });

    if (!newOwnerMembership || newOwnerMembership.status !== 'APPROVED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'New owner must be an approved member',
      });
    }

    await db.$transaction([
      // Update context owner
      db.context.update({
        where: { id: contextId },
        data: { ownerId: newOwnerId },
      }),
      // Update old owner to ADMIN
      db.membership.update({
        where: { contextId_userId: { contextId, userId: currentOwnerId } },
        data: { role: 'ADMIN' },
      }),
      // Update new owner to OWNER
      db.membership.update({
        where: { contextId_userId: { contextId, userId: newOwnerId } },
        data: { role: 'OWNER' },
      }),
    ]);
  },

  /**
   * Update plugin data for a context
   */
  async updatePluginData(
    contextId: string,
    pluginId: string,
    data: Record<string, unknown>,
    actorId: string
  ): Promise<void> {
    // Check permissions
    const membership = await db.membership.findUnique({
      where: { contextId_userId: { contextId, userId: actorId } },
    });

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }

    const context = await db.context.findUnique({ where: { id: contextId } });
    if (!context) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Context not found' });
    }

    // Validate plugin data
    const plugin = pluginRegistry.get(pluginId);
    if (!plugin) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: `Plugin "${pluginId}" not found` });
    }

    const currentPlugins = context.plugins as Record<string, unknown>;
    const currentData = currentPlugins[pluginId] as Record<string, unknown> || {};
    const newData = { ...currentData, ...data };

    try {
      plugin.dataSchema.parse(newData);
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid plugin data',
        cause: error,
      });
    }

    await db.context.update({
      where: { id: contextId },
      data: {
        plugins: {
          ...currentPlugins,
          [pluginId]: newData,
        } as Prisma.InputJsonValue,
      },
    });

    // Run plugin hook
    try {
      await plugin.hooks?.onContextUpdate?.(
        {
          id: context.id,
          type: context.type,
          slug: context.slug,
          name: context.name,
          description: context.description,
          avatarUrl: context.avatarUrl,
          bannerUrl: context.bannerUrl,
          plugins: { ...currentPlugins, [pluginId]: newData },
          features: context.features,
        },
        newData,
        currentData
      );
    } catch (error) {
      console.error('Plugin hook error:', error);
    }
  },
};
