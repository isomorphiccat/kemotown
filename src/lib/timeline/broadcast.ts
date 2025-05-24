/**
 * Timeline broadcast utilities for real-time updates
 */

// Store active connections
export const clients = new Map<string, ReadableStreamDefaultController>();

export interface TimelinePostBroadcast {
  id: string;
  content: string;
  channelType: string;
  isBot: boolean;
  botType?: string;
  createdAt: string;
  user?: {
    id: string;
    username: string | null;
    furryName: string | null;
    profilePictureUrl: string | null;
  } | null;
  botUser?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  event?: {
    id: string;
    title: string;
  } | null;
  reactions: Array<{
    id: string;
    emoji: string;
    userId: string;
  }>;
  reactionCount: number;
  mentions: Array<{
    id: string;
    username: string | null;
  }>;
}

export interface ReactionBroadcast {
  userId: string;
  emoji: string;
}

/**
 * Broadcast a new post to all connected clients
 */
export function broadcastPost(post: TimelinePostBroadcast, channelType: 'global' | string) {
  const encoder = new TextEncoder();
  const data = JSON.stringify({
    type: 'new_post',
    channelType,
    post
  });
  
  const message = encoder.encode(`data: ${data}\n\n`);
  
  // Send to all connected clients
  for (const [clientId, controller] of clients.entries()) {
    try {
      controller.enqueue(message);
    } catch {
      // Remove disconnected clients
      clients.delete(clientId);
    }
  }
}

/**
 * Broadcast a reaction update to all connected clients
 */
export function broadcastReaction(postId: string, reaction: ReactionBroadcast, action: 'add' | 'remove') {
  const encoder = new TextEncoder();
  const data = JSON.stringify({
    type: 'reaction_update',
    postId,
    reaction,
    action
  });
  
  const message = encoder.encode(`data: ${data}\n\n`);
  
  // Send to all connected clients
  for (const [clientId, controller] of clients.entries()) {
    try {
      controller.enqueue(message);
    } catch {
      // Remove disconnected clients
      clients.delete(clientId);
    }
  }
}