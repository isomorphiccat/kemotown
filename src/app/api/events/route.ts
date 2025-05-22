import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const EventCreateSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다').max(100, '제목이 너무 깁니다'),
  description: z.string().min(10, '설명은 최소 10자 이상이어야 합니다'),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), '올바른 시작 날짜를 입력하세요'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), '올바른 종료 날짜를 입력하세요'),
  locationAddress: z.string().optional(),
  naverMapUrl: z.string().url().optional().or(z.literal('')),
  isLocationPublic: z.boolean().default(true),
  cost: z.number().min(0, '비용은 0 이상이어야 합니다').default(0),
  attendeeCap: z.number().min(1, '참가자 제한은 1명 이상이어야 합니다').optional(),
  eventRules: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// GET /api/events - List events with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search');
    const upcoming = searchParams.get('upcoming') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Record<string, unknown> = {};
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (upcoming) {
      whereClause.startDate = {
        gte: new Date()
      };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      take: limit,
      skip: skip,
      orderBy: { startDate: 'asc' },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            furryName: true,
            profilePictureUrl: true,
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

    const totalEvents = await prisma.event.count({ where: whereClause });

    return NextResponse.json({
      events,
      currentPage: page,
      totalPages: Math.ceil(totalEvents / limit),
      totalEvents,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ message: 'User ID not found' }, { status: 401 });
    }

    const body = await request.json();
    const validation = EventCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate date logic
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { message: '종료 시간은 시작 시간보다 늦어야 합니다' },
        { status: 400 }
      );
    }

    if (startDate < new Date()) {
      return NextResponse.json(
        { message: '시작 시간은 현재 시간보다 늦어야 합니다' },
        { status: 400 }
      );
    }

    const newEvent = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        startDate: startDate,
        endDate: endDate,
        locationAddress: data.locationAddress,
        naverMapUrl: data.naverMapUrl || null,
        isLocationPublic: data.isLocationPublic,
        cost: data.cost,
        attendeeCap: data.attendeeCap,
        eventRules: data.eventRules,
        tags: data.tags,
        hostId: userId,
      },
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

    return NextResponse.json(newEvent, { status: 201 });

  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}