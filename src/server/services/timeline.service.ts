/**
 * Timeline Service
 * Handles timeline queries with efficient pagination and visibility filtering
 */

import { db } from '@/server/db';
import type { Prisma, ActivityType } from '@prisma/client';
import {
  canSeeActivity,
  getInteractionStates,
  type TimelineItem,
} from './activity.service';

// =============================================================================
// Types
// =============================================================================

export interface TimelineResult {
  items: TimelineItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface TimelineOptions {
  cursor?: string;
  limit: number;
  includeReplies?: boolean;
  includeReposts?: boolean;
}

// =============================================================================
// Common Query Config
// =============================================================================

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

// =============================================================================
// Timeline Queries
// =============================================================================

/**
 * Get public timeline (all public posts)
 */
export async function getPublicTimeline(
  options: TimelineOptions,
  userId: string | null
): Promise<TimelineResult> {
  const { cursor, limit, includeReplies = false } = options;

  const where: Prisma.ActivityWhereInput = {
    deleted: false,
    to: { has: 'public' },
    type: { in: ['CREATE', 'ANNOUNCE'] },
    objectType: 'NOTE',
    ...(!includeReplies && { inReplyTo: null }),
  };

  const activities = await db.activity.findMany({
    where: {
      ...where,
      ...(cursor && { published: { lt: new Date(cursor) } }),
    },
    include: activityInclude,
    orderBy: { published: 'desc' },
    take: limit + 1,
  });

  const hasMore = activities.length > limit;
  const items = hasMore ? activities.slice(0, -1) : activities;

  // Get interaction states if user is logged in
  let interactionStates = new Map<string, { liked: boolean; reposted: boolean }>();
  if (userId && items.length > 0) {
    interactionStates = await getInteractionStates(
      items.map((a) => a.id),
      userId
    );
  }

  // For ANNOUNCE activities, fetch the original activity
  const announceItems = items.filter((a) => a.type === 'ANNOUNCE' && a.objectId);
  const originalActivities = announceItems.length > 0
    ? await db.activity.findMany({
        where: {
          id: { in: announceItems.map((a) => a.objectId!).filter(Boolean) },
          deleted: false,
        },
        include: activityInclude,
      })
    : [];
  const originalMap = new Map(originalActivities.map((a) => [a.id, a]));

  const timelineItems: TimelineItem[] = items.map((activity) => ({
    activity,
    originalActivity:
      activity.type === 'ANNOUNCE' && activity.objectId
        ? originalMap.get(activity.objectId)
        : undefined,
    ...(interactionStates.get(activity.id) || { liked: false, reposted: false }),
  }));

  return {
    items: timelineItems,
    nextCursor: hasMore && items.length > 0
      ? items[items.length - 1].published.toISOString()
      : null,
    hasMore,
  };
}

/**
 * Get home timeline (posts from followed users + own posts)
 */
export async function getHomeTimeline(
  userId: string,
  options: TimelineOptions
): Promise<TimelineResult> {
  const { cursor, limit, includeReplies = false } = options;

  // Get list of users the current user follows
  const following = await db.follow.findMany({
    where: {
      followerId: userId,
      status: 'ACCEPTED',
    },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);

  // Include own posts + followed users' posts
  const actorIds = [userId, ...followingIds];

  const where: Prisma.ActivityWhereInput = {
    deleted: false,
    type: { in: ['CREATE', 'ANNOUNCE'] },
    objectType: 'NOTE',
    // Either from followed users or addressed to current user
    OR: [
      { actorId: { in: actorIds }, to: { has: 'public' } },
      { actorId: { in: actorIds }, to: { has: 'followers' } },
      { to: { has: `user:${userId}` } },
    ],
    ...(!includeReplies && { inReplyTo: null }),
  };

  const activities = await db.activity.findMany({
    where: {
      ...where,
      ...(cursor && { published: { lt: new Date(cursor) } }),
    },
    include: activityInclude,
    orderBy: { published: 'desc' },
    take: limit + 1,
  });

  const hasMore = activities.length > limit;
  const items = hasMore ? activities.slice(0, -1) : activities;

  // Get interaction states
  const interactionStates = items.length > 0
    ? await getInteractionStates(items.map((a) => a.id), userId)
    : new Map();

  // Fetch original activities for reposts
  const announceItems = items.filter((a) => a.type === 'ANNOUNCE' && a.objectId);
  const originalActivities = announceItems.length > 0
    ? await db.activity.findMany({
        where: {
          id: { in: announceItems.map((a) => a.objectId!).filter(Boolean) },
          deleted: false,
        },
        include: activityInclude,
      })
    : [];
  const originalMap = new Map(originalActivities.map((a) => [a.id, a]));

  const timelineItems: TimelineItem[] = items.map((activity) => ({
    activity,
    originalActivity:
      activity.type === 'ANNOUNCE' && activity.objectId
        ? originalMap.get(activity.objectId)
        : undefined,
    ...(interactionStates.get(activity.id) || { liked: false, reposted: false }),
  }));

  return {
    items: timelineItems,
    nextCursor: hasMore && items.length > 0
      ? items[items.length - 1].published.toISOString()
      : null,
    hasMore,
  };
}

/**
 * Get event timeline (posts scoped to an event)
 */
export async function getEventTimeline(
  eventId: string,
  options: TimelineOptions,
  userId: string | null
): Promise<TimelineResult> {
  const { cursor, limit, includeReplies = true } = options;

  // Check if user can view event (for private events)
  // For now, we assume event visibility is checked at a higher level

  const where: Prisma.ActivityWhereInput = {
    deleted: false,
    type: 'CREATE',
    objectType: 'NOTE',
    to: { has: `event:${eventId}` },
    ...(!includeReplies && { inReplyTo: null }),
  };

  const activities = await db.activity.findMany({
    where: {
      ...where,
      ...(cursor && { published: { lt: new Date(cursor) } }),
    },
    include: activityInclude,
    orderBy: { published: 'desc' },
    take: limit + 1,
  });

  const hasMore = activities.length > limit;
  const items = hasMore ? activities.slice(0, -1) : activities;

  // Get interaction states if user is logged in
  let interactionStates = new Map<string, { liked: boolean; reposted: boolean }>();
  if (userId && items.length > 0) {
    interactionStates = await getInteractionStates(
      items.map((a) => a.id),
      userId
    );
  }

  const timelineItems: TimelineItem[] = items.map((activity) => ({
    activity,
    ...(interactionStates.get(activity.id) || { liked: false, reposted: false }),
  }));

  return {
    items: timelineItems,
    nextCursor: hasMore && items.length > 0
      ? items[items.length - 1].published.toISOString()
      : null,
    hasMore,
  };
}

/**
 * Get context timeline (posts in a group, event, or convention)
 * Uses the unified addressing system: context:{id}
 */
export async function getContextTimeline(
  contextId: string,
  options: TimelineOptions,
  userId: string | null
): Promise<TimelineResult> {
  const { cursor, limit, includeReplies = true } = options;

  // Query activities addressed to this context
  // The `to` array should contain `context:{contextId}`
  const where: Prisma.ActivityWhereInput = {
    deleted: false,
    type: 'CREATE',
    objectType: 'NOTE',
    OR: [
      { to: { has: `context:${contextId}` } },
      { cc: { has: `context:${contextId}` } },
      // Legacy support for event:{id} addressing
      { to: { has: `event:${contextId}` } },
    ],
    ...(!includeReplies && { inReplyTo: null }),
  };

  const activities = await db.activity.findMany({
    where: {
      ...where,
      ...(cursor && { published: { lt: new Date(cursor) } }),
    },
    include: activityInclude,
    orderBy: { published: 'desc' },
    take: limit + 1,
  });

  const hasMore = activities.length > limit;
  const items = hasMore ? activities.slice(0, -1) : activities;

  // Get interaction states if user is logged in
  let interactionStates = new Map<string, { liked: boolean; reposted: boolean }>();
  if (userId && items.length > 0) {
    interactionStates = await getInteractionStates(
      items.map((a) => a.id),
      userId
    );
  }

  const timelineItems: TimelineItem[] = items.map((activity) => ({
    activity,
    ...(interactionStates.get(activity.id) || { liked: false, reposted: false }),
  }));

  return {
    items: timelineItems,
    nextCursor: hasMore && items.length > 0
      ? items[items.length - 1].published.toISOString()
      : null,
    hasMore,
  };
}

/**
 * Get activity thread (activity + all replies in tree structure)
 */
export async function getActivityThread(
  activityId: string,
  userId: string | null
): Promise<{
  root: TimelineItem;
  replies: TimelineItem[];
  totalReplies: number;
}> {
  // Get the root activity
  const root = await db.activity.findUnique({
    where: { id: activityId, deleted: false },
    include: activityInclude,
  });

  if (!root) {
    throw new Error('Activity not found');
  }

  // Get all replies
  const replies = await db.activity.findMany({
    where: {
      deleted: false,
      type: 'CREATE',
      objectType: 'NOTE',
      inReplyTo: activityId,
    },
    include: activityInclude,
    orderBy: { published: 'asc' },
  });

  // Get interaction states if user is logged in
  let interactionStates = new Map<string, { liked: boolean; reposted: boolean }>();
  if (userId) {
    const allIds = [root.id, ...replies.map((r) => r.id)];
    interactionStates = await getInteractionStates(allIds, userId);
  }

  return {
    root: {
      activity: root,
      ...(interactionStates.get(root.id) || { liked: false, reposted: false }),
    },
    replies: replies.map((reply) => ({
      activity: reply,
      ...(interactionStates.get(reply.id) || { liked: false, reposted: false }),
    })),
    totalReplies: replies.length,
  };
}

/**
 * Get user timeline (a specific user's posts)
 */
export async function getUserTimeline(
  targetUserId: string,
  options: TimelineOptions,
  viewerId: string | null
): Promise<TimelineResult> {
  const { cursor, limit, includeReplies = false, includeReposts = true } = options;

  // Build visibility filter based on viewer's relationship to target
  const visibilityFilter: Prisma.ActivityWhereInput[] = [
    { to: { has: 'public' } },
  ];

  if (viewerId) {
    // Viewer can see posts addressed to them
    visibilityFilter.push({ to: { has: `user:${viewerId}` } });

    // Check if viewer follows target
    if (viewerId !== targetUserId) {
      const follow = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: targetUserId,
          },
        },
        select: { status: true },
      });

