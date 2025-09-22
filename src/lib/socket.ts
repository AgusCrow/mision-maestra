import { Server } from 'socket.io';
import { db } from '@/lib/db';

interface UserSocket {
  userId: string;
  socketId: string;
  username: string;
}

// Store connected users
const connectedUsers = new Map<string, UserSocket>();

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle user authentication
    socket.on('user:authenticate', async (data: { userId: string; username: string }) => {
      try {
        // Update user status in database
        await db.user.update({
          where: { id: data.userId },
          data: {
            isOnline: true,
            lastSeen: new Date(),
          }
        });

        // Store user connection
        connectedUsers.set(socket.id, {
          userId: data.userId,
          socketId: socket.id,
          username: data.username,
        });

        // Join user to their personal room
        socket.join(`user:${data.userId}`);

        // Broadcast updated online users list
        await broadcastOnlineUsers(io);

        // Send success response
        socket.emit('user:authenticated', {
          success: true,
          message: 'Successfully connected to real-time services',
        });

        console.log(`User ${data.username} (${data.userId}) authenticated`);
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('user:authenticated', {
          success: false,
          message: 'Authentication failed',
        });
      }
    });

    // Handle request for online users
    socket.on('users:online', async () => {
      try {
        const onlineUsers = await db.user.findMany({
          where: { isOnline: true },
          select: {
            id: true,
            username: true,
            displayName: true,
            level: true,
            experience: true,
            points: true,
            avatar: true,
            lastSeen: true,
          },
        });

        socket.emit('users:online:list', {
          users: onlineUsers,
          count: onlineUsers.length,
        });
      } catch (error) {
        console.error('Error fetching online users:', error);
        socket.emit('users:online:list', {
          users: [],
          count: 0,
          error: 'Failed to fetch online users',
        });
      }
    });

    // Handle team-related events
    socket.on('join-team', async (data: { teamId: string }) => {
      try {
        socket.join(`team-${data.teamId}`);
        socket.emit('team-joined', {
          success: true,
          teamId: data.teamId,
        });
        
        console.log(`User ${socket.id} joined team ${data.teamId}`);
      } catch (error) {
        console.error('Team join error:', error);
        socket.emit('team-joined', {
          success: false,
          error: 'Failed to join team',
        });
      }
    });

    socket.on('leave-team', async (data: { teamId: string }) => {
      try {
        socket.leave(`team-${data.teamId}`);
        socket.emit('team-left', {
          success: true,
          teamId: data.teamId,
        });
        
        console.log(`User ${socket.id} left team ${data.teamId}`);
      } catch (error) {
        console.error('Team leave error:', error);
        socket.emit('team-left', {
          success: false,
          error: 'Failed to leave team',
        });
      }
    });

    // Handle getting team members
    socket.on('get-team-members', async (data: { teamId: string }) => {
      try {
        const teamMembers = await db.teamMember.findMany({
          where: {
            teamId: data.teamId,
            isActive: true,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
                level: true,
                coins: true,
                experience: true,
                isOnline: true,
                currentActivity: true,
                mood: true,
                socialBattery: true,
              }
            }
          }
        });

        const formattedMembers = teamMembers.map(member => ({
          id: member.user.id,
          name: member.user.displayName || member.user.username,
          email: member.user.email,
          level: member.user.level,
          role: member.role,
          isOnline: member.user.isOnline,
          currentActivity: member.user.currentActivity,
          mood: member.user.mood,
          socialBattery: member.user.socialBattery,
          coins: member.user.coins,
          experience: member.user.experience,
        }));

        socket.emit('team-members-update', formattedMembers);
      } catch (error) {
        console.error('Error getting team members:', error);
        socket.emit('team-members-update', []);
      }
    });

    // Handle member status updates
    socket.on('update-member-activity', async (data: { teamId: string; userId: string; activity: string }) => {
      try {
        // Update user activity in database
        await db.user.update({
          where: { id: data.userId },
          data: {
            currentActivity: data.activity,
          }
        });

        // Broadcast to team members
        socket.to(`team-${data.teamId}`).emit('member-activity-update', {
          userId: data.userId,
          activity: data.activity,
        });

        socket.emit('member-activity-updated', {
          success: true,
          activity: data.activity,
        });
      } catch (error) {
        console.error('Error updating member activity:', error);
        socket.emit('member-activity-updated', {
          success: false,
          error: 'Failed to update activity',
        });
      }
    });

    socket.on('update-member-mood', async (data: { teamId: string; userId: string; mood: string }) => {
      try {
        // Update user mood in database
        await db.user.update({
          where: { id: data.userId },
          data: {
            mood: data.mood,
          }
        });

        // Broadcast to team members
        socket.to(`team-${data.teamId}`).emit('member-mood-update', {
          userId: data.userId,
          mood: data.mood,
        });

        socket.emit('member-mood-updated', {
          success: true,
          mood: data.mood,
        });
      } catch (error) {
        console.error('Error updating member mood:', error);
        socket.emit('member-mood-updated', {
          success: false,
          error: 'Failed to update mood',
        });
      }
    });

    socket.on('update-social-battery', async (data: { teamId: string; userId: string; battery: number }) => {
      try {
        // Update user social battery in database
        await db.user.update({
          where: { id: data.userId },
          data: {
            socialBattery: data.battery,
          }
        });

        // Broadcast to team members
        socket.to(`team-${data.teamId}`).emit('social-battery-update', {
          userId: data.userId,
          battery: data.battery,
        });

        socket.emit('social-battery-updated', {
          success: true,
          battery: data.battery,
        });
      } catch (error) {
        console.error('Error updating social battery:', error);
        socket.emit('social-battery-updated', {
          success: false,
          error: 'Failed to update social battery',
        });
      }
    });

    // Handle task updates
    socket.on('task:update', async (data: { taskId: string; status: string; teamId: string }) => {
      try {
        // Broadcast to team members
        io.to(`team:${data.teamId}`).emit('task:updated', {
          taskId: data.taskId,
          status: data.status,
          updatedAt: new Date().toISOString(),
        });
        
        console.log(`Task ${data.taskId} updated to ${data.status} in team ${data.teamId}`);
      } catch (error) {
        console.error('Task update error:', error);
      }
    });

    // Handle new task creation
    socket.on('task:created', async (data: { task: any; teamId: string }) => {
      try {
        // Broadcast to team members
        io.to(`team:${data.teamId}`).emit('task:created', {
          task: data.task,
          createdAt: new Date().toISOString(),
        });
        
        console.log(`New task created in team ${data.teamId}`);
      } catch (error) {
        console.error('Task creation error:', error);
      }
    });

    // Handle messages
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only the client who send the message
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);
      
      const userSocket = connectedUsers.get(socket.id);
      if (userSocket) {
        try {
          // Update user status in database
          await db.user.update({
            where: { id: userSocket.userId },
            data: {
              isOnline: false,
              lastSeen: new Date(),
            }
          });

          // Remove from connected users
          connectedUsers.delete(socket.id);

          // Broadcast updated online users list
          await broadcastOnlineUsers(io);

          console.log(`User ${userSocket.username} (${userSocket.userId}) disconnected`);
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      }
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to Team Todo Quest Real-time Services!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};

// Helper function to broadcast online users
const broadcastOnlineUsers = async (io: Server) => {
  try {
    const onlineUsers = await db.user.findMany({
      where: { isOnline: true },
      select: {
        id: true,
        username: true,
        displayName: true,
        level: true,
        experience: true,
        points: true,
        avatar: true,
        lastSeen: true,
      },
    });

    io.emit('users:online:list', {
      users: onlineUsers,
      count: onlineUsers.length,
    });
  } catch (error) {
    console.error('Error broadcasting online users:', error);
  }
};

// Export helper functions for external use
export const getConnectedUsers = () => {
  return Array.from(connectedUsers.values());
};

export const isUserConnected = (userId: string) => {
  return Array.from(connectedUsers.values()).some(user => user.userId === userId);
};