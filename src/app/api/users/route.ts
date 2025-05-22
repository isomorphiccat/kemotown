import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { UserCreateSchema } from '@/lib/validators/user';
import bcrypt from 'bcrypt';

// GET handler for listing users with optional search and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (searchQuery) {
      whereClause.OR = [
        { username: { contains: searchQuery, mode: 'insensitive' } },
        { furryName: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true, // Consider if email should be public here
        furryName: true,
        profilePictureUrl: true,
        interestTags: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc', // Default sort by newest
      },
      skip: skip,
      take: limit,
    });

    const totalUsers = await prisma.user.count({ where: whereClause });

    return NextResponse.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = UserCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { username, email, password, ...otherData } = validation.data;

    // Check if user already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUserByEmail) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const existingUserByUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUserByUsername) {
      return NextResponse.json({ message: 'Username is already taken' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        ...otherData,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof SyntaxError) { // Handle malformed JSON
        return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
