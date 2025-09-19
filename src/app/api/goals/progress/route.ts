import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateGoalProgressSchema = z.object({
  goalId: z.string(),
  xpToAdd: z.number().min(1),
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
    const { goalId, xpToAdd } = updateGoalProgressSchema.parse(body);

    // Find the goal and check permissions
    const goal = await db.goal.findUnique({
      where: { id: goalId },
      include: {
        team: true,
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: "Objetivo no encontrado" },
        { status: 404 }
      );
    }

    // Check if user is member of the team
    const teamMember = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: goal.teamId,
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "No eres miembro de este equipo" },
        { status: 403 }
      );
    }

    // Update goal progress
    const updatedGoal = await db.goal.update({
      where: { id: goalId },
      data: {
        currentXP: {
          increment: xpToAdd,
        },
        // Check if goal is completed
        status: goal.currentXP + xpToAdd >= goal.targetXP ? "COMPLETED" : "ACTIVE",
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            xp: true,
            status: true,
          },
        },
      },
    });

    // Calculate progress
    const progressPercentage = Math.min((updatedGoal.currentXP / updatedGoal.targetXP) * 100, 100);
    const completedTasksXP = updatedGoal.tasks
      .filter(task => task.status === "COMPLETED")
      .reduce((sum, task) => sum + task.xp, 0);

    const goalWithProgress = {
      ...updatedGoal,
      progressPercentage,
      completedTasksXP,
      taskCount: updatedGoal.tasks.length,
      completedTaskCount: updatedGoal.tasks.filter(task => task.status === "COMPLETED").length,
    };

    // If goal was just completed, award bonus XP to team members
    if (goal.status !== "COMPLETED" && updatedGoal.status === "COMPLETED") {
      const bonusXP = Math.floor(updatedGoal.targetXP * 0.1); // 10% bonus
      
      // Get all team members
      const teamMembers = await db.teamMember.findMany({
        where: { teamId: goal.teamId },
        include: {
          user: true,
        },
      });

      // Award bonus XP to all team members
      await Promise.all(
        teamMembers.map(member =>
          db.user.update({
            where: { id: member.userId },
            data: {
              totalXP: {
                increment: bonusXP,
              },
              level: {
                increment: Math.floor(bonusXP / 100),
              },
            },
          })
        )
      );

      return NextResponse.json({
        message: "¡Objetivo completado! Bonus XP otorgado al equipo",
        goal: goalWithProgress,
        bonusXP,
        isCompleted: true,
      });
    }

    return NextResponse.json({
      message: "Progreso del objetivo actualizado",
      goal: goalWithProgress,
      isCompleted: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al actualizar progreso del objetivo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}