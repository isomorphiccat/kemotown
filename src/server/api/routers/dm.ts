/**
 * Direct Message tRPC Router
 * Handles DM conversations using the Activity model
 */

import { z } from 'zod';
import {
  createTRPCRouter,
  protectedProcedure,
} from '@/server/trpc';
import {
  sendMessageSchema,
  getConversationSchema,
  listConversationsSchema,
  markMessagesReadSchema,
  deleteMessageSchema,
} from '@/schemas/dm.schema';
import {
  sendMessage,
  getConversation,
  listConversations,
  markConversationRead,
  getUnreadDMCount,
  deleteMessage,
  canMessageUser,
} from '@/server/services/dm.service';

export const dmRouter = createTRPCRouter({
  /**
   * Send a direct message to another user
   */
  send: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await sendMessage(ctx.session.user.id, input);
      return result;
    }),

  /**
   * Get messages in a conversation with another user
   */
  getConversation: protectedProcedure
    .input(getConversationSchema)
    .query(async ({ ctx, input }) => {
      const result = await getConversation(
        ctx.session.user.id,
        input.userId,
        { cursor: input.cursor, limit: input.limit }
      );
      return result;
    }),

  /**
   * List all conversations for the current user
   */
  listConversations: protectedProcedure
    .input(listConversationsSchema)
    .query(async ({ ctx, input }) => {
      const result = await listConversations(ctx.session.user.id, {
        cursor: input.cursor,
        limit: input.limit,
      });
      return result;
    }),

  /**
   * Mark all messages in a conversation as read
   */
  markRead: protectedProcedure
    .input(markMessagesReadSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await markConversationRead(
        ctx.session.user.id,
        input.conversationUserId
      );
      return result;
    }),

  /**
   * Get unread DM count for current user
   */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await getUnreadDMCount(ctx.session.user.id);
    return { count };
  }),

  /**
   * Delete a message (only sender can delete)
   */
  delete: protectedProcedure
    .input(deleteMessageSchema)
    .mutation(async ({ ctx, input }) => {
      await deleteMessage(ctx.session.user.id, input.messageId);
      return { success: true };
    }),

  /**
   * Check if the current user can message another user
   */
  canMessage: protectedProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const canSend = await canMessageUser(ctx.session.user.id, input.userId);
      return { canMessage: canSend };
    }),
});
