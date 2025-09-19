import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const equipAvatarSchema = z.object({
  userAvatarId: z.string(),
});

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
    const { userAvatarId } = equipAvatarSchema.parse(body);

    // Get the user avatar and verify ownership
    const userAvatar = await db.userAvatar.findUnique({
      where: { id: userAvatarId },
      include: {
        avatarItem: true,
      },
    });

    if (!userAvatar) {
      return NextResponse.json(
        { error: "Item de avatar no encontrado" },
        { status: 404 }
      );
    }

    if (userAvatar.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para equipar este item" },
        { status: 403 }
      );
    }

    // Deactivate all other avatars of the same type
    await db.userAvatar.updateMany({
      where: {
        userId: session.user.id,
        avatarItem: {
          type: userAvatar.avatarItem.type,
        },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Activate the selected avatar
    const updatedUserAvatar = await db.userAvatar.update({
      where: { id: userAvatarId },
      data: {
        isActive: true,
      },
      include: {
        avatarItem: true,
      },
    });

    return NextResponse.json({
      message: "Avatar equipado exitosamente",
      userAvatar: updatedUserAvatar,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al equipar avatar:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}