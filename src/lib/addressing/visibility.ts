/**
 * Visibility Checker
 * Determines if a user can see an activity based on its addressing
 */

import { db } from '@/server/db';
import { parseAddress } from './parser';
import { pluginRegistry } from '@/lib/plugins/registry';
import type { Activity } from '@prisma/client';
import type { VisibilityResult } from './types';

// =============================================================================
// Public API
// =============================================================================

/**
 * Check if a user can see an activity
 *
 * Visibility rules (evaluated in order):
 * 1. Public activities are visible to everyone
 * 2. Non-public activities require authentication
 * 3. Actor can always see their own activities
 * 4. Direct user addresses grant visibility
 * 5. Follower addresses grant visibility to accepted followers
 * 6. Context addresses grant visibility to approved members (with optional modifier)
 */
export async function canSeeActivity(
  activity: Pick<Activity, 'to' | 'cc' | 'actorId'>,
  userId: string | null
): Promise<boolean> {
  const result = await canSeeActivityWithReason(activity, userId);
  return result.visible;
}

/**
 * Check visibility with detailed reason
 */
export async function canSeeActivityWithReason(
  activity: Pick<Activity, 'to' | 'cc' | 'actorId'>,
  userId: string | null
): Promise<VisibilityResult> {
  const allAddresses = [...activity.to, ...activity.cc];

  // Rule 1: Public is always visible
  if (allAddresses.includes('public')) {
    return { visible: true, reason: 'Public activity' };
  }

  // Rule 2: Must be logged in for non-public
  if (!userId) {
    return { visible: false, reason: 'Authentication required for non-public activities' };
  }

  // Rule 3: Actor can always see their own activities
  if (activity.actorId === userId) {
    return { visible: true, reason: 'Activity owner' };
  }

  // Check each address
  for (const address of allAddresses) {
    const parsed = parseAddress(address);

    switch (parsed.type) {
      case 'user':
        // Rule 4: Direct user address
        if (parsed.id === userId) {
          return { visible: true, reason: 'Direct recipient' };
        }
        break;

      case 'followers':
        // Rule 5: Follower address
        if (await isFollowing(userId, activity.actorId)) {
          return { visible: true, reason: 'Following actor' };
        }
        break;

      case 'context':
        // Rule 6: Context membership
        if (parsed.id) {
          const canAccess = await canAccessContextAddress(userId, parsed.id, parsed.modifier);
          if (canAccess) {
            return {
              visible: true,
              reason: parsed.modifier
                ? `Context member with modifier: ${parsed.modifier}`
                : 'Context member',
            };
          }
        }
        break;
    }
  }

  return { visible: false, reason: 'No matching address found' };
}

/**
 * Filter activities that a user can see
 *
 * Efficiently batches database lookups where possible
 */
export async function filterVisibleActivities<
  T extends Pick<Activity, 'to' | 'cc' | 'actorId'>
>(activities: T[], userId: string | null): Promise<T[]> {
  if (activities.length === 0) {
    return [];
  }

  // Short-circuit: if viewing public content, filter quickly
  const publicActivities = activities.filter((a) =>
    a.to.includes('public') || a.cc.includes('public')
  );

  const nonPublicActivities = activities.filter(
    (a) => !a.to.includes('public') && !a.cc.includes('public')
  );

  // If not logged in, only return public activities
  if (!userId) {
    return publicActivities;
  }

  // For non-public activities, check each one
  // Note: This could be optimized with batch lookups for contexts/follows
  const nonPublicResults = await Promise.all(
    nonPublicActivities.map(async (activity) => ({
      activity,
      visible: await canSeeActivity(activity, userId),
    }))
  );

  const visibleNonPublic = nonPublicResults
    .filter((r) => r.visible)
    .map((r) => r.activity);

  return [...publicActivities, ...visibleNonPublic];
}

/**
 * Check if any of the given addresses would make an activity visible to the user
 */
export async function anyAddressVisible(
  addresses: string[],
  userId: string | null,
  actorId: string
): Promise<boolean> {
  const fakeActivity = { to: addresses, cc: [], actorId };
  return canSeeActivity(fakeActivity, userId);
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Check if viewer is following actor
 */
async function isFollowing(viewerId: string, actorId: string): Promise<boolean> {
  const follow = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: viewerId,
        followingId: actorId,
      },
    },
  });

  return follow?.status === 'ACCEPTED';
}

/**
 * Check if user can access a context-based address
 *
 * Handles standard modifiers:
 * - No modifier: any approved member
 * - 'admins': OWNER or ADMIN role
 * - 'moderators': OWNER, ADMIN, or MODERATOR role
 * - 'role:{ROLE}': specific role only
 * - Plugin-defined patterns: delegated to plugin resolver
 */
async function canAccessContextAddress(
  userId: string,
  contextId: string,
  modifier?: string
): Promise<boolean> {
  const membership = await db.membership.findUnique({
    where: { contextId_userId: { contextId, userId } },
  });

  // Must be approved member
  if (!membership || membership.status !== 'APPROVED') {
    return false;
  }

  // No modifier = any approved member
  if (!modifier) {
    return true;
  }

  // Standard modifiers
  if (modifier === 'admins') {
    return ['OWNER', 'ADMIN'].includes(membership.role);
  }

  if (modifier === 'moderators') {
    return ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role);
  }

  if (modifier.startsWith('role:')) {
    const requiredRole = modifier.slice(5);
    return membership.role === requiredRole;
  }

  // Check plugin-defined patterns
  const context = await db.context.findUnique({
    where: { id: contextId },
    select: { features: true },
  });

  if (!context) return false;

  for (const pluginId of context.features) {
    const plugin = pluginRegistry.get(pluginId);
    if (!plugin?.addressPatterns) continue;

    for (const pattern of plugin.addressPatterns) {
      // Pattern format: 'context:{id}:modifier'
      const patternModifier = pattern.pattern.replace('context:{id}:', '');
      if (patternModifier === modifier) {
        return await pattern.resolver(contextId, userId);
      }
    }
  }

  return false;
}

// =============================================================================
// Batch Optimization Helpers (for future optimization)
// =============================================================================

/**
 * Batch check follow status for multiple user pairs
 * Useful for optimizing filterVisibleActivities when many follower checks needed
 */
export async function batchCheckFollowing(
  viewerId: string,
  actorIds: string[]
): Promise<Set<string>> {
  if (actorIds.length === 0) return new Set();

  const follows = await db.follow.findMany({
    where: {
      followerId: viewerId,
      followingId: { in: actorIds },
      status: 'ACCEPTED',
    },
    select: { followingId: true },
  });

  return new Set(follows.map((f) => f.followingId));
}

/**
 * Batch check context membership for multiple contexts
 */
export async function batchCheckMembership(
  userId: string,
  contextIds: string[]
): Promise<Map<string, string>> {
  if (contextIds.length === 0) return new Map();

  const memberships = await db.membership.findMany({
    where: {
      userId,
      contextId: { in: contextIds },
      status: 'APPROVED',
    },
    select: { contextId: true, role: true },
  });

  return new Map(memberships.map((m) => [m.contextId, m.role]));
}
