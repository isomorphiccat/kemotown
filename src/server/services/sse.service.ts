/**
 * Server-Sent Events Service (v2)
 * Manages SSE connections and broadcasts using Activity model
 */

import { db } from '@/server/db';

// Connection management
const connections = new Map<string, Set<ReadableStreamDefaultController>>();
export const MAX_CONNECTIONS_PER_USER = 5;

/**
 * Add a connection to the connections map
 */
export function addConnection(
  channel: string,
  controller: ReadableStreamDefaultController,
  userId?: string
) {
  if (!connections.has(channel)) {
    connections.set(channel, new Set());
  }

  const channelConnections = connections.get(channel)!;

  // Check connection limits for authenticated users
  if (userId) {
    const userConnections = Array.from(channelConnections).filter(
      (conn) => (conn as unknown as { userId?: string }).userId === userId
    );

    if (userConnections.length >= MAX_CONNECTIONS_PER_USER) {
      // Close oldest connection
      const oldest = userConnections[0];
      oldest.close();
      channelConnections.delete(oldest);
    }
  }

  // Tag controller with userId for cleanup
  (controller as unknown as { userId?: string }).userId = userId;
  channelConnections.add(controller);
}

/**
 * Remove a connection from the connections map
 */
export function removeConnection(
  channel: string,
  controller: ReadableStreamDefaultController
) {
  const channelConnections = connections.get(channel);
  if (channelConnections) {
    channelConnections.delete(controller);
    if (channelConnections.size === 0) {
      connections.delete(channel);
    }
  }
}

/**
 * Broadcast a message to all connections on a channel
 */
export function broadcastToChannel(channel: string, data: unknown) {
  const channelConnections = connections.get(channel);
  if (!channelConnections) return;

  const message = `data: ${JSON.stringify(data)}\n\n`;

  for (const controller of channelConnections) {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      // Connection closed, remove it
      console.error('Error broadcasting to connection:', error);
      channelConnections.delete(controller);
    }
  }
}

/**
 * Helper to broadcast new activity to channels
 * Called from tRPC mutations or other services
 */
export function broadcastNewActivity(activity: {
  id: string;
  type: string;
  objectType?: string | null;
  object?: Record<string, unknown> | null;
  contextId?: string | null;
  to: string[];
  actor?: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  published: Date;
}) {
  const message = {
    type: 'new_post',
    activity,
  };

  // Check if this is public
  const isPublic = activity.to.includes('public') || activity.to.includes('PUBLIC');

  // Broadcast to global channel if public
  if (isPublic) {
    broadcastToChannel('GLOBAL', message);
  }

  // Broadcast to context channel if contextId exists
  if (activity.contextId) {
    broadcastToChannel(`CONTEXT:${activity.contextId}`, message);
  }

  // Broadcast to followers' home timelines
  if (activity.actor?.id) {
    broadcastToChannel(`HOME:${activity.actor.id}`, message);
  }
}

/**
 * Helper to broadcast reaction to channels
 */
export function broadcastReaction(reaction: {
  id: string;
  targetActivityId: string;
  userId: string;
  user: {
    id: string;
    username: string | null;
    displayName: string | null;
    avatarUrl: string | null;
  };
  createdAt: Date;
}) {
  // Get the activity to determine channels
  db.activity
    .findUnique({
      where: { id: reaction.targetActivityId },
      select: { contextId: true, to: true },
    })
    .then((activity) => {
      if (!activity) return;

      const message = {
        type: 'new_reaction',
        reaction,
      };

      const isPublic = activity.to.includes('public') || activity.to.includes('PUBLIC');

      if (isPublic) {
        broadcastToChannel('GLOBAL', message);
      }

      if (activity.contextId) {
        broadcastToChannel(`CONTEXT:${activity.contextId}`, message);
      }
    })
    .catch(() => {
      console.error('Error broadcasting reaction');
    });
}

/**
 * Cleanup stale connections periodically
 */
export function startConnectionCleanup() {
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      for (const [channel, channelConnections] of connections.entries()) {
        for (const controller of channelConnections) {
          try {
            // Test if connection is still alive
            const test = `: ping\n\n`;
            controller.enqueue(new TextEncoder().encode(test));
          } catch {
            // Connection is dead, remove it
            channelConnections.delete(controller);
          }
        }

        // Clean up empty channels
        if (channelConnections.size === 0) {
          connections.delete(channel);
        }
      }
    }, 60000); // Run every minute
  }
}
