/**
 * Legacy Timeline Schemas
 *
 * NOTE: Timeline posts and reactions have been migrated to the ActivityPub-style
 * Activity system. See activity.schema.ts for the new schemas.
 *
 * This file now only contains:
 * - Comment schemas (for event comments)
 * - Notification schemas
 * - Bot post schema (for internal use)
 *
 * These may be migrated to their own files in the future.
 */

import { z } from 'zod';
import { contentSchema, cursorPaginationSchema } from './common.schema';

/**
 * Comment schemas (for event comments)
 */
export const createCommentSchema = z.object({
  eventId: z.string().cuid(),
  content: contentSchema,
  parentId: z.string().cuid().optional(), // For replies
});

export const updateCommentSchema = z.object({
  commentId: z.string().cuid(),
  content: contentSchema,
});

export const deleteCommentSchema = z.object({
  commentId: z.string().cuid(),
});

export const getCommentsSchema = cursorPaginationSchema.extend({
  eventId: z.string().cuid(),
  parentId: z.string().cuid().optional(), // For getting replies
});

/**
 * Notification schemas
 */
export const getNotificationsSchema = cursorPaginationSchema.extend({
  unreadOnly: z.boolean().default(false),
});

export const markNotificationReadSchema = z.object({
  notificationId: z.string().cuid(),
});

export const markAllNotificationsReadSchema = z.object({
  before: z.coerce.date().optional(), // Mark all before this date as read
});

/**
 * Bot post schema (internal use)
 * Note: Bot posts may be migrated to Activity model in the future
 */
export const botPostSchema = z.object({
  content: z.string().min(1).max(1000),
  botType: z.enum(['SYSTEM', 'WELCOME', 'EVENT_NOTIFY', 'EVENT_MOD']),
  eventId: z.string().cuid().optional(),
});