      if (follow?.status === 'ACCEPTED') {
        visibilityFilter.push({ to: { has: 'followers' } });
      }
    } else {
      // Viewing own profile - can see everything
      visibilityFilter.push({ to: { has: 'followers' } });
    }
  }

  const activityTypes: ActivityType[] = includeReposts
    ? ['CREATE', 'ANNOUNCE']
    : ['CREATE'];

  const where: Prisma.ActivityWhereInput = {
    deleted: false,
    actorId: targetUserId,
    type: { in: activityTypes },
    objectType: 'NOTE',
    OR: visibilityFilter,
    ...(!includeReplies && { inReplyTo: null }),
  };

  const activities = await db.activity.findMany({
    where: {
      ...where,
      ...(cursor && { published: { lt: new Date(cursor) } }),
    },
    include: activityInclude,
    orderBy: { published: 'desc' },
    take: limit + 1,
  });

  const hasMore = activities.length > limit;
  const items = hasMore ? activities.slice(0, -1) : activities;

  // Get interaction states if viewer is logged in
  let interactionStates = new Map<string, { liked: boolean; reposted: boolean }>();
  if (viewerId && items.length > 0) {
    interactionStates = await getInteractionStates(
      items.map((a) => a.id),
      viewerId
    );
  }

  // Fetch original activities for reposts
  const announceItems = items.filter((a) => a.type === 'ANNOUNCE' && a.objectId);
  const originalActivities = announceItems.length > 0
    ? await db.activity.findMany({
        where: {
          id: { in: announceItems.map((a) => a.objectId!).filter(Boolean) },
          deleted: false,
        },
        include: activityInclude,
      })
    : [];
  const originalMap = new Map(originalActivities.map((a) => [a.id, a]));

  const timelineItems: TimelineItem[] = items.map((activity) => ({
    activity,
    originalActivity:
      activity.type === 'ANNOUNCE' && activity.objectId
        ? originalMap.get(activity.objectId)
        : undefined,
    ...(interactionStates.get(activity.id) || { liked: false, reposted: false }),
  }));

  return {
    items: timelineItems,
    nextCursor: hasMore && items.length > 0
      ? items[items.length - 1].published.toISOString()
      : null,
    hasMore,
  };
}

