import * as signalR from '@microsoft/signalr';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

// SignalR Configuration
const SIGNALR_HUB_URL = process.env.NEXT_PUBLIC_SIGNALR_URL || 'http://localhost:5000/hub/mision-maestra';

export interface SignalREventHandlers {
  onUserConnected?: (userId: string) => void;
  onUserDisconnected?: (userId: string) => void;
  onUserStatusUpdated?: (data: { userId: string; socialBattery: number; mood?: string; updatedAt: string }) => void;
  onTeamMessageReceived?: (data: { teamId: string; userId: string; userName: string; message: string; timestamp: string }) => void;
  onTaskUpdated?: (data: { taskId: string; updatedBy: string; updatedAt: string }) => void;
  onTaskCompleted?: (data: { taskId: string; completedBy: string; xp: number; completedAt: string }) => void;
  onTeamInvitationReceived?: (data: { invitationId: string; teamId: string; teamName: string; senderId: string; message?: string; sentAt: string }) => void;
  onReconnecting?: (error?: Error) => void;
  onReconnected?: (connectionId?: string) => void;
  onClose?: (error?: Error) => void;
}

class SignalRService {
  private connection: HubConnection | null = null;
  private eventHandlers: SignalREventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private keepAliveInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection() {
    const token = this.getAuthToken();

    this.connection = new HubConnectionBuilder()
      .withUrl(SIGNALR_HUB_URL, {
        accessTokenFactory: () => token || '',
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
            return null; // Stop retrying
          }
          return this.reconnectDelay * Math.pow(2, retryContext.previousRetryCount); // Exponential backoff
        },
      })
      .configureLogging(LogLevel.Information)
      .build();

    this.setupEventHandlers();
    this.setupConnectionEvents();
  }

  private setupEventHandlers() {
    if (!this.connection) return;

    // Built-in SignalR events
    this.connection.onreconnecting((error) => {
      console.log('SignalR reconnecting...', error);
      this.eventHandlers.onReconnecting?.(error);
      this.reconnectAttempts++;
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected:', connectionId);
      this.eventHandlers.onReconnected?.(connectionId);
      this.reconnectAttempts = 0;
      this.startKeepAlive();
    });

    this.connection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      this.eventHandlers.onClose?.(error);
      this.stopKeepAlive();
    });

    // Custom application events
    this.connection.on('UserConnected', (userId: string) => {
      console.log('User connected:', userId);
      this.eventHandlers.onUserConnected?.(userId);
    });

    this.connection.on('UserDisconnected', (userId: string) => {
      console.log('User disconnected:', userId);
      this.eventHandlers.onUserDisconnected?.(userId);
    });

    this.connection.on('UserStatusUpdated', (data: any) => {
      console.log('User status updated:', data);
      this.eventHandlers.onUserStatusUpdated?.(data);
    });

    this.connection.on('TeamMessageReceived', (data: any) => {
      console.log('Team message received:', data);
      this.eventHandlers.onTeamMessageReceived?.(data);
    });

    this.connection.on('TaskUpdated', (data: any) => {
      console.log('Task updated:', data);
      this.eventHandlers.onTaskUpdated?.(data);
    });

    this.connection.on('TaskCompleted', (data: any) => {
      console.log('Task completed:', data);
      this.eventHandlers.onTaskCompleted?.(data);
    });

    this.connection.on('TeamInvitationReceived', (data: any) => {
      console.log('Team invitation received:', data);
      this.eventHandlers.onTeamInvitationReceived?.(data);
    });
  }

  private setupConnectionEvents() {
    if (!this.connection) return;

    this.connection.onclose((error) => {
      console.log('Connection closed:', error);
      this.stopKeepAlive();
    });
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  // Public methods
  async start(): Promise<void> {
    if (!this.connection) {
      throw new Error('SignalR connection not initialized');
    }

    try {
      await this.connection.start();
      console.log('SignalR connection started');
      this.startKeepAlive();
    } catch (error) {
      console.error('Failed to start SignalR connection:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.connection) return;

    try {
      await this.connection.stop();
      console.log('SignalR connection stopped');
      this.stopKeepAlive();
    } catch (error) {
      console.error('Failed to stop SignalR connection:', error);
      throw error;
    }
  }

  async restart(): Promise<void> {
    await this.stop();
    this.initializeConnection();
    await this.start();
  }

  // Hub methods
  async updateUserStatus(socialBattery: number, mood?: string): Promise<void> {
    if (!this.connection) {
      throw new Error('SignalR connection not established');
    }

    try {
      await this.connection.invoke('UpdateUserStatus', socialBattery, mood);
    } catch (error) {
      console.error('Failed to update user status:', error);
      throw error;
    }
  }

  async joinTeam(teamId: string): Promise<void> {
    if (!this.connection) {
      throw new Error('SignalR connection not established');
    }

    try {
      await this.connection.invoke('JoinTeam', teamId);
    } catch (error) {
      console.error('Failed to join team:', error);
      throw error;
    }
  }

  async leaveTeam(teamId: string): Promise<void> {
    if (!this.connection) {
      throw new Error('SignalR connection not established');
    }

    try {
      await this.connection.invoke('LeaveTeam', teamId);
    } catch (error) {
      console.error('Failed to leave team:', error);
      throw error;
    }
  }

  async sendTeamMessage(teamId: string, message: string): Promise<void> {
    if (!this.connection) {
      throw new Error('SignalR connection not established');
    }

    try {
      await this.connection.invoke('SendTeamMessage', teamId, message);
    } catch (error) {
      console.error('Failed to send team message:', error);
      throw error;
    }
  }

  async notifyTaskUpdated(taskId: string): Promise<void> {
    if (!this.connection) {
      throw new Error('SignalR connection not established');
    }

    try {
      await this.connection.invoke('TaskUpdated', taskId);
    } catch (error) {
      console.error('Failed to notify task updated:', error);
      throw error;
    }
  }

  async notifyTaskCompleted(taskId: string): Promise<void> {
    if (!this.connection) {
      throw new Error('SignalR connection not established');
    }

    try {
      await this.connection.invoke('TaskCompleted', taskId);
    } catch (error) {
      console.error('Failed to notify task completed:', error);
      throw error;
    }
  }

  async notifyTeamInvitationSent(invitationId: string): Promise<void> {
    if (!this.connection) {
      throw new Error('SignalR connection not established');
    }

    try {
      await this.connection.invoke('TeamInvitationSent', invitationId);
    } catch (error) {
      console.error('Failed to notify team invitation sent:', error);
      throw error;
    }
  }

  async keepAlive(): Promise<void> {
    if (!this.connection) {
      throw new Error('SignalR connection not established');
    }

    try {
      await this.connection.invoke('KeepAlive');
    } catch (error) {
      console.error('Failed to send keep alive:', error);
      throw error;
    }
  }

  // Event handler management
  onEvent<K extends keyof SignalREventHandlers>(
    event: K,
    handler: SignalREventHandlers[K]
  ): void {
    this.eventHandlers[event] = handler;
  }

  offEvent<K extends keyof SignalREventHandlers>(
    event: K
  ): void {
    delete this.eventHandlers[event];
  }

  // Connection state
  getConnectionState(): signalR.HubConnectionState {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected;
  }

  isConnected(): boolean {
    return this.getConnectionState() === signalR.HubConnectionState.Connected;
  }

  // Keep alive management
  private startKeepAlive(): void {
    this.stopKeepAlive(); // Clear any existing interval
    
    this.keepAliveInterval = setInterval(async () => {
      try {
        if (this.isConnected()) {
          await this.keepAlive();
        }
      } catch (error) {
        console.error('Keep alive failed:', error);
      }
    }, 30000); // Send keep alive every 30 seconds
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  // Cleanup
  destroy(): void {
    this.stopKeepAlive();
    this.stop();
    this.connection = null;
    this.eventHandlers = {};
  }
}

// Export singleton instance
export const signalRService = new SignalRService();
export default signalRService;