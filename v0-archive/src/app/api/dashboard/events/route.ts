import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { Event, User, RSVP } from '@prisma/client';

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
    const upcomingLimit = parseInt(searchParams.get('upcoming_limit') || '10', 10);
    const userLimit = parseInt(searchParams.get('user_limit') || '5', 10);

    // Get upcoming events (future events)
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDate: {
          gte: new Date()
        }
      },
      take: upcomingLimit,
      orderBy: { startDate: 'asc' },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            furryName: true,
          }
        },
        _count: {
          select: {
            rsvps: {
              where: {
                status: 'ATTENDING'
              }
            }
          }
        }
      }
    });

    // Get user's attending events
    const userEvents = await prisma.event.findMany({
      where: {
        rsvps: {
          some: {
            userId: userId,
            status: 'ATTENDING'
          }
        },
        startDate: {
          gte: new Date()
        }
      },
      take: userLimit,
      orderBy: { startDate: 'asc' },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            furryName: true,
          }
        },
        rsvps: {
          where: {
            userId: userId
          },
          select: {
            status: true
          }
        }
      }
    });

    // Transform the data to match the Dashboard component interface
    const transformedUpcomingEvents = upcomingEvents.map((event: Event & {
      host: Pick<User, 'id' | 'username' | 'furryName'>;
      _count: { rsvps: number };
    }) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      location: event.locationAddress || undefined,
      priceKrw: event.cost,
      attendeeCap: event.attendeeCap || undefined,
      hostId: event.host.id,
      hostUsername: event.host.username || undefined,
      hostFurryName: event.host.furryName || undefined,
      attendeeCount: event._count.rsvps
    }));

    const transformedUserEvents = userEvents.map((event: Event & {
      host: Pick<User, 'id' | 'username' | 'furryName'>;
      rsvps: Pick<RSVP, 'status'>[];
    }) => ({
      id: event.id,
      title: event.title,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      location: event.locationAddress || undefined,
      hostId: event.host.id,
      hostUsername: event.host.username || undefined,
      userRsvpStatus: event.rsvps[0]?.status?.toLowerCase() as 'attending' | 'considering' | 'not_attending' || null
    }));

    return NextResponse.json({
      upcomingEvents: transformedUpcomingEvents,
      userEvents: transformedUserEvents
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching dashboard events:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}