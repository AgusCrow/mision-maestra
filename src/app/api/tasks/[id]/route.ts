import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status } = await request.json();

    // Check if task exists
    const existingTask = await db.task.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            members: {
              where: {
                isActive: true,
              }
            }
          }
        }
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    // Update task
    const updatedTask = await db.task.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
        ...(status && status !== 'COMPLETED' && { completedAt: null }),
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
      }
    });

    // Handle task completion and award rewards
    if (status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      // Award rewards to assignee or creator if no assignee
      const userId = existingTask.assigneeId || existingTask.creatorId;
      const pointsToAward = existingTask.points;
      const coinsToAward = existingTask.coins;
      const experienceToAward = existingTask.experience;

      // Update user rewards
      await db.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: pointsToAward,
          },
          coins: {
            increment: coinsToAward,
          },
          experience: {
            increment: experienceToAward,
          },
        }
      });

      // Update team score and member contribution
      await db.team.update({
        where: { id: existingTask.teamId },
        data: {
          score: {
            increment: pointsToAward,
          }
        }
      });

      await db.teamMember.updateMany({
        where: {
          userId: userId,
          teamId: existingTask.teamId,
        },
        data: {
          score: {
            increment: pointsToAward,
          }
        }
      });

      // Log task completion
      await db.serverLog.create({
        data: {
          level: 'INFO',
          message: `Quest completed: "${existingTask.title}" - ${pointsToAward} points, ${coinsToAward} coins, ${experienceToAward} XP awarded`,
          userId: userId,
        }
      });

      // Create task completion record
      await db.taskCompletion.create({
        data: {
          taskId: id,
          userId: userId,
        }
      });
    }

    // Log task update
    await db.serverLog.create({
      data: {
        level: 'INFO',
        message: `Quest updated: "${existingTask.title}" - Status: ${status || existingTask.status}`,
        userId: existingTask.creatorId,
      }
    });

    // Format response
    const formattedTask = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority.toLowerCase(),
      difficulty: updatedTask.difficulty,
      assignedTo: updatedTask.assignee ? {
        id: updatedTask.assignee.id,
        name: updatedTask.assignee.displayName || updatedTask.assignee.username,
        email: updatedTask.assignee.email,
        role: updatedTask.assignee.role,
      } : undefined,
      createdBy: {
        id: updatedTask.creator.id,
        name: updatedTask.creator.displayName || updatedTask.creator.username,
        email: updatedTask.creator.email,
        role: updatedTask.creator.role,
      },
      dueDate: updatedTask.dueDate?.toISOString(),
      teamId: updatedTask.teamId,
      createdAt: updatedTask.createdAt.toISOString(),
      updatedAt: updatedTask.updatedAt.toISOString(),
      estimatedCoins: updatedTask.coins,
      estimatedExperience: updatedTask.experience,
      estimatedPoints: updatedTask.points,
    };

    // Emit socket event for real-time updates
    const { getIO } = await import('@/lib/socket');
    const io = getIO();
    io.to(`team-${existingTask.teamId}`).emit('task-updated', formattedTask);

    return NextResponse.json(formattedTask);
  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { title, description, status, priority, dueDate, assigneeId, points, coins, experience } = await request.json();

    // Check if task exists
    const existingTask = await db.task.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            members: {
              where: {
                isActive: true,
              }
            }
          }
        }
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    // Update task
    const updatedTask = await db.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(points !== undefined && { points }),
        ...(coins !== undefined && { coins }),
        ...(experience !== undefined && { experience }),
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
        ...(status && status !== 'COMPLETED' && { completedAt: null }),
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        assignee: {
          select: {
            id: true,
            username: true,
            displayName: true,
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
      }
    });

    // Handle task completion and award rewards
    if (status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      // Award rewards to assignee or creator if no assignee
      const userId = assigneeId || existingTask.creatorId;
      const pointsToAward = existingTask.points;
      const coinsToAward = existingTask.coins;
      const experienceToAward = existingTask.experience;

      // Update user rewards
      await db.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: pointsToAward,
          },
          coins: {
            increment: coinsToAward,
          },
          experience: {
            increment: experienceToAward,
          },
        }
      });

      // Update team score and member contribution
      await db.team.update({
        where: { id: existingTask.teamId },
        data: {
          score: {
            increment: pointsToAward,
          }
        }
      });

      await db.teamMember.updateMany({
        where: {
          userId: userId,
          teamId: existingTask.teamId,
        },
        data: {
          score: {
            increment: pointsToAward,
          }
        }
      });

      // Log task completion
      await db.serverLog.create({
        data: {
          level: 'INFO',
          message: `Quest completed: "${existingTask.title}" - ${pointsToAward} points, ${coinsToAward} coins, ${experienceToAward} XP awarded`,
          userId: userId,
        }
      });

      // Create task completion record
      await db.taskCompletion.create({
        data: {
          taskId: id,
          userId: userId,
        }
      });
    }

    // Log task update
    await db.serverLog.create({
      data: {
        level: 'INFO',
        message: `Quest updated: "${existingTask.title}" - Status: ${status || existingTask.status}`,
        userId: existingTask.creatorId,
      }
    });

    return NextResponse.json({
      message: '¡Misión actualizada con éxito!',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if task exists
    const existingTask = await db.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Quest not found' },
        { status: 404 }
      );
    }

    // Delete task
    await db.task.delete({
      where: { id },
    });

    // Log task deletion
    await db.serverLog.create({
      data: {
        level: 'INFO',
        message: `Quest deleted: "${existingTask.title}"`,
        userId: existingTask.creatorId,
      }
    });

    return NextResponse.json({
      message: '¡Misión eliminada con éxito!',
    });
  } catch (error) {
    console.error('Task deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}