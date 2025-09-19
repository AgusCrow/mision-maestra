import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createTeamSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
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

    // Get teams where user is a member
    const teams = await db.teamMember.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        team: {
          include: {
            members: {
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
            },
            _count: {
              select: {
                tasks: true,
                goals: true,
              },
            },
          },
        },
      },
    });

    const formattedTeams = teams.map(teamMember => ({
      ...teamMember.team,
      userRole: teamMember.role,
      memberCount: teamMember.team.members.length,
      taskCount: teamMember.team._count.tasks,
      goalCount: teamMember.team._count.goals,
    }));

    return NextResponse.json({ teams: formattedTeams });
  } catch (error) {
    console.error("Error al obtener equipos:", error);
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
    const { name, description } = createTeamSchema.parse(body);

    // Create team
    const team = await db.team.create({
      data: {
        name,
        description,
        leaderId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "LEADER",
          },
        },
      },
      include: {
        members: {
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
        },
      },
    });

    return NextResponse.json(
      { message: "Equipo creado exitosamente", team },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error al crear equipo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}