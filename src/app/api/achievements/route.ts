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

    // Get user's achievements
    const userAchievements = await db.userAchievement.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        achievement: true,
      },
      orderBy: {
        earnedAt: "desc",
      },
    });

    // Get available achievements (not earned by user)
    const earnedAchievementIds = userAchievements.map(ua => ua.achievementId);
    const availableAchievements = await db.achievement.findMany({
      where: {
        id: {
          notIn: earnedAchievementIds,
        },
      },
      orderBy: {
        xpThreshold: "asc",
      },
    });

    return NextResponse.json({
      userAchievements,
      availableAchievements,
    });
  } catch (error) {
    console.error("Error al obtener logros:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}