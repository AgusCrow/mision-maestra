import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const completeTaskSchema = z.object({
  taskId: z.string(),
  completed: z.boolean(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { taskId, completed } = completeTaskSchema.parse(body);

    // Find the task and check if user is assigned
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: {
          where: {
            userId: session.user.id,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Check if user is assigned to the task or is the creator (for personal tasks)
    const isAssigned = task.assignments.length > 0;
    const isCreator = task.creatorId === session.user.id;

    if (!isAssigned && !(task.isPersonal && isCreator)) {
      return NextResponse.json(
        { error: "No tienes permisos para completar esta tarea" },
        { status: 403 }
      );
    }

    // Update task assignment completion
    let assignment;
    if (isAssigned) {
      assignment = await db.taskAssignment.update({
        where: {
          taskId_userId: {
            taskId,
            userId: session.user.id,
          },
        },
        data: {
          completed,
          completedAt: completed ? new Date() : null,
        },
      });
    }

    // If task is personal and being completed, update task status
    if (task.isPersonal && isCreator) {
      await db.task.update({
        where: { id: taskId },
        data: {
          status: completed ? "COMPLETED" : "IN_PROGRESS",
        },
      });
    }

    // If task is being completed, award XP to the user
    if (completed && !assignment?.completed) {
      const xpGained = task.xp;
      
      // Update user XP and level
      const updatedUser = await db.user.update({
        where: { id: session.user.id },
        data: {
          totalXP: {
            increment: xpGained,
          },
          // Simple level calculation: every 100 XP = 1 level
          level: {
            increment: Math.floor((task.creatorId === session.user.id ? xpGained : xpGained / 2) / 100),
          },
        },
      });

      // If it's a team task, also update team XP
      if (!task.isPersonal && task.teamId) {
        await db.team.update({
          where: { id: task.teamId },
          data: {
            totalXP: {
              increment: Math.floor(xpGained / 2), // Half XP goes to team
            },
          },
        });
      }

      return NextResponse.json({
        message: "Tarea completada exitosamente",
        xpGained,
        newLevel: updatedUser.level,
        totalXP: updatedUser.totalXP,
      });
    }

    return NextResponse.json({
      message: completed ? "Tarea completada" : "Tarea marcada como incompleta",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al actualizar estado de tarea:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}