/**
 * Get replies to an activity
 */
export async function getReplies(
  activityId: string,
  options: TimelineOptions,
  userId: string | null
): Promise<TimelineResult> {
  const { cursor, limit } = options;

  // First verify the parent activity exists and user can see it
  const parentActivity = await db.activity.findUnique({
    where: { id: activityId, deleted: false },
  });

  if (!parentActivity) {
    return { items: [], nextCursor: null, hasMore: false };
  }

  const canSee = await canSeeActivity(parentActivity, userId);
  if (!canSee) {
    return { items: [], nextCursor: null, hasMore: false };
  }

  const activities = await db.activity.findMany({
    where: {
      deleted: false,
      inReplyTo: activityId,
      type: 'CREATE',
      ...(cursor && { published: { gt: new Date(cursor) } }),
    },
    include: activityInclude,
    orderBy: { published: 'asc' }, // Oldest first for replies
    take: limit + 1,
  });

  const hasMore = activities.length > limit;
  const items = hasMore ? activities.slice(0, -1) : activities;

  // Get interaction states if user is logged in
  let interactionStates = new Map<string, { liked: boolean; reposted: boolean }>();
  if (userId && items.length > 0) {
    interactionStates = await getInteractionStates(
      items.map((a) => a.id),
      userId
    );
  }

  const timelineItems: TimelineItem[] = items.map((activity) => ({
    activity,
    ...(interactionStates.get(activity.id) || { liked: false, reposted: false }),
  }));

  return {
    items: timelineItems,
    nextCursor: hasMore && items.length > 0
      ? items[items.length - 1].published.toISOString()
      : null,
    hasMore,
  };
}

