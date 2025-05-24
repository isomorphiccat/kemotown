import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMisskeyService } from '@/lib/misskey-client';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, channelId, cw, visibility = 'public', localOnly = true } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Get user's Misskey account
    const userMisskeyAccount = await prisma.userMisskeyAccount.findUnique({
      where: { userId: session.user.id },
    });

    const misskeyService = getMisskeyService();

    // Create Misskey account if user doesn't have one
    if (!userMisskeyAccount) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user?.username) {
        return NextResponse.json({ error: 'Username required' }, { status: 400 });
      }

      const misskeyUser = await misskeyService.createUser(session.user.id, user.username);
      
      await prisma.userMisskeyAccount.create({
        data: {
          userId: session.user.id,
          misskeyUserId: misskeyUser.id,
          apiToken: 'placeholder', // Token is managed by MisskeyService
        },
      });
    }

    // Create note
    const note = await misskeyService.createNote(
      {
        text,
        channelId,
        cw,
        visibility,
        localOnly,
      },
      session.user.id
    );

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Note creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}