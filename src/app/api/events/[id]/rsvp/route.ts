import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const RSVPSchema = z.object({
  status: z.enum(['ATTENDING', 'CONSIDERING', 'NOT_ATTENDING'], {
    required_error: 'RSVP 상태는 필수입니다',
    invalid_type_error: '올바른 RSVP 상태를 선택하세요'
  })
});

// POST /api/events/[id]/rsvp - Create or update RSVP
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
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

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    // Check if event has already started
    if (event.startDate < new Date()) {
      return NextResponse.json({ message: '이미 시작된 이벤트에는 참가 신청할 수 없습니다' }, { status: 400 });
    }

    const body = await request.json();
    const validation = RSVPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status } = validation.data;

    // Check capacity if user is trying to attend
    if (status === 'ATTENDING' && event.attendeeCap) {
      if (event._count.rsvps >= event.attendeeCap) {
        return NextResponse.json(
          { message: '이벤트 참가 인원이 가득 찼습니다' },
          { status: 400 }
        );
      }
    }

    // Prevent self-RSVP to own event
    if (event.hostId === userId) {
      return NextResponse.json(
        { message: '자신이 주최한 이벤트에는 참가 신청할 수 없습니다' },
        { status: 400 }
      );
    }

    // Create or update RSVP
    const rsvp = await prisma.rSVP.upsert({
      where: {
        userId_eventId: {
          userId: userId,
          eventId: id
        }
      },
      update: {
        status: status,
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        eventId: id,
        status: status,
        paymentStatus: event.cost > 0 ? 'PENDING' : 'NOT_APPLICABLE'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            furryName: true,
            profilePictureUrl: true,
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            cost: true,
          }
        }
      }
    });

    return NextResponse.json(rsvp, { status: 200 });

  } catch (error) {
    console.error('Error creating/updating RSVP:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/events/[id]/rsvp - Cancel RSVP
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

    // Check if RSVP exists
    const existingRSVP = await prisma.rSVP.findUnique({
      where: {
        userId_eventId: {
          userId: userId,
          eventId: id
        }
      }
    });

    if (!existingRSVP) {
      return NextResponse.json({ message: 'RSVP not found' }, { status: 404 });
    }

    // Delete the RSVP
    await prisma.rSVP.delete({
      where: {
        userId_eventId: {
          userId: userId,
          eventId: id
        }
      }
    });

    return NextResponse.json({ message: 'RSVP cancelled successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error cancelling RSVP:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}