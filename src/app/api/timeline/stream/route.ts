/**
 * Timeline Stream API Route
 * GET /api/timeline/stream - Server-Sent Events for real-time timeline updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { clients } from '@/lib/timeline/broadcast';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get query parameters - eventId will be used in future for channel-specific streaming
  // const searchParams = request.nextUrl.searchParams;
  // const eventId = searchParams.get('eventId') || 'global';
  
  // Create unique client ID
  const clientId = `${session.user.email}-${Date.now()}`;
  
  // Create ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for this client
      clients.set(clientId, controller);
      
      // Send initial connection message
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`)
      );
      
      // Set up ping interval to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000); // Ping every 30 seconds
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        clients.delete(clientId);
        controller.close();
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