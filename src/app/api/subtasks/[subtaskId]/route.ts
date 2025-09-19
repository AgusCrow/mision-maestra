import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { subtaskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const subtask = await db.subtask.findUnique({
      where: { id: params.subtaskId },
      include: {
        task: true,
      },
    });

    if (!subtask) {
      return NextResponse.json(
        { error: "Subtarea no encontrada" },
        { status: 404 }
      );
    }

    // Check if user has permission to update this subtask
    if (subtask.task.isPersonal && subtask.task.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para actualizar esta subtarea" },
        { status: 403 }
      );
    }

    if (subtask.task.teamId) {
      const teamMember = await db.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: session.user.id,
            teamId: subtask.task.teamId,
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
    const validatedData = updateSubtaskSchema.parse(body);

    const updatedSubtask = await db.subtask.update({
      where: { id: params.subtaskId },
      data: validatedData,
    });

    return NextResponse.json({
      message: "Subtarea actualizada exitosamente",
      subtask: updatedSubtask,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al actualizar subtarea:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { subtaskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const subtask = await db.subtask.findUnique({
      where: { id: params.subtaskId },
      include: {
        task: true,
      },
    });

    if (!subtask) {
      return NextResponse.json(
        { error: "Subtarea no encontrada" },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this subtask
    if (subtask.task.isPersonal && subtask.task.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar esta subtarea" },
        { status: 403 }
      );
    }

    if (subtask.task.teamId) {
      const teamMember = await db.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: session.user.id,
            teamId: subtask.task.teamId,
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

    await db.subtask.delete({
      where: { id: params.subtaskId },
    });

    return NextResponse.json({
      message: "Subtarea eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar subtarea:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}