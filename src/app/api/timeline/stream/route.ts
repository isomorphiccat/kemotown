/**
 * Timeline Stream API Route
 * GET /api/timeline/stream - Server-Sent Events for real-time timeline updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { clients, cleanupOldConnections } from '@/lib/timeline/broadcast';

// Connection limits for security
const MAX_CONNECTIONS_PER_USER = 5;
const MAX_CONNECTION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Clean up old connections periodically
  cleanupOldConnections();

  // Check connection limits per user
  const userEmail = session.user.email;
  const userConnections = Array.from(clients.keys()).filter(id => id.startsWith(userEmail));
  
  if (userConnections.length >= MAX_CONNECTIONS_PER_USER) {
    return NextResponse.json({ 
      error: 'Too many connections. Please close other tabs or refresh.' 
    }, { status: 429 });
  }

  // Get query parameters - eventId will be used in future for channel-specific streaming
  // const searchParams = request.nextUrl.searchParams;
  // const eventId = searchParams.get('eventId') || 'global';
  
  // Create unique client ID
  const clientId = `${userEmail}-${Date.now()}`;
  
  // Create ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for this client with metadata
      clients.set(clientId, {
        controller,
        connectedAt: Date.now(),
        userEmail
      });
      
      // Send initial connection message
      const encoder = new TextEncoder();
      try {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`)
        );
      } catch (error) {
        console.error(`Failed to send initial message to client ${clientId}:`, error);
        clients.delete(clientId);
        controller.close();
        return;
      }
      
      // Set up ping interval to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          if (!clients.has(clientId)) {
            clearInterval(pingInterval);
            return;
          }
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch (error) {
          console.error(`Ping failed for client ${clientId}:`, error);
          clearInterval(pingInterval);
          clients.delete(clientId);
          try {
            controller.close();
          } catch (closeError) {
            console.error(`Failed to close controller for client ${clientId}:`, closeError);
          }
        }
      }, 30000); // Ping every 30 seconds
      
      // Store cleanup function for this client
      const cleanup = () => {
        clearInterval(pingInterval);
        clients.delete(clientId);
      };

      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        if (clients.has(clientId)) {
          console.log(`Closing long-running connection for client ${clientId}`);
          cleanup();
          try {
            controller.close();
          } catch (error) {
            console.error(`Failed to close long-running connection for client ${clientId}:`, error);
          }
        }
      }, MAX_CONNECTION_DURATION);
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        cleanup();
        clearTimeout(connectionTimeout);
        try {
          controller.close();
        } catch (error) {
          console.error(`Failed to close controller for client ${clientId}:`, error);
        }
      });
    },
    
    cancel() {
      // Clean up when client disconnects
      clients.delete(clientId);
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}