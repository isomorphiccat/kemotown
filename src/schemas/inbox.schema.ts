/**
 * Inbox Validation Schemas
 * Zod schemas for inbox and notification operations
 */

import { z } from 'zod';
import type { InboxCategory } from '@prisma/client';

// =============================================================================
// Constants
// =============================================================================

/**
 * Valid inbox categories for filtering (using string literals to avoid Prisma enum loading issues)
 */
export const NOTIFICATION_CATEGORIES = [
  'DEFAULT',
  'FOLLOW',
  'MENTION',
  'LIKE',
  'REPOST',
  'REPLY',
  'EVENT',
] as const satisfies readonly InboxCategory[];

/**
 * Categories considered as "notifications" (not DMs)
 */
export const NON_DM_CATEGORIES: InboxCategory[] = [
  'DEFAULT',
  'FOLLOW',
  'MENTION',
  'LIKE',
  'REPOST',
  'REPLY',
  'EVENT',
];

// =============================================================================
// List Inbox Items Schema
// =============================================================================

/**
 * Schema for listing inbox items with filtering
 */
export const listInboxSchema = z.object({
  category: z
    .enum(['all', 'mentions', 'likes', 'follows', 'reposts', 'replies'])
    .optional()
    .default('all'),
  unreadOnly: z.boolean().optional().default(false),
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(50).optional().default(20),
});

// =============================================================================
// Mark Read Schema
// =============================================================================

/**
 * Schema for marking inbox items as read
 */
export const markReadSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(100),
});

/**
 * Schema for marking all items as read
 */
export const markAllReadSchema = z.object({
  category: z
    .enum(['all', 'mentions', 'likes', 'follows', 'reposts', 'replies'])
    .optional(),
});

// =============================================================================
// Get Unread Count Schema
// =============================================================================

/**
 * Schema for getting unread counts (no input needed)
 */
export const getUnreadCountSchema = z.object({}).optional();

// =============================================================================
// Delete Notification Schema
// =============================================================================

/**
 * Schema for deleting a notification
 */
export const deleteNotificationSchema = z.object({
  id: z.string().cuid('Invalid notification ID'),
});

// =============================================================================
// Notification Preferences Schema
// =============================================================================

/**
 * Schema for notification preferences
 */
export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  // Category-specific preferences
  followNotifications: z.boolean().optional(),
  mentionNotifications: z.boolean().optional(),
  likeNotifications: z.boolean().optional(),
  repostNotifications: z.boolean().optional(),
  replyNotifications: z.boolean().optional(),
  dmNotifications: z.boolean().optional(),
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Map filter category to InboxCategory enum values
 * Uses string literals to avoid Prisma enum loading issues in Next.js RSC
 */
export function getCategoryFilter(
  category: 'all' | 'mentions' | 'likes' | 'follows' | 'reposts' | 'replies'
): InboxCategory[] {
  switch (category) {
    case 'mentions':
      return ['MENTION'];
    case 'likes':
      return ['LIKE'];
    case 'follows':
      return ['FOLLOW'];
    case 'reposts':
      return ['REPOST'];
    case 'replies':
      return ['REPLY'];
    case 'all':
    default:
      // Return all notification categories (exclude DM)
      return NON_DM_CATEGORIES;
  }
}

// =============================================================================
// Type Exports
// =============================================================================

export type ListInboxInput = z.infer<typeof listInboxSchema>;
export type MarkReadInput = z.infer<typeof markReadSchema>;
export type MarkAllReadInput = z.infer<typeof markAllReadSchema>;
export type DeleteNotificationInput = z.infer<typeof deleteNotificationSchema>;
export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;
