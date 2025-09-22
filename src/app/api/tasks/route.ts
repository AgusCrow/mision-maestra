import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { title, description, teamId, createdById, assignedTo, priority, difficulty, dueDate } = await request.json();

    // Validate input
    if (!title || !teamId || !createdById) {
      return NextResponse.json(
        { error: 'Title, team ID, and creator ID are required' },
        { status: 400 }
      );
    }

    // Check if team exists and user is a member
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            userId: createdById,
            isActive: true,
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Guild not found' },
        { status: 404 }
      );
    }

    if (team.members.length === 0) {
      return NextResponse.json(
        { error: 'You must be a guild member to create quests' },
        { status: 403 }
      );
    }

    // Calculate rewards based on difficulty
    const calculatedDifficulty = difficulty || 3;
    const estimatedCoins = calculatedDifficulty * 10;
    const estimatedExperience = calculatedDifficulty * 15;
    const estimatedPoints = calculatedDifficulty * 5;

    // Create task (mission)
    const task = await db.task.create({
      data: {
        title,
        description,
        teamId,
        creatorId: createdById,
        assigneeId: assignedTo || null,
        priority: priority?.toUpperCase() || 'MEDIUM',
        difficulty: calculatedDifficulty,
        dueDate: dueDate ? new Date(dueDate) : null,
        points: estimatedPoints,
        coins: estimatedCoins,
        experience: estimatedExperience,
        status: 'pending',
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            role: true,
          }
        },
        assignee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            role: true,
          }
        },
        team: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Log task creation
    await db.serverLog.create({
      data: {
        level: 'INFO',
        message: `New quest created: "${title}" in guild ${team.name}`,
        userId: createdById,
      }
    });

    // Emit socket event for real-time updates
    const { getIO } = await import('@/lib/socket');
    const io = getIO();
    io.to(`team-${teamId}`).emit('task-created', {
      ...task,
      estimatedCoins,
      estimatedExperience,
      estimatedPoints,
    });

    return NextResponse.json({
      message: '¡Misión creada con éxito!',
      task: {
        ...task,
        estimatedCoins,
        estimatedExperience,
        estimatedPoints,
      },
    });
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    if (teamId) {
      // Get tasks for a specific team
      const whereClause: any = {
        teamId: teamId,
      };

      if (status) {
        whereClause.status = status;
      }

      const tasks = await db.task.findMany({
        where: whereClause,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              email: true,
              role: true,
            }
          },
          assignee: {
            select: {
              id: true,
              username: true,
              displayName: true,
              email: true,
              role: true,
            }
          },
          team: {
            select: {
              id: true,
              name: true,
            }
          },
          completions: {
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
        },
        orderBy: [
          { priority: 'desc' },
          { difficulty: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      // Add estimated rewards to each task
      const tasksWithRewards = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority.toLowerCase(),
        difficulty: task.difficulty,
        assignedTo: task.assignee ? {
          id: task.assignee.id,
          name: task.assignee.displayName || task.assignee.username,
          email: task.assignee.email,
          role: task.assignee.role,
        } : undefined,
        createdBy: {
          id: task.creator.id,
          name: task.creator.displayName || task.creator.username,
          email: task.creator.email,
          role: task.creator.role,
        },
        dueDate: task.dueDate?.toISOString(),
        teamId: task.teamId,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        estimatedCoins: task.coins,
        estimatedExperience: task.experience,
        estimatedPoints: task.points,
      }));

      return NextResponse.json(tasksWithRewards);
    } else if (userId) {
      // Get tasks assigned to a specific user
      const whereClause: any = {
        assigneeId: userId,
      };

      if (status) {
        whereClause.status = status;
      }

      const tasks = await db.task.findMany({
        where: whereClause,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              email: true,
              role: true,
            }
          },
          assignee: {
            select: {
              id: true,
              username: true,
              displayName: true,
              email: true,
              role: true,
            }
          },
          team: {
            select: {
              id: true,
              name: true,
            }
          },
          completions: {
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
        },
        orderBy: [
          { priority: 'desc' },
          { difficulty: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      // Add estimated rewards to each task
      const tasksWithRewards = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority.toLowerCase(),
        difficulty: task.difficulty,
        assignedTo: task.assignee ? {
          id: task.assignee.id,
          name: task.assignee.displayName || task.assignee.username,
          email: task.assignee.email,
          role: task.assignee.role,
        } : undefined,
        createdBy: {
          id: task.creator.id,
          name: task.creator.displayName || task.creator.username,
          email: task.creator.email,
          role: task.creator.role,
        },
        dueDate: task.dueDate?.toISOString(),
        teamId: task.teamId,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        estimatedCoins: task.coins,
        estimatedExperience: task.experience,
        estimatedPoints: task.points,
      }));

      return NextResponse.json(tasksWithRewards);
    } else {
      return NextResponse.json(
        { error: 'Team ID or User ID is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}