/**
 * Get likes on an activity
 */
export async function getLikers(
  activityId: string,
  options: { cursor?: string; limit: number },
  userId: string | null
): Promise<{
  users: { id: string; username: string | null; displayName: string | null; avatarUrl: string | null }[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const { cursor, limit } = options;

  // Verify parent activity exists and user can see it
  const parentActivity = await db.activity.findUnique({
    where: { id: activityId, deleted: false },
  });

  if (!parentActivity) {
    return { users: [], nextCursor: null, hasMore: false };
  }

  const canSee = await canSeeActivity(parentActivity, userId);
  if (!canSee) {
    return { users: [], nextCursor: null, hasMore: false };
  }

  const likes = await db.activity.findMany({
    where: {
      deleted: false,
      type: 'LIKE',
      objectId: activityId,
      ...(cursor && { published: { lt: new Date(cursor) } }),
    },
    include: {
      actor: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { published: 'desc' },
    take: limit + 1,
  });

  const hasMore = likes.length > limit;
  const items = hasMore ? likes.slice(0, -1) : likes;

  return {
    users: items.map((l) => l.actor),
    nextCursor: hasMore && items.length > 0
      ? items[items.length - 1].published.toISOString()
      : null,
    hasMore,
  };
}

/**
 * Get reposters of an activity
 */
export async function getReposters(
  activityId: string,
  options: { cursor?: string; limit: number },
  userId: string | null
): Promise<{
  users: { id: string; username: string | null; displayName: string | null; avatarUrl: string | null }[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const { cursor, limit } = options;

  // Verify parent activity exists and user can see it
  const parentActivity = await db.activity.findUnique({
    where: { id: activityId, deleted: false },
  });

  if (!parentActivity) {
    return { users: [], nextCursor: null, hasMore: false };
  }

  const canSee = await canSeeActivity(parentActivity, userId);
  if (!canSee) {
    return { users: [], nextCursor: null, hasMore: false };
  }

  const reposts = await db.activity.findMany({
    where: {
      deleted: false,
      type: 'ANNOUNCE',
      objectId: activityId,
      ...(cursor && { published: { lt: new Date(cursor) } }),
    },
    include: {
      actor: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { published: 'desc' },
    take: limit + 1,
  });

  const hasMore = reposts.length > limit;
  const items = hasMore ? reposts.slice(0, -1) : reposts;

  return {
    users: items.map((r) => r.actor),
    nextCursor: hasMore && items.length > 0
      ? items[items.length - 1].published.toISOString()
      : null,
    hasMore,
  };
}
