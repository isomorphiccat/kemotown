/**
 * Activity Service
 * Business logic for ActivityPub-style activities
 *
 * Uses the unified addressing system for visibility and delivery:
 * - @/lib/addressing for address parsing, visibility checks, and delivery
 * - Supports: public, followers, user:{id}, context:{id}[:modifier]
 */

import { db } from '@/server/db';
import type { Activity, Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import type {
  CreateNoteActivityInput,
  CreateLikeActivityInput,
  CreateAnnounceActivityInput,
  UpdateActivityInput,
} from '@/schemas/activity.schema';

// Use unified addressing system
import {
  canSeeActivity as checkActivityVisibility,
  deliverActivityWithMentions,
  deleteDelivery,
} from '@/lib/addressing';

// =============================================================================
// Types
// =============================================================================

/**
 * Activity with relations - uses Prisma's inferred types for accuracy
 */
export type ActivityWithRelations = Prisma.ActivityGetPayload<{
  include: {
    actor: {
      select: {
        id: true;
        username: true;
        displayName: true;
        avatarUrl: true;
      };
    };
    attachments: {
      select: {
        id: true;
        type: true;
        url: true;
        thumbnailUrl: true;
        width: true;
        height: true;
        alt: true;
        blurhash: true;
      };
    };
    _count: {
      select: {
        replies: true;
      };
    };
  };
}>;

export interface TimelineItem {
  activity: ActivityWithRelations;
  // For reposts, include the original activity
  originalActivity?: ActivityWithRelations;
  // Interaction state for current user
  liked?: boolean;
  reposted?: boolean;
}

// =============================================================================
// Address Utilities (delegated to @/lib/addressing)
// =============================================================================

/**
 * Check if a user can see an activity based on addressing
 * Uses the unified addressing system for consistency
 */
export async function canSeeActivity(
  activity: Pick<Activity, 'to' | 'cc' | 'actorId'>,
  userId: string | null
): Promise<boolean> {
  return checkActivityVisibility(activity, userId);
}

/**
 * Build visibility filter for Prisma queries
 * Returns a WHERE clause that filters activities the user can see
 *
 * Note: This is an optimistic filter for database queries.
 * Complex addressing (followers, contexts) requires post-query filtering
 * using filterVisibleActivities() from @/lib/addressing
 */
export function buildVisibilityFilter(
  userId: string | null,
  options: { contextId?: string } = {}
): Prisma.ActivityWhereInput {
  const baseFilter: Prisma.ActivityWhereInput = {
    deleted: false,
  };

  // Filter by context if specified
  if (options.contextId) {
    baseFilter.contextId = options.contextId;
  }

  if (!userId) {
    // Non-authenticated users can only see public activities
    return {
      ...baseFilter,
      to: { has: 'public' },
    };
  }

  // Authenticated users can see:
  // 1. Public activities
  // 2. Their own activities
  // 3. Activities addressed directly to them
  // 4. Activities in their contexts (handled via contextId filter + post-query check)
  const orConditions: Prisma.ActivityWhereInput[] = [
    { to: { has: 'public' } },
    { actorId: userId },
    { to: { has: `user:${userId}` } },
    { cc: { has: `user:${userId}` } },
  ];

  return {
    ...baseFilter,
    OR: orConditions,
  };
}

// =============================================================================
// Delivery Service (delegated to @/lib/addressing)
// =============================================================================

/**
 * Deliver an activity to recipients' inboxes
 * Uses the unified addressing system which supports:
 * - public (no delivery, users query public timeline)
 * - followers (deliver to accepted followers)
 * - user:{id} (deliver to specific user)
 * - context:{id} (deliver to context members)
 * - context:{id}:admins (deliver to admins only)
 * - context:{id}:role:{role} (deliver to specific role)
 */
export async function deliverActivity(
  activity: Pick<Activity, 'id' | 'type' | 'actorId' | 'to' | 'cc' | 'object'>
): Promise<{ delivered: number; mentioned: number }> {
  // Use the unified delivery service which handles mentions automatically
  return deliverActivityWithMentions(activity);
}

/**
 * Remove delivery when activity is deleted
 */
export async function removeDelivery(activityId: string): Promise<number> {
  return deleteDelivery(activityId);
}

// =============================================================================
// Activity CRUD Operations
// =============================================================================

/**
 * Standard include for activity queries
 */
const activityInclude = {
  actor: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  attachments: {
    select: {
      id: true,
      type: true,
      url: true,
      thumbnailUrl: true,
      width: true,
      height: true,
      alt: true,
      blurhash: true,
    },
  },
  _count: {
    select: {
      replies: true,
    },
  },
} satisfies Prisma.ActivityInclude;

/**
 * Create a Note activity (post, comment, DM)
 *
 * If contextId is provided, the activity will be associated with that context
 * and the context address will be automatically added to addressing if not present.
 *
 * For PUBLIC contexts, posts are also made public (appear on global timeline).
 * For PRIVATE/UNLISTED contexts, posts remain context-only.
 */
export async function createNoteActivity(
  actorId: string,
  input: CreateNoteActivityInput
): Promise<ActivityWithRelations> {
  // Build addressing - automatically add context if contextId provided
  const to = [...input.to];
  const cc = [...input.cc];

  if (input.contextId) {
    const contextAddress = `context:${input.contextId}`;

    // Fetch context to check its visibility
    const context = await db.context.findUnique({
      where: { id: input.contextId },
      select: { visibility: true },
    });

    // For PUBLIC contexts, automatically include 'public' in addressing
    // so posts appear on the global timeline
    if (context?.visibility === 'PUBLIC' && !to.includes('public')) {
      to.push('public');
    }

    // Add context to addressing if not already present
    if (!to.includes(contextAddress) && !cc.includes(contextAddress)) {
      // If public, add context to cc; otherwise add to 'to'
      if (to.includes('public')) {
        cc.push(contextAddress);
      } else {
        to.push(contextAddress);
      }
    }
  }

  const activity = await db.activity.create({
    data: {
      type: 'CREATE',
      actorId,
      actorType: 'USER',
      objectType: 'NOTE',
      object: {
        content: input.content,
        summary: input.summary,
        sensitive: input.sensitive,
      },
      to,
      cc,
      inReplyTo: input.inReplyTo,
      contextId: input.contextId,
      attachments: input.attachmentIds.length > 0
        ? {
            connect: input.attachmentIds.map((id) => ({ id })),
          }
        : undefined,
    },
    include: activityInclude,
  });

  // Deliver to inboxes using unified addressing system
  await deliverActivity(activity);

  return activity;
}

/**
 * Create a Like activity
 */
export async function createLikeActivity(
  actorId: string,
  input: CreateLikeActivityInput
): Promise<ActivityWithRelations> {
  // Check if the target activity exists and user can see it
  const targetActivity = await db.activity.findUnique({
    where: { id: input.targetActivityId, deleted: false },
  });

  if (!targetActivity) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Activity not found',
    });
  }

  const canSee = await canSeeActivity(targetActivity, actorId);
  if (!canSee) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You cannot react to this activity',
    });
  }

  // Check if already liked
  const existingLike = await db.activity.findFirst({
    where: {
      type: 'LIKE',
      actorId,
      objectId: input.targetActivityId,
      deleted: false,
    },
  });

  if (existingLike) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Already liked',
    });
  }

  // Create like activity - addressed to the original author
  const activity = await db.activity.create({
    data: {
      type: 'LIKE',
      actorId,
      actorType: 'USER',
      objectType: 'ACTIVITY',
      objectId: input.targetActivityId,
      to: [`user:${targetActivity.actorId}`],
    },
    include: activityInclude,
  });

  // Deliver to the target's author
  await deliverActivity(activity);

  return activity;
}

