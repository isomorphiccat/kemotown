/**
 * Membership Zod Schemas
 * Validation schemas for membership operations in contexts
 */

import { z } from 'zod';
import { cursorPaginationSchema } from './common.schema';

// =============================================================================
// Enums (matching Prisma enums)
// =============================================================================

export const memberRoleSchema = z.enum(['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER', 'GUEST']);
export const memberStatusSchema = z.enum(['PENDING', 'APPROVED', 'BANNED', 'LEFT']);

// =============================================================================
// Query Schemas
// =============================================================================

export const getMembershipSchema = z.object({
  contextId: z.string().cuid(),
  userId: z.string().cuid(),
});

export const listMembershipsSchema = cursorPaginationSchema.extend({
  contextId: z.string().cuid(),
  status: memberStatusSchema.optional(),
  role: memberRoleSchema.optional(),
  search: z.string().max(100).optional(),
});

export type ListMembershipsInput = z.infer<typeof listMembershipsSchema>;

export const getUserMembershipsSchema = cursorPaginationSchema.extend({
  status: memberStatusSchema.optional(),
});

// =============================================================================
// Role Management
// =============================================================================

export const updateRoleSchema = z.object({
  contextId: z.string().cuid(),
  userId: z.string().cuid(),
  role: memberRoleSchema.refine((role) => role !== 'OWNER', {
    message: 'Cannot assign OWNER role. Use transfer ownership instead.',
  }),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

// =============================================================================
// Approval/Ban Actions
// =============================================================================

export const approveRejectSchema = z.object({
  contextId: z.string().cuid(),
  userId: z.string().cuid(),
});

export const banUnbanSchema = z.object({
  contextId: z.string().cuid(),
  userId: z.string().cuid(),
});

// =============================================================================
// Plugin Data
// =============================================================================

export const updateMemberPluginDataSchema = z.object({
  contextId: z.string().cuid(),
  userId: z.string().cuid().optional(), // If not provided, updates own membership
  pluginId: z.string().min(1),
  data: z.record(z.unknown()),
});

export type UpdateMemberPluginDataInput = z.infer<typeof updateMemberPluginDataSchema>;

// =============================================================================
// Notification Preferences
// =============================================================================

export const updateNotificationsSchema = z.object({
  contextId: z.string().cuid(),
  notifyPosts: z.boolean().optional(),
  notifyMentions: z.boolean().optional(),
  notifyEvents: z.boolean().optional(),
});

export type UpdateNotificationsInput = z.infer<typeof updateNotificationsSchema>;

// =============================================================================
// Type Exports
// =============================================================================

export type MemberRole = z.infer<typeof memberRoleSchema>;
export type MemberStatus = z.infer<typeof memberStatusSchema>;
