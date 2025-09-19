import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Get all avatar items
    const avatarItems = await db.avatarItem.findMany({
      orderBy: {
        xpCost: "asc",
      },
    });

    // Get user's purchased avatar items
    const userAvatars = await db.userAvatar.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        avatarItem: true,
      },
    });

    // Get user's current XP
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { totalXP: true },
    });

    return NextResponse.json({
      avatarItems,
      userAvatars,
      userXP: user?.totalXP || 0,
    });
  } catch (error) {
    console.error("Error al obtener tienda de avatares:", error);
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

    const { avatarItemId } = await request.json();

    if (!avatarItemId) {
      return NextResponse.json(
        { error: "Se requiere el ID del item de avatar" },
        { status: 400 }
      );
    }

    // Get avatar item and user
    const [avatarItem, user] = await Promise.all([
      db.avatarItem.findUnique({
        where: { id: avatarItemId },
      }),
      db.user.findUnique({
        where: { id: session.user.id },
      }),
    ]);

    if (!avatarItem) {
      return NextResponse.json(
        { error: "Item de avatar no encontrado" },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Check if user already owns this item
    const existingUserAvatar = await db.userAvatar.findUnique({
      where: {
        userId_avatarItemId: {
          userId: session.user.id,
          avatarItemId: avatarItemId,
        },
      },
    });

    if (existingUserAvatar) {
      return NextResponse.json(
        { error: "Ya posees este item de avatar" },
        { status: 400 }
      );
    }

    // Check if user has enough XP
    if (user.totalXP < avatarItem.xpCost) {
      return NextResponse.json(
        { error: "No tienes suficiente XP para comprar este item" },
        { status: 400 }
      );
    }

    // Purchase the avatar item
    await Promise.all([
      // Deduct XP from user
      db.user.update({
        where: { id: session.user.id },
        data: {
          totalXP: {
            decrement: avatarItem.xpCost,
          },
        },
      }),
      // Add to user's avatar items
      db.userAvatar.create({
        data: {
          userId: session.user.id,
          avatarItemId: avatarItemId,
          isActive: false, // Don't activate by default
        },
      }),
    ]);

    return NextResponse.json({
      message: "Item de avatar comprado exitosamente",
      avatarItem,
      newXP: user.totalXP - avatarItem.xpCost,
    });
  } catch (error) {
    console.error("Error al comprar item de avatar:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}