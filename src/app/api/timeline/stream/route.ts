/**
 * Timeline SSE (Server-Sent Events) Endpoint
 * Provides real-time updates for timeline posts
 * Vercel-compatible with connection management
 */

import { NextRequest } from 'next/server';
import { db } from '@/server/db';
import { auth } from '@/lib/auth';
import {
  addConnection,
  removeConnection,
  startConnectionCleanup,
} from '@/server/services/sse.service';

const HEARTBEAT_INTERVAL = 15000; // 15 seconds
const MAX_CONNECTION_TIME = 24 * 60 * 60 * 1000; // 24 hours

// Start connection cleanup
startConnectionCleanup();

/**
 * GET /api/timeline/stream
 * Server-Sent Events endpoint for real-time timeline updates
 *
 * Supported channels:
 * - GLOBAL: Public timeline (no auth required)
 * - HOME: Authenticated user's home timeline (auth required)
 * - EVENT:{eventId}: Legacy event timeline (auth + RSVP required)
 * - CONTEXT:{contextId}: Context timeline (auth + membership for private contexts)
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel') || 'GLOBAL';
  const eventId = searchParams.get('eventId');
  const contextId = searchParams.get('contextId');

  // Verify access for home timeline
  if (channel === 'HOME') {
    if (!session?.user) {
      return new Response('Unauthorized: Login required for home timeline', { status: 401 });
    }
  }

  // Verify access for context timelines (v2)
  if (channel === 'CONTEXT' && contextId) {
    const context = await db.context.findUnique({
      where: { id: contextId },
      select: { visibility: true },
    });

    if (!context) {
      return new Response('Not Found: Context does not exist', { status: 404 });
    }

    // For private contexts, require membership
    if (context.visibility === 'PRIVATE') {
      if (!session?.user) {
        return new Response('Unauthorized: Login required for private context', { status: 401 });
      }

      const membership = await db.membership.findUnique({
        where: {
          contextId_userId: {
            contextId,
            userId: session.user.id,
          },
        },
        select: { status: true },
      });

      if (membership?.status !== 'APPROVED') {
        return new Response('Forbidden: Membership required for private context', {
          status: 403,
        });
      }
    }
  }

  // Note: Legacy EVENT channel removed - use CONTEXT channel for events via Context system

  // Build channel key for connection tracking
  let channelKey = channel;
  if (contextId) {
    channelKey = `CONTEXT:${contextId}`;
  } else if (eventId) {
    channelKey = `EVENT:${eventId}`;
  } else if (channel === 'HOME' && session?.user) {
    channelKey = `HOME:${session.user.id}`;
  }

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Add connection
      addConnection(channelKey, controller, session?.user?.id);

      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({ type: 'connected', channel: channelKey })}\n\n`;
      controller.enqueue(new TextEncoder().encode(initialMessage));

      // Set up heartbeat
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `: heartbeat\n\n`;
          controller.enqueue(new TextEncoder().encode(heartbeat));
        } catch {
          // Connection closed
          clearInterval(heartbeatInterval);
          removeConnection(channelKey, controller);
        }
      }, HEARTBEAT_INTERVAL);

      // Set up connection timeout
      const timeoutId = setTimeout(() => {
        clearInterval(heartbeatInterval);
        controller.close();
        removeConnection(channelKey, controller);
      }, MAX_CONNECTION_TIME);

      // Clean up on close
      const cleanup = () => {
        clearInterval(heartbeatInterval);
        clearTimeout(timeoutId);
        removeConnection(channelKey, controller);
      };

      // Store cleanup function
      (controller as unknown as { cleanup?: () => void }).cleanup = cleanup;
    },

    cancel(controller) {
      // Clean up on client disconnect
      const cleanup = (controller as unknown as { cleanup?: () => void }).cleanup;
      if (cleanup) {
        cleanup();
      }
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
