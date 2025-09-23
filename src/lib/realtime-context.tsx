'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signalRService } from './api/signalr';
import { useAuth } from './auth-context';

interface OnlineUser {
  id: string;
  userId: string;
  connectionId: string;
  lastActivity: string;
  isOnline: boolean;
  user: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    totalXP: number;
    level: number;
    socialBattery: number;
    mood?: string;
  };
}

interface TeamMessage {
  teamId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface TaskUpdate {
  taskId: string;
  updatedBy: string;
  updatedAt: string;
}

interface TaskCompletion {
  taskId: string;
  completedBy: string;
  xp: number;
  completedAt: string;
}

interface TeamInvitation {
  invitationId: string;
  teamId: string;
  teamName: string;
  senderId: string;
  message?: string;
  sentAt: string;
}

interface RealTimeContextType {
  onlineUsers: OnlineUser[];
  teamMessages: TeamMessage[];
  taskUpdates: TaskUpdate[];
  taskCompletions: TaskCompletion[];
  teamInvitations: TeamInvitation[];
  isConnected: boolean;
  joinTeam: (teamId: string) => Promise<void>;
  leaveTeam: (teamId: string) => Promise<void>;
  sendTeamMessage: (teamId: string, message: string) => Promise<void>;
  notifyTaskUpdated: (taskId: string) => Promise<void>;
  notifyTaskCompleted: (taskId: string) => Promise<void>;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

interface RealTimeProviderProps {
  children: ReactNode;
}

export function RealTimeProvider({ children }: RealTimeProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);
  const [taskUpdates, setTaskUpdates] = useState<TaskUpdate[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Set up SignalR event handlers
    const setupEventHandlers = () => {
      signalRService.onEvent('onUserConnected', (userId: string) => {
        setOnlineUsers(prev => {
          // Remove user if already exists (reconnection)
          const filtered = prev.filter(u => u.userId !== userId);
          return [...filtered, { 
            id: userId, 
            userId, 
            connectionId: '', 
            lastActivity: new Date().toISOString(), 
            isOnline: true,
            user: { id: userId, email: '', totalXP: 0, level: 1, socialBattery: 50 }
          }];
        });
      });

      signalRService.onEvent('onUserDisconnected', (userId: string) => {
        setOnlineUsers(prev => prev.filter(u => u.userId !== userId));
      });

      signalRService.onEvent('onUserStatusUpdated', (data) => {
        setOnlineUsers(prev => 
          prev.map(u => 
            u.userId === data.userId 
              ? { ...u, user: { ...u.user, socialBattery: data.socialBattery, mood: data.mood } }
              : u
          )
        );
      });

      signalRService.onEvent('onTeamMessageReceived', (data: TeamMessage) => {
        setTeamMessages(prev => [...prev, data].slice(-50)); // Keep last 50 messages
      });

      signalRService.onEvent('onTaskUpdated', (data: TaskUpdate) => {
        setTaskUpdates(prev => [data, ...prev].slice(0, 20)); // Keep last 20 updates
      });

      signalRService.onEvent('onTaskCompleted', (data: TaskCompletion) => {
        setTaskCompletions(prev => [data, ...prev].slice(0, 20)); // Keep last 20 completions
      });

      signalRService.onEvent('onTeamInvitationReceived', (data: TeamInvitation) => {
        setTeamInvitations(prev => [data, ...prev].slice(0, 10)); // Keep last 10 invitations
      });

      signalRService.onEvent('onReconnected', () => {
        setIsConnected(true);
      });

      signalRService.onEvent('onClose', () => {
        setIsConnected(false);
      });
    };

    setupEventHandlers();

    // Update connection state
    const updateConnectionState = () => {
      setIsConnected(signalRService.isConnected());
    };

    // Check connection state periodically
    const connectionInterval = setInterval(updateConnectionState, 1000);

    return () => {
      clearInterval(connectionInterval);
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Fetch initial online users when connected
    const fetchOnlineUsers = async () => {
      try {
        if (isConnected && isAuthenticated) {
          // This would be an API call to get online users
          // For now, we'll rely on SignalR events
        }
      } catch (error) {
        console.error('Failed to fetch online users:', error);
      }
    };

    fetchOnlineUsers();
  }, [isConnected, isAuthenticated]);

  const joinTeam = async (teamId: string) => {
    try {
      await signalRService.joinTeam(teamId);
    } catch (error) {
      console.error('Failed to join team:', error);
      throw error;
    }
  };

  const leaveTeam = async (teamId: string) => {
    try {
      await signalRService.leaveTeam(teamId);
    } catch (error) {
      console.error('Failed to leave team:', error);
      throw error;
    }
  };

  const sendTeamMessage = async (teamId: string, message: string) => {
    try {
      await signalRService.sendTeamMessage(teamId, message);
    } catch (error) {
      console.error('Failed to send team message:', error);
      throw error;
    }
  };

  const notifyTaskUpdated = async (taskId: string) => {
    try {
      await signalRService.notifyTaskUpdated(taskId);
    } catch (error) {
      console.error('Failed to notify task updated:', error);
      throw error;
    }
  };

  const notifyTaskCompleted = async (taskId: string) => {
    try {
      await signalRService.notifyTaskCompleted(taskId);
    } catch (error) {
      console.error('Failed to notify task completed:', error);
      throw error;
    }
  };

  const value: RealTimeContextType = {
    onlineUsers,
    teamMessages,
    taskUpdates,
    taskCompletions,
    teamInvitations,
    isConnected,
    joinTeam,
    leaveTeam,
    sendTeamMessage,
    notifyTaskUpdated,
    notifyTaskCompleted,
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTime() {
  const context = useContext(RealTimeContext);
  if (context === undefined) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
}