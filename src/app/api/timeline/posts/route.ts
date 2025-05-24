/**
 * Timeline Posts API Route
 * POST /api/timeline/posts - Create a new post
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TimelineService } from '@/lib/timeline';
import { z } from 'zod';
import { broadcastPost } from '@/lib/timeline/broadcast';

// Input validation schema
const createPostSchema = z.object({
  content: z.string().min(1).max(500),
  eventId: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    // If posting to an event, verify user is attending
    if (validatedData.eventId) {
      const rsvp = await prisma.rSVP.findUnique({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId: validatedData.eventId
          }
        }
      });

      if (!rsvp || rsvp.status === 'NOT_ATTENDING') {
        return NextResponse.json(
          { error: 'You must be attending this event to post' },
          { status: 403 }
        );
      }
    }

    // Initialize timeline service
    const timelineService = new TimelineService(prisma);

    // Create the post
    const post = await timelineService.createPost({
      content: validatedData.content,
      userId: user.id,
      eventId: validatedData.eventId
    });

    // Transform post for API response
    const responsePost = {
      id: post.id,
      content: post.content,
      channelType: post.channelType,
      isBot: post.isBot,
      botType: post.botType || undefined,
      createdAt: post.createdAt.toISOString(),
      user: post.user ? {
        id: post.user.id,
        username: post.user.username,
        furryName: post.user.furryName,
        profilePictureUrl: post.user.profilePictureUrl
      } : null,
      botUser: post.botUser ? {
        id: post.botUser.id,
        username: post.botUser.username,
        displayName: post.botUser.displayName,
        avatarUrl: post.botUser.avatarUrl
      } : null,
      event: post.event ? {
        id: post.event.id,
        title: post.event.title
      } : null,
      reactions: post.reactions,
      reactionCount: post._count.reactions,
      mentions: post.mentions.map(m => ({
        id: m.mentionedUser.id,
        username: m.mentionedUser.username
      }))
    };

    // Broadcast the new post to connected clients
    broadcastPost(responsePost, validatedData.eventId || 'global');

    return NextResponse.json(responsePost, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Post creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}