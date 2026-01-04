/**
 * Inbox Service
 * Handles notification listing, marking read, and counts
 */

import { InboxCategory, Prisma } from '@prisma/client';
import { db } from '../db';
import { getCategoryFilter } from '@/schemas/inbox.schema';

// =============================================================================
// Types
// =============================================================================

export interface InboxItemWithActivity {
  id: string;
  userId: string;
  activityId: string;
  read: boolean;
  muted: boolean;
  category: InboxCategory;
  createdAt: Date;
  activity: {
    id: string;
    type: string;
    actorId: string;
    objectType: string | null;
    objectId: string | null;
    object: Prisma.JsonValue;
    published: Date;
    actor: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
  };
}

export interface UnreadCounts {
  total: number;
  mentions: number;
  likes: number;
  follows: number;
  reposts: number;
  replies: number;
}

// =============================================================================
// List Notifications
// =============================================================================

/**
 * List inbox items (notifications) for a user
 */
export async function listNotifications(
  userId: string,
  options: {
    category?: 'all' | 'mentions' | 'likes' | 'follows' | 'reposts' | 'replies';
    unreadOnly?: boolean;
    cursor?: string;
    limit?: number;
  }
): Promise<{
  items: InboxItemWithActivity[];
  nextCursor: string | null;
}> {
  const { category = 'all', unreadOnly = false, cursor, limit = 20 } = options;

  const categories = getCategoryFilter(category);

  const where: Prisma.InboxItemWhereInput = {
    userId,
    category: { in: categories },
    muted: false,
    ...(unreadOnly && { read: false }),
    ...(cursor && { createdAt: { lt: await getCursorDate(cursor) } }),
  };

  const items = await db.inboxItem.findMany({
    where,
    take: limit + 1,
    orderBy: { createdAt: 'desc' },
    include: {
      activity: {
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      },
    },
  });

  const hasMore = items.length > limit;
  const returnItems = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore ? returnItems[returnItems.length - 1]?.id : null;

  return {
    items: returnItems as InboxItemWithActivity[],
    nextCursor,
  };
}

/**
 * Get the createdAt date for cursor-based pagination
 */
async function getCursorDate(cursor: string): Promise<Date> {
  const item = await db.inboxItem.findUnique({
    where: { id: cursor },
    select: { createdAt: true },
  });
  return item?.createdAt ?? new Date();
}

// =============================================================================
// Mark Read
// =============================================================================

/**
 * Mark specific inbox items as read
 */
export async function markItemsRead(
  userId: string,
  itemIds: string[]
): Promise<number> {
  const result = await db.inboxItem.updateMany({
    where: {
      id: { in: itemIds },
      userId, // Ensure user owns these items
      read: false,
    },
    data: { read: true },
  });

  return result.count;
}

/**
 * Mark all inbox items as read (optionally by category)
 */
export async function markAllRead(
  userId: string,
  category?: 'all' | 'mentions' | 'likes' | 'follows' | 'reposts' | 'replies'
): Promise<number> {
  const categories = category ? getCategoryFilter(category) : getCategoryFilter('all');

  const result = await db.inboxItem.updateMany({
    where: {
      userId,
      category: { in: categories },
      read: false,
    },
    data: { read: true },
  });

  return result.count;
}

// =============================================================================
// Unread Counts
// =============================================================================

/**
 * Get unread notification counts by category
 */
export async function getUnreadCounts(userId: string): Promise<UnreadCounts> {
  // Get counts for each category
  const [total, mentions, likes, follows, reposts, replies] = await Promise.all([
    db.inboxItem.count({
      where: {
        userId,
        read: false,
        muted: false,
        category: { not: InboxCategory.DM }, // Exclude DMs from notification count
      },
    }),
    db.inboxItem.count({
      where: { userId, read: false, muted: false, category: InboxCategory.MENTION },
    }),
    db.inboxItem.count({
      where: { userId, read: false, muted: false, category: InboxCategory.LIKE },
    }),
    db.inboxItem.count({
      where: { userId, read: false, muted: false, category: InboxCategory.FOLLOW },
    }),
    db.inboxItem.count({
      where: { userId, read: false, muted: false, category: InboxCategory.REPOST },
    }),
    db.inboxItem.count({
      where: { userId, read: false, muted: false, category: InboxCategory.REPLY },
    }),
  ]);

  return {
    total,
    mentions,
    likes,
    follows,
    reposts,
    replies,
  };
}

// =============================================================================
// Delete Notification
// =============================================================================

/**
 * Delete a notification (mute it so it doesn't appear)
 */
export async function deleteNotification(
  userId: string,
  itemId: string
): Promise<boolean> {
  const result = await db.inboxItem.updateMany({
    where: {
      id: itemId,
      userId, // Ensure user owns this item
    },
    data: { muted: true },
  });

  return result.count > 0;
}

// =============================================================================
// Notification Delivery Helpers
// =============================================================================

/**
 * Create inbox items for activity delivery
 * This is called by other services when creating activities that should notify users
 */
export async function deliverToInbox(
  activityId: string,
  recipients: Array<{ userId: string; category: InboxCategory }>
): Promise<number> {
  if (recipients.length === 0) return 0;

  // Use createMany with skipDuplicates to avoid constraint violations
  const result = await db.inboxItem.createMany({
    data: recipients.map((r) => ({
      activityId,
      userId: r.userId,
      category: r.category,
    })),
    skipDuplicates: true,
  });

  return result.count;
}

/**
 * Get notification recipients from activity addressing
 * Parses to/cc arrays to determine who should receive notifications
 */
export function parseAddressees(
  to: string[],
  cc: string[],
  actorId: string
): string[] {
  const recipients = new Set<string>();

  for (const address of [...to, ...cc]) {
    // Direct user addressing: "user:{cuid}"
    if (address.startsWith('user:')) {
      const userId = address.replace('user:', '');
      if (userId !== actorId) {
        recipients.add(userId);
      }
    }
    // "public" and "followers" don't create inbox items
    // (users query timelines instead)
  }

  return Array.from(recipients);
}
