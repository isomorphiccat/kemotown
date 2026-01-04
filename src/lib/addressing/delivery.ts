/**
 * Delivery Service
 * Delivers activities to recipient inboxes based on addressing
 */

import { db } from '@/server/db';
import { parseAddress, extractContextIds, extractUserIds } from './parser';
import { pluginRegistry } from '@/lib/plugins/registry';
import type { Activity, InboxCategory, MemberRole, Prisma } from '@prisma/client';
import type { DeliveryResult } from './types';

// =============================================================================
// Public API
// =============================================================================

/**
 * Deliver an activity to all recipients' inboxes
 *
 * Resolution process:
 * 1. Parse all addresses in `to` and `cc`
 * 2. Resolve each address to concrete user IDs
 * 3. Batch-create inbox items for all unique recipients
 *
 * Note: Public addresses don't create inbox items - users query public timelines instead
 */
export async function deliverActivity(
  activity: Pick<Activity, 'id' | 'type' | 'actorId' | 'to' | 'cc'>
): Promise<number> {
  const recipients = await resolveRecipients(activity);

  // Never deliver to the actor themselves
  recipients.delete(activity.actorId);

  if (recipients.size === 0) return 0;

  // Determine category based on activity type
  const category = determineCategory(activity.type);

  // Batch create inbox items
  await db.inboxItem.createMany({
    data: [...recipients].map((userId) => ({
      userId,
      activityId: activity.id,
      category,
    })),
    skipDuplicates: true,
  });

  return recipients.size;
}

/**
 * Enhanced delivery with mention detection
 *
 * In addition to standard delivery:
 * 1. Extracts @mentions from activity content
 * 2. Adds mentioned users to delivery list
 * 3. Creates high-priority MENTION inbox items
 */
export async function deliverActivityWithMentions(
  activity: Pick<Activity, 'id' | 'type' | 'actorId' | 'to' | 'cc' | 'object'>
): Promise<DeliveryResult> {
  // Extract mentions from content
  const mentionedUsernames = extractMentionsFromContent(activity.object);

  // Resolve usernames to user IDs
  const mentionedUserIds = await resolveMentionedUsers(mentionedUsernames);

  // Add mentioned users to cc for regular delivery
  const enhancedActivity = {
    ...activity,
    cc: [...activity.cc, ...mentionedUserIds.map((id) => `user:${id}`)],
  };

  // Standard delivery
  const delivered = await deliverActivity(enhancedActivity);

  // Create separate high-priority mention notifications
  const mentionRecipients = mentionedUserIds.filter(
    (id) => id !== activity.actorId
  );

  if (mentionRecipients.length > 0) {
    await db.inboxItem.createMany({
      data: mentionRecipients.map((userId) => ({
        userId,
        activityId: activity.id,
        category: 'MENTION' as InboxCategory,
        priority: 1, // Higher priority for mentions
      })),
      skipDuplicates: true,
    });
  }

  return {
    delivered,
    mentioned: mentionRecipients.length,
  };
}

/**
 * Resolve all addresses to user IDs
 */
export async function resolveRecipients(
  activity: Pick<Activity, 'actorId' | 'to' | 'cc'>
): Promise<Set<string>> {
  const recipients = new Set<string>();
  const allAddresses = [...activity.to, ...activity.cc];

  for (const address of allAddresses) {
    const parsed = parseAddress(address);

    switch (parsed.type) {
      case 'public':
        // Public activities don't get individual inbox delivery
        // Users query public timelines instead
        break;

      case 'followers':
        const followers = await getAcceptedFollowers(activity.actorId);
        followers.forEach((id) => recipients.add(id));
        break;

      case 'user':
        if (parsed.id) {
          recipients.add(parsed.id);
        }
        break;

      case 'context':
        if (parsed.id) {
          const contextRecipients = await resolveContextRecipients(
            parsed.id,
            parsed.modifier
          );
          contextRecipients.forEach((id) => recipients.add(id));
        }
        break;
    }
  }

  return recipients;
}

/**
 * Get the delivery count without actually delivering
 * Useful for previewing who will receive an activity
 */
export async function previewDelivery(
  activity: Pick<Activity, 'actorId' | 'to' | 'cc'>
): Promise<{
  recipientCount: number;
  hasPublic: boolean;
  hasFollowers: boolean;
  contextIds: string[];
  directUserIds: string[];
}> {
  const allAddresses = [...activity.to, ...activity.cc];

  return {
    recipientCount: (await resolveRecipients(activity)).size,
    hasPublic: allAddresses.includes('public'),
    hasFollowers: allAddresses.includes('followers'),
    contextIds: extractContextIds(allAddresses),
    directUserIds: extractUserIds(allAddresses),
  };
}

/**
 * Delete delivery for an activity (e.g., when activity is deleted)
 */
export async function deleteDelivery(activityId: string): Promise<number> {
  const result = await db.inboxItem.deleteMany({
    where: { activityId },
  });

  return result.count;
}

/**
 * Mark activity as read for a user
 */
