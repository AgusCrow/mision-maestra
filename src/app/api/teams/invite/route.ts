import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const inviteSchema = z.object({
  teamId: z.string(),
  email: z.string().email(),
  message: z.string().max(200).optional(),
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
    const { teamId, email, message } = inviteSchema.parse(body);

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
        { error: "No tienes permisos para invitar miembros a este equipo" },
        { status: 403 }
      );
    }

    // Find user to invite
    const userToInvite = await db.user.findUnique({
      where: { email },
    });

    if (!userToInvite) {
      return NextResponse.json(
        { error: "No se encontró un usuario con ese email" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: userToInvite.id,
          teamId: teamId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "El usuario ya es miembro de este equipo" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const existingInvitation = await db.teamInvitation.findFirst({
      where: {
        teamId: teamId,
        receiverId: userToInvite.id,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Ya hay una invitación pendiente para este usuario" },
        { status: 400 }
      );
    }

    // Create invitation
    const invitation = await db.teamInvitation.create({
      data: {
        teamId,
        senderId: session.user.id,
        receiverId: userToInvite.id,
        message,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Invitación enviada exitosamente", invitation },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al enviar invitación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}