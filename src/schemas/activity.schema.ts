/**
 * Activity Zod Schemas
 * Validation schemas for ActivityPub-style activities
 */

import { z } from 'zod';
import { cursorPaginationSchema, contentSchema } from './common.schema';

// =============================================================================
// Enums (matching Prisma enums)
// =============================================================================

export const activityTypeSchema = z.enum([
  'CREATE',
  'UPDATE',
  'DELETE',
  'LIKE',
  'ANNOUNCE',
  'FOLLOW',
  'ACCEPT',
  'REJECT',
  'UNDO',
]);

export const actorTypeSchema = z.enum(['USER', 'BOT', 'SYSTEM']);

export const objectTypeSchema = z.enum(['NOTE', 'IMAGE', 'EVENT', 'USER', 'ACTIVITY']);

export const inboxCategorySchema = z.enum([
  'DEFAULT',
  'MENTION',
  'DM',
  'FOLLOW',
  'LIKE',
  'REPOST',
  'REPLY',
  'EVENT',
]);

export const followStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'REJECTED']);

export const attachmentTypeSchema = z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT']);

// =============================================================================
// Addressing Schemas
// =============================================================================

/**
 * Address pattern schema
 * Valid patterns:
 * - "public" - publicly visible
 * - "followers" - visible to actor's followers
 * - "user:{id}" - visible to specific user
 * - "context:{id}" - visible to all members of a context
 * - "context:{id}:admins" - visible to context admins only
 * - "context:{id}:moderators" - visible to moderators+
 * - "context:{id}:role:{role}" - visible to specific role
 *
 * Legacy patterns (for backward compatibility):
 * - "event:{id}" - treated as context:{id}
 */
export const addressSchema = z.string().refine(
  (val) => {
    // Special addresses
    if (val === 'public' || val === 'followers') return true;
    // User address: user:{id}
    if (val.startsWith('user:')) return val.length > 5;
    // Context address: context:{id} or context:{id}:{modifier}
    if (val.startsWith('context:')) return val.length > 8;
    // Legacy event address (for backward compatibility)
    if (val.startsWith('event:')) return val.length > 6;
    return false;
  },
  {
    message:
      'Invalid address format. Use: public, followers, user:{id}, or context:{id}[:modifier]',
  }
);

/**
 * Addressing schema (to and cc arrays)
 */
export const addressingSchema = z.object({
  to: z.array(addressSchema).min(1, '최소 하나의 수신자가 필요합니다'),
  cc: z.array(addressSchema).default([]),
});

// =============================================================================
// Object Schemas (embedded in Activity.object)
// =============================================================================

/**
 * Note object schema (for posts, comments, DMs)
 */
export const noteObjectSchema = z.object({
  content: contentSchema,
  summary: z.string().max(200).optional(), // Content warning
  sensitive: z.boolean().default(false),
});

/**
 * Image object schema
 */
export const imageObjectSchema = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  alt: z.string().max(500).optional(),
  blurhash: z.string().optional(),
});

// =============================================================================
// Activity Input Schemas
// =============================================================================

/**
 * Create a Note activity (post, comment, DM)
 */
export const createNoteActivitySchema = z.object({
  content: contentSchema,
  summary: z.string().max(200).optional(),
  sensitive: z.boolean().default(false),
  to: z.array(addressSchema).min(1),
  cc: z.array(addressSchema).default([]),
  inReplyTo: z.string().cuid().optional(),
  attachmentIds: z.array(z.string().cuid()).max(4).default([]),
  /** Optional context (group/event/convention) this activity belongs to */
  contextId: z.string().cuid().optional(),
});

export type CreateNoteActivityInput = z.infer<typeof createNoteActivitySchema>;

/**
 * Create a Like activity (reaction)
 */
export const createLikeActivitySchema = z.object({
  targetActivityId: z.string().cuid(),
});

export type CreateLikeActivityInput = z.infer<typeof createLikeActivitySchema>;

/**
 * Create an Announce activity (repost)
 */
export const createAnnounceActivitySchema = z.object({
  targetActivityId: z.string().cuid(),
  to: z.array(addressSchema).default(['public']),
  cc: z.array(addressSchema).default(['followers']),
});

export type CreateAnnounceActivityInput = z.infer<typeof createAnnounceActivitySchema>;

/**
 * Create a Follow activity
 */
export const createFollowActivitySchema = z.object({
  targetUserId: z.string().cuid(),
});

export type CreateFollowActivityInput = z.infer<typeof createFollowActivitySchema>;

/**
 * Update activity (edit a post)
 */
