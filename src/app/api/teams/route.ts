import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, description, creatorId } = await request.json();

    // Validate input
    if (!name || !creatorId) {
      return NextResponse.json(
        { error: 'Name and creator ID are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const creator = await db.user.findUnique({
      where: { id: creatorId }
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Create team with initial score and level
    const team = await db.team.create({
      data: {
        name,
        description,
        creatorId,
        score: 0,
        level: 1,
      },
    });

    // Add creator as team owner
    await db.teamMember.create({
      data: {
        userId: creatorId,
        teamId: team.id,
        role: 'OWNER',
        score: 0,
      }
    });

    // Log team creation
    await db.serverLog.create({
      data: {
        level: 'INFO',
        message: `New guild formed: ${name} by ${creator.username}`,
        userId: creatorId,
      }
    });

    // Return team with creator info
    const teamWithCreator = await db.team.findUnique({
      where: { id: team.id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: '¡Gremio formado con éxito!',
      team: teamWithCreator,
    });
  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      // Get teams where user is a member
      const teams = await db.team.findMany({
        where: {
          members: {
            some: {
              userId: userId,
              isActive: true,
            }
          },
          isActive: true,
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
            }
          },
          members: {
            where: {
              isActive: true,
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  isOnline: true,
                }
              }
            }
          },
          _count: {
            select: {
              members: true,
              tasks: true,
            }
          }
        },
        orderBy: [
          { level: 'desc' },
          { score: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return NextResponse.json({
        teams,
        count: teams.length,
      });
    } else {
      // Get all active teams
      const teams = await db.team.findMany({
        where: {
          isActive: true,
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
            }
          },
          _count: {
            select: {
              members: true,
              tasks: true,
            }
          }
        },
        orderBy: [
          { level: 'desc' },
          { score: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return NextResponse.json({
        teams,
        count: teams.length,
      });
    }
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}