import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const respondInvitationSchema = z.object({
  invitationId: z.string(),
  action: z.enum(["ACCEPT", "REJECT"]),
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

    // Get invitations for the user
    const invitations = await db.teamInvitation.findMany({
      where: {
        receiverId: session.user.id,
        status: "PENDING",
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        sender: {
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
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error al obtener invitaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

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
    const { invitationId, action } = respondInvitationSchema.parse(body);

    // Find the invitation
    const invitation = await db.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        team: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitación no encontrada" },
        { status: 404 }
      );
    }

    // Check if the invitation belongs to the user
    if (invitation.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para responder esta invitación" },
        { status: 403 }
      );
    }

    if (action === "ACCEPT") {
      // Update invitation status
      await db.teamInvitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" },
      });

      // Add user to team
      await db.teamMember.create({
        data: {
          userId: session.user.id,
          teamId: invitation.teamId,
          role: "MEMBER",
        },
      });

      return NextResponse.json(
        { message: "Invitación aceptada exitosamente" },
        { status: 200 }
      );
    } else {
      // Reject invitation
      await db.teamInvitation.update({
        where: { id: invitationId },
        data: { status: "REJECTED" },
      });

      return NextResponse.json(
        { message: "Invitación rechazada" },
        { status: 200 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al responder invitación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}