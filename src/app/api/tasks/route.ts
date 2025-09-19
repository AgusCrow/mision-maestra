import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  xp: z.number().min(1).max(1000).default(10),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  category: z.string().max(50).optional(),
  isPersonal: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(["daily", "weekly", "monthly"]).optional(),
  teamId: z.string().optional(),
  goalId: z.string().optional(),
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
    const isPersonal = searchParams.get("isPersonal") === "true";

    let tasks;

    if (teamId) {
      // Get tasks for a specific team
      tasks = await db.task.findMany({
        where: {
          teamId: teamId,
          isPersonal: false,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
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
                  email: true,
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
          goal: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (isPersonal) {
      // Get personal tasks
      tasks = await db.task.findMany({
        where: {
          creatorId: session.user.id,
          isPersonal: true,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
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
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      // Get all tasks for user (personal and assigned team tasks)
      tasks = await db.task.findMany({
        where: {
          OR: [
            {
              creatorId: session.user.id,
              isPersonal: true,
            },
            {
              assignments: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          ],
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
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
                  email: true,
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
          goal: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error al obtener tareas:", error);
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
    const taskData = createTaskSchema.parse(body);

    // If it's a team task, check if user is a member of the team
    if (taskData.teamId && !taskData.isPersonal) {
      const teamMember = await db.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: session.user.id,
            teamId: taskData.teamId,
          },
        },
      });

      if (!teamMember) {
        return NextResponse.json(
          { error: "No eres miembro de este equipo" },
          { status: 403 }
        );
      }
    }

    // Create task
    const task = await db.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        xp: taskData.xp,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        priority: taskData.priority,
        category: taskData.category,
        isPersonal: taskData.isPersonal,
        isRecurring: taskData.isRecurring,
        recurringInterval: taskData.recurringInterval,
        creatorId: session.user.id,
        teamId: taskData.teamId,
        goalId: taskData.goalId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
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
                email: true,
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
        },
        goal: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Tarea creada exitosamente", task },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al crear tarea:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}