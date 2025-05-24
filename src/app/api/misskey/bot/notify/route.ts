import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBotSystem } from '@/lib/misskey-client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const botSystem = await getBotSystem();

    if (body.userJoined) {
      const { username, furryName } = body.userJoined;
      await botSystem.notifyUserJoined(username, furryName);
    }

    if (body.eventCreated) {
      const { eventTitle, hostUsername, eventId } = body.eventCreated;
      await botSystem.notifyEventCreated(eventTitle, hostUsername, eventId);
    }

    if (body.eventRsvp) {
      const { username, eventTitle, status } = body.eventRsvp;
      await botSystem.notifyEventRsvp(username, eventTitle, status);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bot notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}