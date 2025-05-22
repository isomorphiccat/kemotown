import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET /api/events/[id] - Get single event with RSVP status
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : null;
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            furryName: true,
            profilePictureUrl: true,
          }
        },
        rsvps: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                furryName: true,
                profilePictureUrl: true,
              }
            }
          }
        },
        _count: {
          select: {
            rsvps: {
              where: {
                status: { in: ['ATTENDING', 'CONSIDERING'] }
              }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    // Get current user's RSVP status if logged in
    let userRsvpStatus = null;
    if (userId) {
      const userRsvp = event.rsvps.find(rsvp => rsvp.userId === userId);
      userRsvpStatus = userRsvp ? userRsvp.status : null;
    }

    // Transform response to include user's RSVP status
    const response = {
      ...event,
      userRsvpStatus,
      attendeesCount: event._count.rsvps,
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/events/[id] - Update event (only by host)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ message: 'User ID not found' }, { status: 401 });
    }
    const { id } = await params;

    // Check if user is the host of this event
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    if (existingEvent.hostId !== userId) {
      return NextResponse.json({ message: 'Only the event host can edit this event' }, { status: 403 });
    }

    const body = await request.json();
    
    // Allow partial updates
    const updateData: Record<string, unknown> = {};
    
    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);
    if (body.locationAddress !== undefined) updateData.locationAddress = body.locationAddress;
    if (body.naverMapUrl !== undefined) updateData.naverMapUrl = body.naverMapUrl;
    if (body.isLocationPublic !== undefined) updateData.isLocationPublic = body.isLocationPublic;
    if (body.cost !== undefined) updateData.cost = body.cost;
    if (body.attendeeCap !== undefined) updateData.attendeeCap = body.attendeeCap;
    if (body.eventRules !== undefined) updateData.eventRules = body.eventRules;
    if (body.tags !== undefined) updateData.tags = body.tags;

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        host: {
          select: {
            id: true,
            username: true,
            furryName: true,
            profilePictureUrl: true,
          }
        }
      }
    });

    return NextResponse.json(updatedEvent, { status: 200 });

  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/events/[id] - Delete event (only by host)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ message: 'User ID not found' }, { status: 401 });
    }
    const { id } = await params;

    // Check if user is the host of this event
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    if (existingEvent.hostId !== userId) {
      return NextResponse.json({ message: 'Only the event host can delete this event' }, { status: 403 });
    }

    // Delete the event (RSVPs will be cascade deleted due to foreign key constraint)
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Event deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}