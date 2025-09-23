'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signalRService } from './api/signalr';
import { useAuth } from './auth-context';
import { toast } from '@/hooks/use-toast';

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
        
        // Show toast notification for new team messages
        if (data.userId !== user?.id) { // Don't show notification for own messages
          toast({
            title: "Nuevo mensaje de equipo",
            description: `${data.userName}: ${data.message}`,
            duration: 5000,
          });
        }
      });

      signalRService.onEvent('onTaskUpdated', (data: TaskUpdate) => {
        setTaskUpdates(prev => [data, ...prev].slice(0, 20)); // Keep last 20 updates
        
        // Show toast notification for task updates
        toast({
          title: "Tarea actualizada",
          description: `La tarea ha sido actualizada por ${data.updatedBy}`,
          duration: 3000,
        });
      });

      signalRService.onEvent('onTaskCompleted', (data: TaskCompletion) => {
        setTaskCompletions(prev => [data, ...prev].slice(0, 20)); // Keep last 20 completions
        
        // Show toast notification for task completions
        const isOwnTask = data.completedBy === user?.id;
        toast({
          title: isOwnTask ? "¡Tarea completada!" : "Tarea completada",
          description: isOwnTask 
            ? `Has ganado ${data.xp} XP por completar la tarea` 
            : `${data.completedBy} completó una tarea y ganó ${data.xp} XP`,
          duration: 5000,
        });
      });

      signalRService.onEvent('onTeamInvitationReceived', (data: TeamInvitation) => {
        setTeamInvitations(prev => [data, ...prev].slice(0, 10)); // Keep last 10 invitations
        
        // Show toast notification for team invitations
        toast({
          title: "Nueva invitación de equipo",
          description: `Has sido invitado a unirte a "${data.teamName}"`,
          duration: 7000,
        });
      });

      signalRService.onEvent('onReconnected', () => {
        setIsConnected(true);
        toast({
          title: "Conexión restablecida",
          description: "Te has vuelto a conectar al servidor en tiempo real",
          duration: 3000,
        });
      });

      signalRService.onEvent('onClose', () => {
        setIsConnected(false);
        toast({
          title: "Conexión perdida",
          description: "Se ha perdido la conexión con el servidor en tiempo real",
          duration: 5000,
          variant: "destructive",
        });
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