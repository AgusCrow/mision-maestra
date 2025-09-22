import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { invitationId, userId, action } = await request.json();

    // Validate input
    if (!invitationId || !userId || !action) {
      return NextResponse.json(
        { error: 'Invitation ID, user ID, and action are required' },
        { status: 400 }
      );
    }

    if (!['ACCEPTED', 'REJECTED'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either ACCEPTED or REJECTED' },
        { status: 400 }
      );
    }

    // Check if invitation exists and belongs to user
    const invitation = await db.invitation.findUnique({
      where: { id: invitationId },
      include: {
        team: true,
        invitee: true,
        inviter: true,
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    if (invitation.inviteeId !== userId) {
      return NextResponse.json(
        { error: 'You can only respond to your own invitations' },
        { status: 403 }
      );
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This invitation has already been responded to' },
        { status: 400 }
      );
    }

    // Update invitation status
    const updatedInvitation = await db.invitation.update({
      where: { id: invitationId },
      data: {
        status: action,
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

    // If accepted, add user to team
    if (action === 'ACCEPTED') {
      await db.teamMember.create({
        data: {
          userId: userId,
          teamId: invitation.teamId,
          role: 'MEMBER',
        }
      });

      // Log team join
      await db.serverLog.create({
        data: {
          level: 'INFO',
          message: `User joined team: ${invitation.invitee.username} joined ${invitation.team.name}`,
          userId: userId,
        }
      });
    }

    // Log invitation response
    await db.serverLog.create({
      data: {
        level: 'INFO',
        message: `Invitation ${action.toLowerCase()}: ${invitation.invitee.username} ${action.toLowerCase()} invitation to ${invitation.team.name}`,
        userId: userId,
      }
    });

    return NextResponse.json({
      message: `Invitation ${action.toLowerCase()} successfully`,
      invitation: updatedInvitation,
    });
  } catch (error) {
    console.error('Invitation response error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}