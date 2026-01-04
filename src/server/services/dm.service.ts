/**
 * Direct Message Service
 * Business logic for DM conversations using the Activity model
 *
 * DMs are implemented as Activities with:
 * - type: 'CREATE'
 * - objectType: 'NOTE'
 * - to: ['user:{recipientId}'] (private addressing)
 */

import { db } from '@/server/db';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import type { SendMessageInput } from '@/schemas/dm.schema';

// =============================================================================
// Types
// =============================================================================

export interface ConversationPreview {
  participant: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
  lastMessage: {
    id: string;
    content: string;
    published: Date;
    isFromMe: boolean;
  } | null;
  unreadCount: number;
}

export interface ConversationMessage {
  id: string;
  content: string;
  published: Date;
  updated: Date;
  isFromMe: boolean;
  read: boolean;
  sender: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
  attachments: {
    id: string;
    type: string;
    url: string;
    thumbnailUrl: string | null;
    alt: string | null;
  }[];
}

export interface ConversationResult {
  messages: ConversationMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ConversationsResult {
  conversations: ConversationPreview[];
  nextCursor: string | null;
  hasMore: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Extract content from activity object
 */
function getMessageContent(object: Prisma.JsonValue): string {
  if (object && typeof object === 'object' && 'content' in object) {
    return (object as { content: string }).content || '';
  }
  return '';
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * Send a direct message to another user
 */
export async function sendMessage(
  senderId: string,
  input: SendMessageInput
): Promise<{ id: string }> {
  const { recipientId, content, attachmentIds } = input;

  // Validate recipient exists
  const recipient = await db.user.findUnique({
    where: { id: recipientId },
    select: { id: true },
  });

  if (!recipient) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: '받는 사람을 찾을 수 없습니다',
    });
  }

  // Cannot send DM to yourself
  if (senderId === recipientId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: '자신에게 메시지를 보낼 수 없습니다',
    });
  }

  // Create the DM activity
  const activity = await db.activity.create({
    data: {
      type: 'CREATE',
      actorId: senderId,
      actorType: 'USER',
      objectType: 'NOTE',
      object: { content },
      to: [`user:${recipientId}`], // Only visible to recipient
      cc: [], // No CC for DMs
      attachments: attachmentIds.length > 0
        ? { connect: attachmentIds.map((id) => ({ id })) }
        : undefined,
    },
    select: { id: true },
  });

  // Create inbox item for recipient
  await db.inboxItem.create({
    data: {
      userId: recipientId,
      activityId: activity.id,
      category: 'DM',
      read: false,
    },
  });

  return { id: activity.id };
}

/**
 * Get messages in a conversation with another user
 */
export async function getConversation(
  currentUserId: string,
  otherUserId: string,
  options: { cursor?: string; limit: number }
): Promise<ConversationResult> {
  const { cursor, limit } = options;

  // Verify other user exists
  const otherUser = await db.user.findUnique({
    where: { id: otherUserId },
    select: { id: true },
  });

  if (!otherUser) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: '사용자를 찾을 수 없습니다',
    });
  }

  // Find all DMs between these two users
  const activities = await db.activity.findMany({
    where: {
      deleted: false,
      type: 'CREATE',
      objectType: 'NOTE',
      OR: [
        // Messages from current user to other user
        {
          actorId: currentUserId,
          to: { has: `user:${otherUserId}` },
        },
        // Messages from other user to current user
        {
          actorId: otherUserId,
          to: { has: `user:${currentUserId}` },
        },
      ],
      ...(cursor && { published: { lt: new Date(cursor) } }),
    },
    include: {
      actor: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      attachments: {
        select: {
          id: true,
          type: true,
          url: true,
          thumbnailUrl: true,
          alt: true,
        },
      },
      inboxItems: {
        where: { userId: currentUserId },
        select: { read: true },
      },
    },
    orderBy: { published: 'desc' },
    take: limit + 1,
  });

  const hasMore = activities.length > limit;
  const items = hasMore ? activities.slice(0, -1) : activities;

  const messages: ConversationMessage[] = items.map((activity) => ({
    id: activity.id,
    content: getMessageContent(activity.object),
    published: activity.published,
    updated: activity.updated,
    isFromMe: activity.actorId === currentUserId,
    read: activity.actorId === currentUserId
      ? true // Own messages are always "read"
      : activity.inboxItems[0]?.read ?? false,
    sender: activity.actor,
    attachments: activity.attachments.map((a) => ({
      id: a.id,
      type: a.type,
      url: a.url,
      thumbnailUrl: a.thumbnailUrl,
      alt: a.alt,
    })),
  }));

  return {
    messages,
    nextCursor: hasMore && items.length > 0
      ? items[items.length - 1].published.toISOString()
      : null,
    hasMore,
  };
}

/**
 * List all conversations for a user
 * Returns unique conversations with last message and unread count
 */
