import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update user status to offline
    const user = await db.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        lastSeen: new Date(),
      }
    });

    // Log logout
    await db.serverLog.create({
      data: {
        level: 'INFO',
        message: `User logged out: ${user.username}`,
        userId: user.id,
      }
    });

    return NextResponse.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}