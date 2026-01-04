/**
 * Direct Message Zod Schemas
 * Validation schemas for DM operations
 */

import { z } from 'zod';
import { cursorPaginationSchema, contentSchema } from './common.schema';

// =============================================================================
// Message Schemas
// =============================================================================

/**
 * Send a direct message
 */
export const sendMessageSchema = z.object({
  recipientId: z.string().cuid(),
  content: contentSchema,
  attachmentIds: z.array(z.string().cuid()).max(4).default([]),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

/**
 * Get conversation messages
 */
export const getConversationSchema = cursorPaginationSchema.extend({
  userId: z.string().cuid(), // The other participant
});

export type GetConversationInput = z.infer<typeof getConversationSchema>;

/**
 * List all conversations
 */
export const listConversationsSchema = cursorPaginationSchema;

export type ListConversationsInput = z.infer<typeof listConversationsSchema>;

/**
 * Mark messages as read
 */
export const markMessagesReadSchema = z.object({
  conversationUserId: z.string().cuid(), // Mark all messages from this user as read
});

export type MarkMessagesReadInput = z.infer<typeof markMessagesReadSchema>;

/**
 * Delete a message
 */
export const deleteMessageSchema = z.object({
  messageId: z.string().cuid(),
});

export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;

// =============================================================================
// Response Types (for type inference)
// =============================================================================

/**
 * Conversation preview (for list view)
 */
export const conversationPreviewSchema = z.object({
  participant: z.object({
    id: z.string(),
    username: z.string().nullable(),
    displayName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
  lastMessage: z.object({
    id: z.string(),
    content: z.string(),
    published: z.date(),
    isFromMe: z.boolean(),
  }).nullable(),
  unreadCount: z.number(),
});

export type ConversationPreview = z.infer<typeof conversationPreviewSchema>;

/**
 * Message in a conversation
 */
export const messageSchema = z.object({
  id: z.string(),
  content: z.string(),
  published: z.date(),
  updated: z.date(),
  isFromMe: z.boolean(),
  read: z.boolean(),
  sender: z.object({
    id: z.string(),
    username: z.string().nullable(),
    displayName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
  attachments: z.array(z.object({
    id: z.string(),
    type: z.string(),
    url: z.string(),
    thumbnailUrl: z.string().nullable(),
    alt: z.string().nullable(),
  })),
});

export type Message = z.infer<typeof messageSchema>;
