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