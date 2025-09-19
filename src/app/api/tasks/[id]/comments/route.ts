import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
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

    const comments = await db.taskComment.findMany({
      where: { taskId: params.id },
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
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error al obtener comentarios:", error);
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

    const body = await request.json();
    const { content } = createCommentSchema.parse(body);

    const comment = await db.taskComment.create({
      data: {
        taskId: params.id,
        userId: session.user.id,
        content,
      },
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
    });

    return NextResponse.json({
      message: "Comentario agregado exitosamente",
      comment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al crear comentario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}