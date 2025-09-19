import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  targetXP: z.number().min(1).max(10000),
  deadline: z.string().optional(),
  teamId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "Se requiere el ID del equipo" },
        { status: 400 }
      );
    }

    // Check if user is member of the team
    const teamMember = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: teamId,
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "No eres miembro de este equipo" },
        { status: 403 }
      );
    }

    const goals = await db.goal.findMany({
      where: {
        teamId: teamId,
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
            assignments: {
              where: {
                completed: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate progress for each goal
    const goalsWithProgress = goals.map(goal => {
      const completedTasksXP = goal.tasks
        .filter(task => task.status === "COMPLETED")
        .reduce((sum, task) => sum + task.xp, 0);
      
      const progressPercentage = Math.min((goal.currentXP / goal.targetXP) * 100, 100);
      
      return {
        ...goal,
        completedTasksXP,
        progressPercentage,
        taskCount: goal.tasks.length,
        completedTaskCount: goal.tasks.filter(task => task.status === "COMPLETED").length,
      };
    });

    return NextResponse.json({ goals: goalsWithProgress });
  } catch (error) {
    console.error("Error al obtener objetivos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, targetXP, deadline, teamId } = createGoalSchema.parse(body);

    // Check if user is team leader
    const teamMember = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: teamId,
        },
      },
    });

    if (!teamMember || teamMember.role !== "LEADER") {
      return NextResponse.json(
        { error: "Solo los líderes pueden crear objetivos" },
        { status: 403 }
      );
    }

    // Create goal
    const goal = await db.goal.create({
      data: {
        title,
        description,
        targetXP,
        deadline: deadline ? new Date(deadline) : null,
        teamId,
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

    return NextResponse.json(
      { message: "Objetivo creado exitosamente", goal },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al crear objetivo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}