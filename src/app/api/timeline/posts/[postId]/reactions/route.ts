/**
 * Reactions API Route
 * POST /api/timeline/posts/[postId]/reactions - Add a reaction
 * DELETE /api/timeline/posts/[postId]/reactions - Remove a reaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TimelineService } from '@/lib/timeline';
import { z } from 'zod';
import { broadcastReaction } from '@/lib/timeline/broadcast';

// Input validation schema
const reactionSchema = z.object({
  emoji: z.string().min(1).max(10)
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
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
    const { emoji } = reactionSchema.parse(body);

    // Ensure the post exists
    const post = await prisma.timelinePost.findUnique({
      where: { id: postId },
      select: { id: true }
    });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Initialize timeline service
    const timelineService = new TimelineService(prisma);

    // Add reaction
    await timelineService.addReaction(postId, user.id, emoji);

    // Broadcast reaction update
    broadcastReaction(postId, { userId: user.id, emoji }, 'add');

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Reaction creation error:', error);
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
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

    // Get emoji from query params
    const searchParams = request.nextUrl.searchParams;
    const emoji = searchParams.get('emoji');

    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji parameter required' },
        { status: 400 }
      );
    }

    // Initialize timeline service
    const timelineService = new TimelineService(prisma);

    // Remove reaction
    await timelineService.removeReaction(postId, user.id, emoji);

    // Broadcast reaction update
    broadcastReaction(postId, { userId: user.id, emoji }, 'remove');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reaction deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to remove reaction' },
      { status: 500 }
    );
  }
}