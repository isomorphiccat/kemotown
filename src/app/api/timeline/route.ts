/**
 * Timeline API Route
 * GET /api/timeline - Get timeline posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TimelineService } from '@/lib/timeline';
import { initializeBots } from '@/lib/timeline/initialize-bots';

export async function GET(request: NextRequest) {
  try {
    // Ensure bots are initialized
    await initializeBots();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const cursor = searchParams.get('cursor') || undefined;

    // Get current user from session
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check event timeline access if eventId is provided
    if (eventId) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          rsvps: {
            where: {
              userId: currentUser.id,
              status: {
                in: ['ATTENDING', 'CONSIDERING']
              }
            }
          }
        }
      });

      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }

      // Check if user has access to event timeline (must be attending or considering)
      if (!event.rsvps || event.rsvps.length === 0) {
        return NextResponse.json({ 
          error: 'Access denied. You must RSVP to this event to view its timeline.' 
        }, { status: 403 });
      }
    }

    // Initialize timeline service
    const timelineService = new TimelineService(prisma);

    // Get timeline posts
    const result = await timelineService.getTimeline({
      eventId,
      limit: Math.min(limit, 50), // Cap at 50 posts
      cursor,
      includeReactions: true,
      includeMentions: true
    });

    // Transform posts for API response
    const posts = result.posts.map(post => ({
      id: post.id,
      content: post.content,
      channelType: post.channelType,
      isBot: post.isBot,
      botType: post.botType,
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
    }));

    return NextResponse.json({
      posts,
      nextCursor: result.nextCursor
    });
  } catch (error) {
    console.error('Timeline fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}