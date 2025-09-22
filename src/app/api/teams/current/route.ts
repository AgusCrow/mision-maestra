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

    // Find user's active team
    const teamMember = await db.teamMember.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    level: true,
                    coins: true,
                    experience: true,
                  }
                }
              }
            },
            _count: {
              select: {
                members: true,
              }
            }
          }
        }
      }
    });

    if (!teamMember || !teamMember.team) {
      return NextResponse.json(
        { error: 'User is not part of any team' },
        { status: 404 }
      );
    }

    const team = teamMember.team;
    
    // Calculate team totals
    const totalCoins = team.members.reduce((sum, member) => sum + member.user.coins, 0);
    const totalExperience = team.members.reduce((sum, member) => sum + member.user.experience, 0);
    const teamLevel = Math.floor(totalExperience / 1000) + 1;

    const teamData = {
      id: team.id,
      name: team.name,
      description: team.description || '',
      level: teamLevel,
      totalCoins,
      totalExperience,
      memberCount: team.members.length,
      maxMembers: team.maxMembers || 10,
      createdAt: team.createdAt.toISOString(),
    };

    return NextResponse.json(teamData);
  } catch (error) {
    console.error('Error fetching current team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}