export const updateActivitySchema = z.object({
  activityId: z.string().cuid(),
  content: contentSchema.optional(),
  summary: z.string().max(200).optional(),
  sensitive: z.boolean().optional(),
});

export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

/**
 * Delete activity
 */
export const deleteActivitySchema = z.object({
  activityId: z.string().cuid(),
});

export type DeleteActivityInput = z.infer<typeof deleteActivitySchema>;

// =============================================================================
// Query Schemas
// =============================================================================

/**
 * Get activity by ID
 */
export const getActivitySchema = z.object({
  activityId: z.string().cuid(),
});

/**
 * Get activities (timeline query)
 */
export const getActivitiesSchema = cursorPaginationSchema.extend({
  type: activityTypeSchema.optional(),
  actorId: z.string().cuid().optional(),
  objectType: objectTypeSchema.optional(),
});

/**
 * Public timeline query
 */
export const publicTimelineSchema = cursorPaginationSchema.extend({
  includeReplies: z.boolean().default(false),
});

/**
 * Home timeline query (following + own posts)
 */
export const homeTimelineSchema = cursorPaginationSchema.extend({
  includeReplies: z.boolean().default(false),
});

/**
 * Event timeline query (legacy - use contextTimelineSchema)
 */
export const eventTimelineSchema = cursorPaginationSchema.extend({
  eventId: z.string().cuid(),
  includeReplies: z.boolean().default(true),
});

/**
 * Context timeline query (for groups, events, conventions)
 */
export const contextTimelineSchema = cursorPaginationSchema.extend({
  contextId: z.string().cuid(),
  includeReplies: z.boolean().default(true),
});

/**
 * User timeline query (user's posts)
 */
export const userTimelineSchema = cursorPaginationSchema.extend({
  userId: z.string().cuid(),
  includeReplies: z.boolean().default(false),
  includeReposts: z.boolean().default(true),
});

/**
 * Replies to an activity
 */
export const getRepliesSchema = cursorPaginationSchema.extend({
  activityId: z.string().cuid(),
});

/**
 * Likes on an activity
 */
export const getLikesSchema = cursorPaginationSchema.extend({
  activityId: z.string().cuid(),
});

/**
 * Reposts of an activity
 */
export const getRepostsSchema = cursorPaginationSchema.extend({
  activityId: z.string().cuid(),
});

// =============================================================================
// Inbox Schemas
// =============================================================================

/**
 * Get inbox items
 */
export const getInboxSchema = cursorPaginationSchema.extend({
  category: inboxCategorySchema.optional(),
  unreadOnly: z.boolean().default(false),
});

/**
 * Mark inbox items as read
 */
export const markReadSchema = z.object({
  itemIds: z.array(z.string().cuid()).min(1),
});

/**
 * Mark all inbox items as read
 */
export const markAllReadSchema = z.object({
  category: inboxCategorySchema.optional(),
});

// =============================================================================
// Follow Schemas
// =============================================================================

/**
 * Follow/unfollow user
 */
export const followUserSchema = z.object({
  userId: z.string().cuid(),
});

/**
 * Respond to follow request
 */
export const respondFollowSchema = z.object({
  followerId: z.string().cuid(),
  action: z.enum(['accept', 'reject']),
});

/**
 * Get followers/following list
 */
export const getFollowListSchema = cursorPaginationSchema.extend({
  userId: z.string().cuid(),
});

// =============================================================================
// DM (Direct Message) Schemas
// =============================================================================

/**
 * Send a DM
 */
export const sendDmSchema = z.object({
  recipientId: z.string().cuid(),
  content: contentSchema,
  attachmentIds: z.array(z.string().cuid()).max(4).default([]),
});

export type SendDmInput = z.infer<typeof sendDmSchema>;

/**
 * Get DM conversation
 */
export const getDmConversationSchema = cursorPaginationSchema.extend({
  userId: z.string().cuid(),
});

/**
 * List DM conversations
 */
export const listDmConversationsSchema = cursorPaginationSchema;

// =============================================================================
// Type Exports
// =============================================================================

export type ActivityType = z.infer<typeof activityTypeSchema>;
export type ActorType = z.infer<typeof actorTypeSchema>;
export type ObjectType = z.infer<typeof objectTypeSchema>;
export type InboxCategory = z.infer<typeof inboxCategorySchema>;
export type FollowStatus = z.infer<typeof followStatusSchema>;
export type AttachmentType = z.infer<typeof attachmentTypeSchema>;
export type Address = z.infer<typeof addressSchema>;
