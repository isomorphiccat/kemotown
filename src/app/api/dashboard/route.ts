import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { Event, User, RSVP } from '@prisma/client';

interface TimelineItem {
  id: string;
  type: 'event_created' | 'user_joined' | 'rsvp_update';
  content: string;
  timestamp: string;
  userId?: string;
  username?: string;
  furryName?: string;
  eventId?: string;
  eventTitle?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ message: 'User ID not found' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const timeline: TimelineItem[] = [];

    // Get recent events created
    const recentEvents = await prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            furryName: true,
          }
        }
      }
    });

    recentEvents.forEach((event: Event & {
      host: Pick<User, 'id' | 'username' | 'furryName'>;
    }) => {
      timeline.push({
        id: `event_${event.id}`,
        type: 'event_created',
        content: '새로운 이벤트가 생성되었습니다',
        timestamp: event.createdAt.toISOString(),
        userId: event.host.id,
        username: event.host.username || undefined,
        furryName: event.host.furryName || undefined,
        eventId: event.id,
        eventTitle: event.title
      });
    });

    // Get recent user joins
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        furryName: true,
        createdAt: true,
      }
    });

    recentUsers.forEach((user: Pick<User, 'id' | 'username' | 'furryName' | 'createdAt'>) => {
      timeline.push({
        id: `user_${user.id}`,
        type: 'user_joined',
        content: '새로운 멤버가 가입했습니다',
        timestamp: user.createdAt.toISOString(),
        userId: user.id,
        username: user.username || undefined,
        furryName: user.furryName || undefined
      });
    });

    // Get recent RSVPs
    const recentRSVPs = await prisma.rSVP.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: {
        status: 'ATTENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            furryName: true,
          }
        },
        event: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    recentRSVPs.forEach((rsvp: RSVP & {
      user: Pick<User, 'id' | 'username' | 'furryName'>;
      event: Pick<Event, 'id' | 'title'>;
    }) => {
      timeline.push({
        id: `rsvp_${rsvp.id}`,
        type: 'rsvp_update',
        content: '이벤트에 참가 신청했습니다',
        timestamp: rsvp.createdAt.toISOString(),
        userId: rsvp.user.id,
        username: rsvp.user.username || undefined,
        furryName: rsvp.user.furryName || undefined,
        eventId: rsvp.event.id,
        eventTitle: rsvp.event.title
      });
    });

    // Sort timeline by timestamp (most recent first) and limit
    const sortedTimeline = timeline
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({ timeline: sortedTimeline }, { status: 200 });

  } catch (error) {
    console.error('Error fetching dashboard timeline:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}