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
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(["daily", "weekly", "monthly"]).optional(),
  goalId: z.string().optional(),
});

export async function GET(
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

    const task = await db.task.findUnique({
      where: { id: params.id },
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
        comments: {
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
          orderBy: { createdAt: "asc" },
        },
        subtasks: {
          orderBy: { createdAt: "asc" },
        },
        goal: {
          select: {
            id: true,
            title: true,
          },
        },
        attachments: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Check if user has access to this task
    if (task.isPersonal && task.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes acceso a esta tarea" },
        { status: 403 }
      );
    }

    if (task.teamId) {
      const teamMember = await db.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: session.user.id,
            teamId: task.teamId,
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

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error al obtener tarea:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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

    const task = await db.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Check if user has permission to edit this task
    if (task.isPersonal && task.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para editar esta tarea" },
        { status: 403 }
      );
    }

    if (task.teamId) {
      const teamMember = await db.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: session.user.id,
            teamId: task.teamId,
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

    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Convert dueDate string to Date if provided
    const updateData: any = { ...validatedData };
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }

    const updatedTask = await db.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        team: task.teamId ? {
          select: {
            id: true,
            name: true,
          },
        } : false,
        goal: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Tarea actualizada exitosamente",
      task: updatedTask,
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

    const task = await db.task.findUnique({
      where: { id: params.id },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this task
    if (task.isPersonal && task.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar esta tarea" },
        { status: 403 }
      );
    }

    if (task.teamId) {
      const teamMember = await db.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: session.user.id,
            teamId: task.teamId,
          },
        },
      });

      if (!teamMember || teamMember.role !== "LEADER") {
        return NextResponse.json(
          { error: "Solo los líderes pueden eliminar tareas del equipo" },
          { status: 403 }
        );
      }
    }

    await db.task.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: "Tarea eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}