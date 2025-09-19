import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateWellnessSchema = z.object({
  socialBattery: z.number().min(0).max(100),
  mood: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
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

    // Get wellness metrics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const wellnessMetrics = await db.wellnessMetric.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json({ wellnessMetrics });
  } catch (error) {
    console.error("Error al obtener métricas de bienestar:", error);
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

    const body = await request.json();
    const { socialBattery, mood, notes } = updateWellnessSchema.parse(body);

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's already a metric for today
    const existingMetric = await db.wellnessMetric.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
    });

    let wellnessMetric;

    if (existingMetric) {
      // Update existing metric
      wellnessMetric = await db.wellnessMetric.update({
        where: {
          id: existingMetric.id,
        },
        data: {
          socialBattery,
          mood,
          notes,
        },
      });
    } else {
      // Create new metric
      wellnessMetric = await db.wellnessMetric.create({
        data: {
          userId: session.user.id,
          date: today,
          socialBattery,
          mood,
          notes,
        },
      });
    }

    // Also update user's current social battery and mood
    await db.user.update({
      where: { id: session.user.id },
      data: {
        socialBattery,
        mood,
      },
    });

    return NextResponse.json(
      { 
        message: "Métricas de bienestar actualizadas exitosamente",
        wellnessMetric 
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al actualizar métricas de bienestar:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}