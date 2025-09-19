import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  xp: z.number().min(1).max(1000).optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  category: z.string().max(50).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  assignedUserIds: z.array(z.string()).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updateData = updateTaskSchema.parse(body);

    // Find the task
    const task = await db.task.findUnique({
      where: { id: params.id },
      include: {
        assignments: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Check permissions
    const isCreator = task.creatorId === session.user.id;
    const isAssigned = task.assignments.some(assignment => assignment.userId === session.user.id);
    const isTeamMember = task.teamId ? await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: task.teamId!,
        },
      },
    }) : false;

    if (!isCreator && !isAssigned && !isTeamMember) {
      return NextResponse.json(
        { error: "No tienes permisos para actualizar esta tarea" },
        { status: 403 }
      );
    }

    // Handle task completion and XP calculation
    let xpToAward = 0;
    const wasCompleted = task.status === "COMPLETED";
    const willBeCompleted = updateData.status === "COMPLETED";

    if (willBeCompleted && !wasCompleted) {
      // Task is being marked as completed
      xpToAward = task.xp;
      
      // Award XP to assigned users or creator
      const usersToAward = task.assignments.length > 0 
        ? task.assignments.map(a => a.userId)
        : [task.creatorId];

      for (const userId of usersToAward) {
        await db.user.update({
          where: { id: userId },
          data: {
            totalXP: {
              increment: xpToAward,
            },
          },
        });

        // Check if user should level up (simple level calculation: 100 XP per level)
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { totalXP: true, level: true },
        });

        if (user) {
          const newLevel = Math.floor(user.totalXP / 100) + 1;
          if (newLevel > user.level) {
            await db.user.update({
              where: { id: userId },
              data: { level: newLevel },
            });
          }
        }
      }

      // Update task assignment completion status
      if (task.assignments.length > 0) {
        await db.taskAssignment.updateMany({
          where: { taskId: task.id },
          data: {
            completed: true,
            completedAt: new Date(),
          },
        });
      }

      // Update team XP if it's a team task
      if (task.teamId) {
        await db.team.update({
          where: { id: task.teamId },
          data: {
            totalXP: {
              increment: xpToAward,
            },
          },
        });
      }
    }

    // Update task
    const updatedTask = await db.task.update({
      where: { id: params.id },
      data: {
        ...updateData,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        subtasks: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    // Handle assignment updates
    if (updateData.assignedUserIds !== undefined) {
      // Remove existing assignments
      await db.taskAssignment.deleteMany({
        where: { taskId: params.id },
      });

      // Create new assignments
      if (updateData.assignedUserIds.length > 0) {
        await db.taskAssignment.createMany({
          data: updateData.assignedUserIds.map(userId => ({
            taskId: params.id,
            userId,
          })),
        });

        // Fetch updated task with new assignments
        const finalTask = await db.task.findUnique({
          where: { id: params.id },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
              },
            },
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
            subtasks: true,
            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        });

        return NextResponse.json({
          message: "Tarea actualizada exitosamente",
          task: finalTask,
          xpAwarded: xpToAward,
        });
      }
    }

    return NextResponse.json({
      message: "Tarea actualizada exitosamente",
      task: updatedTask,
      xpAwarded: xpToAward,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al actualizar tarea:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Find the task
    const task = await db.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Check permissions (only creator or team leader can delete)
    const isCreator = task.creatorId === session.user.id;
    let isTeamLeader = false;

    if (task.teamId) {
      const teamMember = await db.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: session.user.id,
            teamId: task.teamId,
          },
        },
      });
      isTeamLeader = teamMember?.role === "LEADER";
    }

    if (!isCreator && !isTeamLeader) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar esta tarea" },
        { status: 403 }
      );
    }

    // Delete task (cascade will handle related records)
    await db.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "Tarea eliminada exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}