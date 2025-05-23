import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { UserUpdateSchema } from '@/lib/validators/user';
import bcrypt from 'bcrypt';

// GET Handler for fetching a user profile by username
export async function GET(request: Request, context: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await context.params;

    if (!username) {
      return NextResponse.json({ message: 'Username is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, email: __, ...userWithoutSensitiveData } = user;
    return NextResponse.json(userWithoutSensitiveData, { status: 200 });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT Handler for updating a user profile by username
export async function PUT(request: Request, context: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await context.params;

    if (!username) {
      return NextResponse.json({ message: 'Username is required' }, { status: 400 });
    }

    const body = await request.json();
    const validation = UserUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { password, ...updateData } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // If username is being updated, check for uniqueness
    if (updateData.username && updateData.username !== existingUser.username) {
      const userByNewUsername = await prisma.user.findUnique({
        where: { username: updateData.username },
      });
      if (userByNewUsername) {
        return NextResponse.json({ message: 'Username is already taken' }, { status: 409 });
      }
    }

    // If email is being updated, check for uniqueness
    if (updateData.email && updateData.email !== existingUser.email) {
      const userByNewEmail = await prisma.user.findUnique({
        where: { email: updateData.email },
      });
      if (userByNewEmail) {
        return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
      }
    }

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        ...updateData,
        ...(hashedPassword && { password: hashedPassword }), // Only include password if it was provided and hashed
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, email: __, ...userWithoutSensitiveData } = updatedUser;
    return NextResponse.json(userWithoutSensitiveData, { status: 200 });

  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof SyntaxError) { // Handle malformed JSON
        return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
