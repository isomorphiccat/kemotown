/**
 * Group Plugin
 * Extends Context with community group functionality:
 * - Community types (interest, regional, species)
 * - Moderation settings
 * - Custom roles
 * - Slow mode and auto-moderation
 */

import type { Plugin } from '../types';
import { groupDataSchema, defaultGroupData, type GroupPluginData } from './schema';
import { groupHooks } from './hooks';
import { db } from '@/server/db';
import { GroupSidebar } from './components/GroupSidebar';
import { GroupCard } from './components/GroupCard';

/**
 * Group Plugin Definition
 */
export const groupPlugin: Plugin<GroupPluginData> = {
  id: 'group',
  name: 'Group',
  description: 'Community groups with moderation, custom roles, and posting rules',
  version: '1.0.0',

  // Compatible with GROUP context type
  contextTypes: ['GROUP'],

  // Data validation
  dataSchema: groupDataSchema,
  defaultData: defaultGroupData,

  // Custom activity types
  activityTypes: [
    {
      type: 'ANNOUNCEMENT',
      label: 'Announcement',
      icon: 'megaphone',
      description: 'Important group announcement',
    },
    {
      type: 'POLL',
      label: 'Poll',
      icon: 'bar-chart-2',
      description: 'Group poll or vote',
    },
    {
      type: 'INTRODUCTION',
      label: 'Introduction',
      icon: 'user-plus',
      description: 'New member introduction',
    },
  ],

  // Custom address patterns
  addressPatterns: [
    {
      pattern: 'context:{id}:staff',
      label: 'Group Staff',
      resolver: async (contextId: string, userId: string) => {
        const membership = await db.membership.findUnique({
          where: { contextId_userId: { contextId, userId } },
          select: { role: true, status: true },
        });
        return (
          membership?.status === 'APPROVED' &&
          ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)
        );
      },
    },
    {
      pattern: 'context:{id}:active',
      label: 'Active Members',
      resolver: async (contextId: string, userId: string) => {
        const membership = await db.membership.findUnique({
          where: { contextId_userId: { contextId, userId } },
          select: { status: true, pluginData: true },
        });
        if (membership?.status !== 'APPROVED') return false;

        // Check if member has been active recently (posted in last 30 days)
        const memberData = (membership.pluginData as Record<string, unknown>)?.group as
          | { lastPostAt?: string }
          | undefined;
        if (!memberData?.lastPostAt) return false;

        const lastPost = new Date(memberData.lastPostAt);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return lastPost >= thirtyDaysAgo;
      },
    },
  ],

  // Lifecycle hooks
  hooks: groupHooks,

  // UI Components
  components: {
    ContextSidebar: GroupSidebar,
    ContextCard: GroupCard,
  },

  // Permission definitions
  permissions: [
    {
      id: 'post_announcement',
      name: 'Post Announcements',
      description: 'Create announcements that notify all members',
      defaultRoles: ['OWNER', 'ADMIN'],
    },
    {
      id: 'create_poll',
      name: 'Create Polls',
      description: 'Create polls for group voting',
      defaultRoles: ['OWNER', 'ADMIN', 'MODERATOR'],
    },
    {
      id: 'moderate_posts',
      name: 'Moderate Posts',
      description: 'Approve, reject, or remove member posts',
      defaultRoles: ['OWNER', 'ADMIN', 'MODERATOR'],
    },
    {
      id: 'manage_roles',
      name: 'Manage Custom Roles',
      description: 'Create and assign custom roles to members',
      defaultRoles: ['OWNER', 'ADMIN'],
    },
    {
      id: 'issue_warnings',
      name: 'Issue Warnings',
      description: 'Give warnings to members for rule violations',
      defaultRoles: ['OWNER', 'ADMIN', 'MODERATOR'],
    },
    {
      id: 'mute_members',
      name: 'Mute Members',
      description: 'Temporarily prevent members from posting',
      defaultRoles: ['OWNER', 'ADMIN', 'MODERATOR'],
    },
    {
      id: 'view_mod_logs',
      name: 'View Moderation Logs',
      description: 'Access logs of moderation actions',
      defaultRoles: ['OWNER', 'ADMIN'],
    },
  ],

  // Membership field extensions
  membershipFields: [
    {
      field: 'customRole',
      label: 'Custom Role',
      type: 'string',
    },
    {
      field: 'mutedUntil',
      label: 'Muted Until',
      type: 'date',
    },
    {
      field: 'warningCount',
      label: 'Warning Count',
      type: 'number',
      defaultValue: 0,
    },
    {
      field: 'lastPostAt',
      label: 'Last Post Time',
      type: 'date',
    },
    {
      field: 'introductionPosted',
      label: 'Introduction Posted',
      type: 'boolean',
      defaultValue: false,
    },
  ],
};

// Re-export types
export type { GroupPluginData, GroupType, ModerationSettings } from './schema';
export { groupDataSchema, defaultGroupData } from './schema';
export { groupHooks, canUserPost, issueMemberWarning } from './hooks';

// Re-export components
export * from './components';