/**
 * Remove a Like (undo)
 */
export async function removeLikeActivity(
  actorId: string,
  targetActivityId: string
): Promise<void> {
  const like = await db.activity.findFirst({
    where: {
      type: 'LIKE',
      actorId,
      objectId: targetActivityId,
      deleted: false,
    },
  });

  if (!like) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Like not found',
    });
  }

  // Soft delete the like
  await db.activity.update({
    where: { id: like.id },
    data: { deleted: true, deletedAt: new Date() },
  });
}

/**
 * Create an Announce activity (repost)
 */
export async function createAnnounceActivity(
  actorId: string,
  input: CreateAnnounceActivityInput
): Promise<ActivityWithRelations> {
  // Check if the target activity exists and is public
  const targetActivity = await db.activity.findUnique({
    where: { id: input.targetActivityId, deleted: false },
    include: activityInclude,
  });

  if (!targetActivity) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Activity not found',
    });
  }

  // Can only repost public activities
  if (!targetActivity.to.includes('public')) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Cannot repost non-public activities',
    });
  }

  // Check if already reposted
  const existingRepost = await db.activity.findFirst({
    where: {
      type: 'ANNOUNCE',
      actorId,
      objectId: input.targetActivityId,
      deleted: false,
    },
  });

  if (existingRepost) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Already reposted',
    });
  }

  // Create announce activity
  const activity = await db.activity.create({
    data: {
      type: 'ANNOUNCE',
      actorId,
      actorType: 'USER',
      objectType: 'ACTIVITY',
      objectId: input.targetActivityId,
      to: input.to,
      cc: input.cc,
    },
    include: activityInclude,
  });

  // Deliver to followers and original author
  await deliverActivity(activity);

  return activity;
}

/**
 * Remove an Announce (undo repost)
 */
