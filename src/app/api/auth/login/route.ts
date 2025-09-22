import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update user status to online
    await db.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        lastSeen: new Date(),
      }
    });

    // Log login
    await db.serverLog.create({
      data: {
        level: 'INFO',
        message: `Adventurer logged in: ${username}`,
        userId: user.id,
      }
    });

    // Return user data (excluding password)
    const { passwordHash, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: '¡Bienvenido de nuevo, aventurero!',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}