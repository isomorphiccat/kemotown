import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { User } from '@prisma/client';

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
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // Get recent users (newest members)
    const recentUsers = await prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        furryName: true,
        profilePictureUrl: true,
        interestTags: true,
        createdAt: true,
      }
    });

    // Transform the data to match the Dashboard component interface
    const transformedUsers = recentUsers.map((user: Pick<User, 'id' | 'username' | 'furryName' | 'profilePictureUrl' | 'interestTags'>) => ({
      id: user.id,
      username: user.username || 'unknown',
      furryName: user.furryName || undefined,
      profilePictureUrl: user.profilePictureUrl || undefined,
      interestTags: user.interestTags || []
    }));

    return NextResponse.json({
      recentUsers: transformedUsers
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching dashboard users:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}