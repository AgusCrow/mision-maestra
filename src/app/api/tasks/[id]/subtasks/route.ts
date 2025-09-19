import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSubtaskSchema = z.object({
  title: z.string().min(1).max(200),
});

const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
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

    const subtasks = await db.subtask.findMany({
      where: { taskId: params.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ subtasks });
  } catch (error) {
    console.error("Error al obtener subtareas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Check if user has permission to add subtasks
    if (task.isPersonal && task.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para agregar subtareas" },
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
    const { title } = createSubtaskSchema.parse(body);

    const subtask = await db.subtask.create({
      data: {
        taskId: params.id,
        title,
      },
    });

    return NextResponse.json({
      message: "Subtarea creada exitosamente",
      subtask,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al crear subtarea:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}