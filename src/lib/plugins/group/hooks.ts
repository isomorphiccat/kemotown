/**
 * Group Plugin Lifecycle Hooks
 * Business logic for group-specific behaviors
 */

import type { PluginHooks, ContextData, MembershipData, ActivityData } from '../types';
import type { GroupPluginData } from './schema';
import { db } from '@/server/db';

/**
 * Group plugin lifecycle hooks
 */
export const groupHooks: PluginHooks<GroupPluginData> = {
  /**
   * Called when a group is created
   */
  onContextCreate: async (context: ContextData, data: GroupPluginData) => {
    console.log(`[GroupPlugin] Group created: ${context.name}`, {
      type: data.groupType,
      discoverable: data.isDiscoverable,
    });

    // Could set up initial announcements channel
    // Could create welcome pinned post
  },

  /**
   * Called when group settings are updated
   */
  onContextUpdate: async (
    context: ContextData,
    data: GroupPluginData,
    prevData: GroupPluginData
  ) => {
    // Check for significant changes that might need notifications
    const rulesChanged = data.postingGuidelines !== prevData.postingGuidelines;
    const moderationChanged =
      JSON.stringify(data.moderation) !== JSON.stringify(prevData.moderation);

    if (rulesChanged || moderationChanged) {
      console.log(`[GroupPlugin] Group settings updated: ${context.name}`, {
        rulesChanged,
        moderationChanged,
      });

      // Could notify members about rule changes
    }
  },

  /**
   * Called when group is deleted/archived
   */
  onContextDelete: async (context: ContextData) => {
    console.log(`[GroupPlugin] Group deleted: ${context.name}`);

    // Could export member list for owner
    // Could send farewell notifications
  },

  /**
   * Called when user joins group
   */
  onMemberJoin: async (membership: MembershipData, context: ContextData) => {
    const plugins = context.plugins;
    const groupData = plugins.group as GroupPluginData | undefined;

    console.log(`[GroupPlugin] User joined group: ${context.name}`, {
      memberId: membership.id,
      role: membership.role,
    });

    // Send welcome message if configured
    if (groupData?.welcomeMessage) {
      // Could create a DM or system message to the new member
      console.log(`[GroupPlugin] Would send welcome: ${groupData.welcomeMessage}`);
    }

    // Could prompt for required profile fields
    if (groupData?.requiredProfileFields?.length) {
      console.log(
        `[GroupPlugin] Required fields: ${groupData.requiredProfileFields.join(', ')}`
      );
    }
  },

  /**
   * Called when user leaves group
   */
  onMemberLeave: async (membership: MembershipData, context: ContextData) => {
    console.log(`[GroupPlugin] User left group: ${context.name}`, {
      memberId: membership.id,
    });

    // Could remove from any custom roles
    // Could clean up pending moderation items
  },

  /**
   * Called when activity is created in group
   * Handles moderation and slow mode
   */
  onActivityCreate: async (activity: ActivityData, context: ContextData) => {
    const plugins = context.plugins;
    const groupData = plugins.group as GroupPluginData | undefined;

    if (!groupData) return;

    // Check slow mode
    if (groupData.moderation.slowModeSeconds > 0) {
      // In real implementation, would check last post time and enforce delay
      console.log(
        `[GroupPlugin] Slow mode active: ${groupData.moderation.slowModeSeconds}s`
      );
    }

    // Check if post needs approval
    if (groupData.moderation.requirePostApproval) {
      console.log(`[GroupPlugin] Post queued for approval`);
      // Would mark activity as pending review
    }

    // Run auto-moderation
    if (groupData.moderation.enableAutoMod) {
      const content = (activity.object as { content?: string })?.content || '';
      const hasBannedWord = groupData.moderation.bannedWords.some((word) =>
        content.toLowerCase().includes(word.toLowerCase())
      );

      if (hasBannedWord) {
        console.log(`[GroupPlugin] Auto-mod flagged post for banned word`);
        // Would flag or hide the post
      }
    }
  },

  /**
   * Validate group data before save
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateData: async (data: GroupPluginData, _context: ContextData) => {
    const errors: string[] = [];

    // Validate custom roles
    if (data.customRoles) {
      const roleNames = data.customRoles.map((r) => r.name.toLowerCase());
      if (new Set(roleNames).size !== roleNames.length) {
        errors.push('Custom role names must be unique');
      }

      // Check for reserved role names
      const reserved = ['owner', 'admin', 'moderator', 'member', 'guest'];
      for (const role of data.customRoles) {
        if (reserved.includes(role.name.toLowerCase())) {
          errors.push(`"${role.name}" is a reserved role name`);
        }
      }
    }

    // Validate slow mode
    if (data.moderation.slowModeSeconds < 0) {
      errors.push('Slow mode cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};

// =============================================================================
// Moderation Helper Functions
// =============================================================================

/**
 * Check if user can post (respects slow mode)
 */
export async function canUserPost(
  contextId: string,
  userId: string
): Promise<{ allowed: boolean; waitSeconds?: number }> {
  const context = await db.context.findUnique({
    where: { id: contextId },
    select: { plugins: true },
  });

  if (!context) {
    return { allowed: false };
  }

  const plugins = context.plugins as Record<string, unknown>;
  const groupData = plugins.group as GroupPluginData | undefined;

  if (!groupData || groupData.moderation.slowModeSeconds === 0) {
    return { allowed: true };
  }

  // Get user's membership
  const membership = await db.membership.findUnique({
    where: { contextId_userId: { contextId, userId } },
    select: { pluginData: true },
  });

  if (!membership) {
    return { allowed: false };
  }

  const memberData = (membership.pluginData as Record<string, unknown>)?.group as
    | { lastPostAt?: string }
    | undefined;

  if (!memberData?.lastPostAt) {
    return { allowed: true };
  }

  const lastPost = new Date(memberData.lastPostAt);
  const waitMs = groupData.moderation.slowModeSeconds * 1000;
  const nextAllowed = new Date(lastPost.getTime() + waitMs);
  const now = new Date();

  if (now >= nextAllowed) {
    return { allowed: true };
  }

  return {
    allowed: false,
    waitSeconds: Math.ceil((nextAllowed.getTime() - now.getTime()) / 1000),
  };
}

/**
 * Issue a warning to a member
 */
export async function issueMemberWarning(
  contextId: string,
  userId: string,
  reason: string
): Promise<number> {
  const membership = await db.membership.findUnique({
    where: { contextId_userId: { contextId, userId } },
    select: { id: true, pluginData: true },
  });

  if (!membership) {
    throw new Error('Member not found');
  }

  const currentData = (membership.pluginData as Record<string, unknown>) || {};
  const groupData = (currentData.group as { warningCount?: number }) || {};
  const newWarningCount = (groupData.warningCount || 0) + 1;

  await db.membership.update({
    where: { id: membership.id },
    data: {
      pluginData: {
        ...currentData,
        group: {
          ...groupData,
          warningCount: newWarningCount,
        },
      },
    },
  });

  console.log(`[GroupPlugin] Warning issued to user ${userId}: ${reason}`);
  return newWarningCount;
}