export async function listConversations(
  userId: string,
  options: { cursor?: string; limit: number }
): Promise<ConversationsResult> {
  const { limit } = options;

  // Find all DM activities involving this user
  // This is a complex query - we need to group by conversation partner
  const dmActivities = await db.activity.findMany({
    where: {
      deleted: false,
      type: 'CREATE',
      objectType: 'NOTE',
      OR: [
        // Sent by user (to a single user address)
        {
          actorId: userId,
          to: { isEmpty: false },
        },
        // Received by user
        {
          to: { has: `user:${userId}` },
        },
      ],
      // Filter out public and followers-addressed posts
      NOT: [
        { to: { has: 'public' } },
        { to: { has: 'followers' } },
      ],
    },
    include: {
      actor: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      inboxItems: {
        where: { userId },
        select: { read: true },
      },
    },
    orderBy: { published: 'desc' },
  });

  // Group by conversation partner
  const conversationMap = new Map<string, {
    participant: ConversationPreview['participant'];
    lastMessage: ConversationPreview['lastMessage'];
    unreadCount: number;
    lastMessageTime: Date;
  }>();

  for (const activity of dmActivities) {
    // Determine the conversation partner
    let partnerId: string | null = null;

    if (activity.actorId === userId) {
      // I sent this - find the recipient from 'to' field
      const recipientAddress = activity.to.find((addr) =>
        addr.startsWith('user:') && addr !== `user:${userId}`
      );
      if (recipientAddress) {
        partnerId = recipientAddress.replace('user:', '');
      }
    } else {
      // Someone sent this to me
      partnerId = activity.actorId;
    }

    if (!partnerId) continue;

    // Check if we already have this conversation
    const existing = conversationMap.get(partnerId);

    if (!existing) {
      // Need to fetch partner info if not the actor
      let participant: ConversationPreview['participant'];

      if (activity.actorId === partnerId) {
        participant = activity.actor;
      } else {
        // Need to fetch recipient info
        const partnerUser = await db.user.findUnique({
          where: { id: partnerId },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        });

        if (!partnerUser) continue;
        participant = partnerUser;
      }

      conversationMap.set(partnerId, {
        participant,
        lastMessage: {
          id: activity.id,
          content: getMessageContent(activity.object),
          published: activity.published,
          isFromMe: activity.actorId === userId,
        },
        unreadCount: activity.actorId !== userId && !activity.inboxItems[0]?.read ? 1 : 0,
        lastMessageTime: activity.published,
      });
    } else {
      // Update unread count
      if (activity.actorId !== userId && !activity.inboxItems[0]?.read) {
        existing.unreadCount++;
      }
    }
  }

  // Convert to array and sort by last message time
  const conversations = Array.from(conversationMap.values())
    .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime())
    .slice(0, limit)
    .map(({ participant, lastMessage, unreadCount }) => ({
      participant,
      lastMessage,
      unreadCount,
    }));

  return {
    conversations,
    nextCursor: null, // TODO: Implement cursor pagination for conversations
    hasMore: conversationMap.size > limit,
  };
}

/**
 * Mark all messages from a user as read
 */
export async function markConversationRead(
  userId: string,
  otherUserId: string
): Promise<{ count: number }> {
  // Find all unread inbox items for DMs from the other user
  const result = await db.inboxItem.updateMany({
    where: {
      userId,
      read: false,
      category: 'DM',
      activity: {
        actorId: otherUserId,
        to: { has: `user:${userId}` },
      },
    },
    data: { read: true },
  });

  return { count: result.count };
}

/**
 * Get unread DM count for a user
 */
export async function getUnreadDMCount(userId: string): Promise<number> {
  const count = await db.inboxItem.count({
    where: {
      userId,
      read: false,
      category: 'DM',
    },
  });

  return count;
}

/**
 * Delete a DM (soft delete)
 */
export async function deleteMessage(
  userId: string,
  messageId: string
): Promise<void> {
  // Find the activity
  const activity = await db.activity.findUnique({
    where: { id: messageId },
    select: { actorId: true, deleted: true },
  });

  if (!activity) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: '메시지를 찾을 수 없습니다',
    });
  }

  if (activity.deleted) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: '이미 삭제된 메시지입니다',
    });
  }

  // Only the sender can delete
  if (activity.actorId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: '자신이 보낸 메시지만 삭제할 수 있습니다',
    });
  }

  // Soft delete
  await db.activity.update({
    where: { id: messageId },
    data: {
      deleted: true,
      deletedAt: new Date(),
    },
  });
}

/**
 * Check if a user can message another user
 * (For future: could check blocks, follow requirements, etc.)
 */
export async function canMessageUser(
  senderId: string,
  recipientId: string
): Promise<boolean> {
  // For now, anyone can message anyone
  // Future: check blocks, privacy settings, etc.

  const recipient = await db.user.findUnique({
    where: { id: recipientId },
    select: { id: true },
  });

  return !!recipient && senderId !== recipientId;
}
