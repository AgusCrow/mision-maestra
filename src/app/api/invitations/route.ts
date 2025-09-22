import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { teamId, inviteeId, inviterId, message } = await request.json();

    // Validate input
    if (!teamId || !inviteeId || !inviterId) {
      return NextResponse.json(
        { error: 'Team ID, invitee ID, and inviter ID are required' },
        { status: 400 }
      );
    }

    // Check if team exists
    const team = await db.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if inviter is a member of the team
    const inviterMembership = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: inviterId,
          teamId: teamId,
        }
      }
    });

    if (!inviterMembership || !inviterMembership.isActive) {
      return NextResponse.json(
        { error: 'You must be a team member to send invitations' },
        { status: 403 }
      );
    }

    // Check if invitee exists
    const invitee = await db.user.findUnique({
      where: { id: inviteeId }
    });

    if (!invitee) {
      return NextResponse.json(
        { error: 'Invitee not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMembership = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: inviteeId,
          teamId: teamId,
        }
      }
    });

    if (existingMembership && existingMembership.isActive) {
      return NextResponse.json(
        { error: 'User is already a member of this team' },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const existingInvitation = await db.invitation.findFirst({
      where: {
        teamId: teamId,
        inviteeId: inviteeId,
        status: 'PENDING',
      }
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'User already has a pending invitation to this team' },
        { status: 400 }
      );
    }

    // Create invitation
    const invitation = await db.invitation.create({
      data: {
        teamId,
        inviteeId,
        inviterId,
        message,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          }
        },
        invitee: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        },
        inviter: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        }
      }
    });

    // Log invitation creation
    await db.serverLog.create({
      data: {
        level: 'INFO',
        message: `Invitation sent: ${invitee.username} to team ${team.name} by ${invitation.inviter.username}`,
        userId: inviterId,
      }
    });

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitation,
    });
  } catch (error) {
    console.error('Invitation creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get invitations where user is the invitee
    const invitations = await db.invitation.findMany({
      where: {
        inviteeId: userId,
        status: 'PENDING',
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        },
        inviter: {
          select: {
            id: true,
            username: true,
            displayName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return NextResponse.json({
      invitations,
      count: invitations.length,
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}