export async function markAsRead(
  activityId: string,
  userId: string
): Promise<void> {
  await db.inboxItem.update({
    where: {
      userId_activityId: { userId, activityId },
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

/**
 * Mark all inbox items as read for a user
 */
export async function markAllAsRead(
  userId: string,
  category?: InboxCategory
): Promise<number> {
  const where: Prisma.InboxItemWhereInput = {
    userId,
    read: false,
  };

  if (category) {
    where.category = category;
  }

  const result = await db.inboxItem.updateMany({
    where,
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  return result.count;
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Get all accepted followers for a user
 */
async function getAcceptedFollowers(userId: string): Promise<string[]> {
  const followers = await db.follow.findMany({
    where: {
      followingId: userId,
      status: 'ACCEPTED',
    },
    select: { followerId: true },
  });

  return followers.map((f) => f.followerId);
}

/**
 * Resolve context address to user IDs
 *
 * Standard modifiers:
 * - No modifier: all approved members
 * - 'admins': OWNER, ADMIN
 * - 'moderators': OWNER, ADMIN, MODERATOR
 * - 'role:ROLE': specific role only
 */
async function resolveContextRecipients(
  contextId: string,
  modifier?: string
): Promise<string[]> {
  const where: Prisma.MembershipWhereInput = {
    contextId,
    status: 'APPROVED',
  };

  // Apply modifier-based filtering
  if (modifier === 'admins') {
    where.role = { in: ['OWNER', 'ADMIN'] as MemberRole[] };
  } else if (modifier === 'moderators') {
    where.role = { in: ['OWNER', 'ADMIN', 'MODERATOR'] as MemberRole[] };
  } else if (modifier?.startsWith('role:')) {
    where.role = modifier.slice(5) as MemberRole;
  } else if (modifier) {
    // Plugin-specific modifiers require custom resolution
    return resolvePluginContextRecipients(contextId, modifier);
  }

  const memberships = await db.membership.findMany({
    where,
    select: { userId: true },
  });

  return memberships.map((m) => m.userId);
}

/**
 * Resolve plugin-defined address modifiers
 */
async function resolvePluginContextRecipients(
  contextId: string,
  modifier: string
): Promise<string[]> {
  const context = await db.context.findUnique({
    where: { id: contextId },
    select: { features: true },
  });

  if (!context) return [];

  for (const pluginId of context.features) {
    const plugin = pluginRegistry.get(pluginId);
    if (!plugin?.addressPatterns) continue;

    for (const pattern of plugin.addressPatterns) {
      const patternModifier = pattern.pattern.replace('context:{id}:', '');
      if (patternModifier === modifier) {
        // For delivery, we need to resolve to all matching users
        // This requires a plugin-provided resolver that returns user IDs
        // For now, we fall back to all approved members
        // TODO: Add bulk resolution support to plugin addressPatterns
        const memberships = await db.membership.findMany({
          where: { contextId, status: 'APPROVED' },
          select: { userId: true },
        });

        // Filter through the resolver (expensive but correct)
        const results = await Promise.all(
          memberships.map(async (m) => ({
            userId: m.userId,
            matches: await pattern.resolver(contextId, m.userId),
          }))
        );

        return results.filter((r) => r.matches).map((r) => r.userId);
      }
    }
  }

  return [];
}

/**
 * Determine inbox category based on activity type
 */
function determineCategory(activityType: string): InboxCategory {
  switch (activityType) {
    case 'LIKE':
      return 'LIKE';

    case 'ANNOUNCE':
      return 'REPOST';

    case 'FOLLOW':
    case 'ACCEPT':
      return 'FOLLOW';

    case 'CREATE':
      // Could be REPLY or DEFAULT depending on context
      // The caller should handle DM detection separately
      return 'REPLY';

    case 'RSVP':
    case 'CHECKIN':
      return 'EVENT';

    case 'JOIN':
    case 'LEAVE':
    case 'INVITE':
      return 'GROUP';

    case 'FLAG':
    case 'BLOCK':
      return 'SYSTEM';

    default:
      return 'DEFAULT';
  }
}

/**
 * Extract @mentions from activity content
 */
function extractMentionsFromContent(object: unknown): string[] {
  if (!object || typeof object !== 'object') return [];

  const obj = object as { content?: string; mentions?: string[] };

  // If explicit mentions array exists, use it (preferred)
  if (Array.isArray(obj.mentions)) {
    return obj.mentions;
  }

  // Otherwise, parse from content
  if (typeof obj.content === 'string') {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const usernames: string[] = [];
    let match;

    while ((match = mentionRegex.exec(obj.content)) !== null) {
      usernames.push(match[1]);
    }

    return usernames;
  }

  return [];
}

/**
 * Resolve usernames to user IDs
 */
async function resolveMentionedUsers(usernames: string[]): Promise<string[]> {
  if (usernames.length === 0) return [];

  const users = await db.user.findMany({
    where: {
      username: { in: usernames },
    },
    select: { id: true },
  });

  return users.map((u) => u.id);
}

// =============================================================================
// Batch Operations (for performance optimization)
// =============================================================================

/**
 * Batch deliver multiple activities
 * More efficient than individual deliveries for bulk operations
 */
export async function batchDeliverActivities(
  activities: Array<Pick<Activity, 'id' | 'type' | 'actorId' | 'to' | 'cc'>>
): Promise<number> {
  if (activities.length === 0) return 0;

  // Collect all inbox items to create
  const allInboxItems: Array<{
    userId: string;
    activityId: string;
    category: InboxCategory;
  }> = [];

  for (const activity of activities) {
    const recipients = await resolveRecipients(activity);
    recipients.delete(activity.actorId);

    const category = determineCategory(activity.type);

    for (const userId of recipients) {
      allInboxItems.push({
        userId,
        activityId: activity.id,
        category,
      });
    }
  }

  if (allInboxItems.length === 0) return 0;

  await db.inboxItem.createMany({
    data: allInboxItems,
    skipDuplicates: true,
  });

  return allInboxItems.length;
}

/**
 * Update priority for activities matching criteria
 */
export async function updateDeliveryPriority(
  activityId: string,
  priority: number,
  category?: InboxCategory
): Promise<number> {
  const where: Prisma.InboxItemWhereInput = { activityId };

  if (category) {
    where.category = category;
  }

  const result = await db.inboxItem.updateMany({
    where,
    data: { priority },
  });

  return result.count;
}
