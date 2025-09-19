import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const assignTaskSchema = z.object({
  taskId: z.string(),
  userIds: z.array(z.string()),
});

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
    const { taskId, userIds } = assignTaskSchema.parse(body);

    // Check if task exists and user has permission
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        team: true,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Check permissions
    if (task.isPersonal) {
      if (task.creatorId !== session.user.id) {
        return NextResponse.json(
          { error: "No tienes permisos para asignar esta tarea" },
          { status: 403 }
        );
      }
    } else {
      // For team tasks, check if user is team leader or task creator
      const teamMember = await db.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: session.user.id,
            teamId: task.teamId!,
          },
        },
      });

      if (!teamMember || (teamMember.role !== "LEADER" && task.creatorId !== session.user.id)) {
        return NextResponse.json(
          { error: "No tienes permisos para asignar esta tarea" },
          { status: 403 }
        );
      }
    }

    // Remove existing assignments
    await db.taskAssignment.deleteMany({
      where: { taskId },
    });

    // Create new assignments
    const assignments = await Promise.all(
      userIds.map(userId =>
        db.taskAssignment.create({
          data: {
            taskId,
            userId,
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
        })
      )
    );

    return NextResponse.json(
      { message: "Tarea asignada exitosamente", assignments },
      { status: 200 }
    );
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