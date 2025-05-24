import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMisskeyService } from '@/lib/misskey-client';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get('channelId') || undefined;

  const misskeyService = getMisskeyService();

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      controller.enqueue(encoder.encode(': connected\n\n'));

      // Set up Misskey streaming
      const eventSource = misskeyService.streamTimeline(
        (note) => {
          const data = `event: note\ndata: ${JSON.stringify(note)}\n\n`;
          controller.enqueue(encoder.encode(data));
        },
        { channelId }
      );

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        eventSource.close();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}