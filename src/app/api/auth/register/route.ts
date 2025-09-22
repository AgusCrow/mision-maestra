import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, displayName } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { username },
          ...(email ? [{ email }] : [])
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with initial coins for new adventurers
    const user = await db.user.create({
      data: {
        username,
        email,
        passwordHash,
        displayName: displayName || username,
        level: 1,
        experience: 0,
        points: 0,
        coins: 100, // Monedas iniciales para nuevos aventureros
        isOnline: false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        level: true,
        experience: true,
        points: true,
        coins: true,
        createdAt: true,
      }
    });

    // Log registration
    await db.serverLog.create({
      data: {
        level: 'INFO',
        message: `New adventurer registered: ${username}`,
        userId: user.id,
      }
    });

    return NextResponse.json({
      message: '¡Nuevo aventurero registrado con éxito!',
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}