export async function removeAnnounceActivity(
  actorId: string,
  targetActivityId: string
): Promise<void> {
  const repost = await db.activity.findFirst({
    where: {
      type: 'ANNOUNCE',
      actorId,
      objectId: targetActivityId,
      deleted: false,
    },
  });

  if (!repost) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Repost not found',
    });
  }

  // Soft delete the repost
  await db.activity.update({
    where: { id: repost.id },
    data: { deleted: true, deletedAt: new Date() },
  });
}

/**
 * Update an activity (edit post content)
 */
export async function updateActivity(
  actorId: string,
  input: UpdateActivityInput
): Promise<ActivityWithRelations> {
  const activity = await db.activity.findUnique({
    where: { id: input.activityId, deleted: false },
  });

  if (!activity) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Activity not found',
    });
  }

  if (activity.actorId !== actorId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You can only edit your own activities',
    });
  }

  // Only CREATE activities with NOTE object can be edited
  if (activity.type !== 'CREATE' || activity.objectType !== 'NOTE') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'This activity cannot be edited',
    });
  }

  // Update the object content
  const currentObject = activity.object as { content: string; summary?: string; sensitive?: boolean };
  const updatedObject = {
    ...currentObject,
    ...(input.content !== undefined && { content: input.content }),
    ...(input.summary !== undefined && { summary: input.summary }),
    ...(input.sensitive !== undefined && { sensitive: input.sensitive }),
  };

  const updatedActivity = await db.activity.update({
    where: { id: input.activityId },
    data: { object: updatedObject },
    include: activityInclude,
  });

  return updatedActivity;
}

/**
 * Delete an activity (soft delete)
 */
export async function deleteActivity(
  actorId: string,
  activityId: string
): Promise<void> {
  const activity = await db.activity.findUnique({
    where: { id: activityId, deleted: false },
  });

  if (!activity) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Activity not found',
    });
  }

  if (activity.actorId !== actorId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You can only delete your own activities',
    });
  }

  // Soft delete
  await db.activity.update({
    where: { id: activityId },
    data: { deleted: true, deletedAt: new Date() },
  });
}

/**
 * Get activity by ID with visibility check
 */
export async function getActivityById(
  activityId: string,
  userId: string | null
): Promise<ActivityWithRelations | null> {
  const activity = await db.activity.findUnique({
    where: { id: activityId, deleted: false },
    include: activityInclude,
  });

  if (!activity) return null;

  const canSee = await canSeeActivity(activity, userId);
  if (!canSee) return null;

  return activity;
}

/**
 * Get likes count for an activity
 */
export async function getLikesCount(activityId: string): Promise<number> {
  return db.activity.count({
    where: {
      type: 'LIKE',
      objectId: activityId,
      deleted: false,
    },
  });
}

/**
 * Get reposts count for an activity
 */
export async function getRepostsCount(activityId: string): Promise<number> {
  return db.activity.count({
    where: {
      type: 'ANNOUNCE',
      objectId: activityId,
      deleted: false,
    },
  });
}

/**
 * Check if user has liked an activity
 */
export async function hasUserLiked(
  activityId: string,
  userId: string
): Promise<boolean> {
  const like = await db.activity.findFirst({
    where: {
      type: 'LIKE',
      actorId: userId,
      objectId: activityId,
      deleted: false,
    },
    select: { id: true },
  });

  return !!like;
}

/**
 * Check if user has reposted an activity
 */
export async function hasUserReposted(
  activityId: string,
  userId: string
): Promise<boolean> {
  const repost = await db.activity.findFirst({
    where: {
      type: 'ANNOUNCE',
      actorId: userId,
      objectId: activityId,
      deleted: false,
    },
    select: { id: true },
  });

  return !!repost;
}

/**
 * Get interaction state for multiple activities
 */
export async function getInteractionStates(
  activityIds: string[],
  userId: string
): Promise<Map<string, { liked: boolean; reposted: boolean }>> {
  const [likes, reposts] = await Promise.all([
    db.activity.findMany({
      where: {
        type: 'LIKE',
        actorId: userId,
        objectId: { in: activityIds },
        deleted: false,
      },
      select: { objectId: true },
    }),
    db.activity.findMany({
      where: {
        type: 'ANNOUNCE',
        actorId: userId,
        objectId: { in: activityIds },
        deleted: false,
      },
      select: { objectId: true },
    }),
  ]);

  const likedIds = new Set(likes.map((l) => l.objectId).filter(Boolean));
  const repostedIds = new Set(reposts.map((r) => r.objectId).filter(Boolean));

  const result = new Map<string, { liked: boolean; reposted: boolean }>();
  for (const id of activityIds) {
    result.set(id, {
      liked: likedIds.has(id),
      reposted: repostedIds.has(id),
    });
  }

  return result;
}
