import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const onlineUsers = await db.user.findMany({
      where: {
        isOnline: true,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        level: true,
        experience: true,
        points: true,
        avatar: true,
        lastSeen: true,
      },
      orderBy: {
        lastSeen: 'desc',
      }
    });

    return NextResponse.json({
      onlineUsers,
      count: onlineUsers.length,
    });
  } catch (error) {
    console.error('Get online users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}