import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const assignTaskSchema = z.object({
  userId: z.string(),
});

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

    // Only team tasks can be assigned
    if (!task.teamId) {
      return NextResponse.json(
        { error: "Solo las tareas de equipo pueden ser asignadas" },
        { status: 400 }
      );
    }

    // Check if user is a member of the team and has permission to assign
    const assignerMember = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: task.teamId,
        },
      },
    });

    if (!assignerMember) {
      return NextResponse.json(
        { error: "No eres miembro de este equipo" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = assignTaskSchema.parse(body);

    // Check if the user to assign is a member of the team
    const targetMember = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: userId,
          teamId: task.teamId,
        },
      },
    });

    if (!targetMember) {
      return NextResponse.json(
        { error: "El usuario no es miembro de este equipo" },
        { status: 400 }
      );
    }

    // Check if task is already assigned to this user
    const existingAssignment = await db.taskAssignment.findUnique({
      where: {
        taskId_userId: {
          taskId: params.id,
          userId: userId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "La tarea ya está asignada a este usuario" },
        { status: 400 }
      );
    }

    // Create the assignment
    const assignment = await db.taskAssignment.create({
      data: {
        taskId: params.id,
        userId: userId,
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
        task: {
          select: {
            id: true,
            title: true,
            xp: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Tarea asignada exitosamente",
      assignment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al asignar tarea:", error);
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Se requiere el ID del usuario" },
        { status: 400 }
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

    // Check if user has permission to unassign
    const assignerMember = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: session.user.id,
          teamId: task.teamId!,
        },
      },
    });

    if (!assignerMember) {
      return NextResponse.json(
        { error: "No eres miembro de este equipo" },
        { status: 403 }
      );
    }

    // Users can unassign themselves, or leaders can unassign anyone
    if (session.user.id !== userId && assignerMember.role !== "LEADER") {
      return NextResponse.json(
        { error: "No tienes permiso para desasignar esta tarea" },
        { status: 403 }
      );
    }

    // Delete the assignment
    await db.taskAssignment.delete({
      where: {
        taskId_userId: {
          taskId: params.id,
          userId: userId,
        },
      },
    });

    return NextResponse.json({
      message: "Asignación eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar asignación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}