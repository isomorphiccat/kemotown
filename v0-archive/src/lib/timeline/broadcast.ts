/**
 * Timeline broadcast utilities for real-time updates
 */

// Store active connections with metadata
export interface ClientConnection {
  controller: ReadableStreamDefaultController;
  connectedAt: number;
  userEmail: string;
}

export const clients = new Map<string, ClientConnection>();

// Cleanup old connections (older than 24 hours)
export function cleanupOldConnections() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [clientId, connection] of clients.entries()) {
    if (now - connection.connectedAt > maxAge) {
      try {
        connection.controller.close();
      } catch {
        // Already closed
      }
      clients.delete(clientId);
    }
  }
}

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
  for (const [clientId, connection] of clients.entries()) {
    try {
      connection.controller.enqueue(message);
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
  for (const [clientId, connection] of clients.entries()) {
    try {
      connection.controller.enqueue(message);
    } catch {
      // Remove disconnected clients
      clients.delete(clientId);
    }
  }
}