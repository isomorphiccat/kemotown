/**
 * Inbox Router
 * tRPC endpoints for notifications and inbox management
 */

import { createTRPCRouter, protectedProcedure } from '../../trpc';
import {
  listInboxSchema,
  markReadSchema,
  markAllReadSchema,
  deleteNotificationSchema,
} from '@/schemas/inbox.schema';
import {
  listNotifications,
  markItemsRead,
  markAllRead,
  getUnreadCounts,
  deleteNotification,
} from '../../services/inbox.service';

export const inboxRouter = createTRPCRouter({
  /**
   * List notifications with filtering and pagination
   */
  list: protectedProcedure.input(listInboxSchema).query(async ({ ctx, input }) => {
    return listNotifications(ctx.session.user.id, {
      category: input.category,
      unreadOnly: input.unreadOnly,
      cursor: input.cursor,
      limit: input.limit,
    });
  }),

  /**
   * Get unread notification counts by category
   */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadCounts(ctx.session.user.id);
  }),

  /**
   * Mark specific notifications as read
   */
  markRead: protectedProcedure
    .input(markReadSchema)
    .mutation(async ({ ctx, input }) => {
      const count = await markItemsRead(ctx.session.user.id, input.ids);
      return { markedCount: count };
    }),

  /**
   * Mark all notifications as read (optionally by category)
   */
  markAllRead: protectedProcedure
    .input(markAllReadSchema)
    .mutation(async ({ ctx, input }) => {
      const count = await markAllRead(ctx.session.user.id, input?.category);
      return { markedCount: count };
    }),

  /**
   * Delete (mute) a notification
   */
  delete: protectedProcedure
    .input(deleteNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      const success = await deleteNotification(ctx.session.user.id, input.id);
      return { success };
    }),
});
