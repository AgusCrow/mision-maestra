import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from session or token (simplified for now)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        level: true,
        coins: true,
        experience: true,
        points: true,
        role: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's team role
    const teamMember = await db.teamMember.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
      select: {
        role: true,
      }
    });

    const userData = {
      id: user.id,
      name: user.displayName || user.username,
      email: user.email,
      level: user.level,
      role: teamMember?.role || 'member',
      coins: user.coins,
      experience: user.experience,
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}