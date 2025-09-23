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

// Mock SignalR service for development - will be replaced with actual SignalR later
class SignalRService {
  private eventHandlers: SignalREventHandlers = {};

  constructor() {
    console.log('SignalR service initialized (mock mode)');
  }

  // Public methods - mock implementations
  async start(): Promise<void> {
    console.log('SignalR connection started (mock)');
  }

  async stop(): Promise<void> {
    console.log('SignalR connection stopped (mock)');
  }

  async restart(): Promise<void> {
    console.log('SignalR connection restarted (mock)');
  }

  // Hub methods - mock implementations
  async updateUserStatus(socialBattery: number, mood?: string): Promise<void> {
    console.log('User status updated (mock):', { socialBattery, mood });
  }

  async joinTeam(teamId: string): Promise<void> {
    console.log('Joined team (mock):', teamId);
  }

  async leaveTeam(teamId: string): Promise<void> {
    console.log('Left team (mock):', teamId);
  }

  async sendTeamMessage(teamId: string, message: string): Promise<void> {
    console.log('Team message sent (mock):', { teamId, message });
  }

  async notifyTaskUpdated(taskId: string): Promise<void> {
    console.log('Task updated notified (mock):', taskId);
  }

  async notifyTaskCompleted(taskId: string): Promise<void> {
    console.log('Task completed notified (mock):', taskId);
  }

  async notifyTeamInvitationSent(invitationId: string): Promise<void> {
    console.log('Team invitation sent notified (mock):', invitationId);
  }

  async keepAlive(): Promise<void> {
    console.log('Keep alive sent (mock)');
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
  getConnectionState(): string {
    return 'Connected'; // Mock connected state
  }

  isConnected(): boolean {
    return true; // Mock connected state
  }

  // Cleanup
  destroy(): void {
    console.log('SignalR service destroyed (mock)');
    this.eventHandlers = {};
  }
}

// Export singleton instance
export const signalRService = new SignalRService();
export default signalRService;