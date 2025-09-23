using Microsoft.AspNetCore.SignalR;
using MisionMaestra.API.DTOs;
using MisionMaestra.API.Models;
using MisionMaestra.API.Services;
using System.Security.Claims;

namespace MisionMaestra.API.Hubs
{
    public class MisionMaestraHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private readonly ILoggingService _loggingService;
        private static readonly Dictionary<string, string> _userConnections = new();

        public MisionMaestraHub(ApplicationDbContext context, ILoggingService loggingService)
        {
            _context = context;
            _loggingService = loggingService;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                // Add to online users
                var onlineUser = new OnlineUser
                {
                    UserId = userId,
                    ConnectionId = Context.ConnectionId,
                    LastActivity = DateTime.UtcNow,
                    IsOnline = true
                };

                _context.OnlineUsers.Add(onlineUser);
                await _context.SaveChangesAsync();

                // Track connection
                _userConnections[Context.ConnectionId] = userId;

                // Notify others
                await Clients.Others.SendAsync("UserConnected", userId);

                await _loggingService.LogAsync(LogLevel.INFO, LogCategory.USERS, 
                    $"User connected: {userId}", userId: userId);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                // Remove from online users
                var onlineUser = await _context.OnlineUsers
                    .FirstOrDefaultAsync(u => u.ConnectionId == Context.ConnectionId);
                
                if (onlineUser != null)
                {
                    _context.OnlineUsers.Remove(onlineUser);
                    await _context.SaveChangesAsync();
                }

                // Remove from tracking
                _userConnections.Remove(Context.ConnectionId);

                // Notify others
                await Clients.Others.SendAsync("UserDisconnected", userId);

                await _loggingService.LogAsync(LogLevel.INFO, LogCategory.USERS, 
                    $"User disconnected: {userId}", userId: userId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task UpdateUserStatus(string userId, int socialBattery, string? mood)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.SocialBattery = socialBattery;
                user.Mood = mood;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Update online user activity
                var onlineUser = await _context.OnlineUsers
                    .FirstOrDefaultAsync(u => u.UserId == userId);
                
                if (onlineUser != null)
                {
                    onlineUser.LastActivity = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                // Notify team members
                var userTeams = await _context.TeamMembers
                    .Where(tm => tm.UserId == userId)
                    .Select(tm => tm.TeamId)
                    .ToListAsync();

                foreach (var teamId in userTeams)
                {
                    var teamMemberIds = await _context.TeamMembers
                        .Where(tm => tm.TeamId == teamId && tm.UserId != userId)
                        .Select(tm => tm.UserId)
                        .ToListAsync();

                    foreach (var memberUserId in teamMemberIds)
                    {
                        var memberConnections = _userConnections
                            .Where(kvp => kvp.Value == memberUserId)
                            .Select(kvp => kvp.Key)
                            .ToList();

                        foreach (var connectionId in memberConnections)
                        {
                            await Clients.Client(connectionId).SendAsync("UserStatusUpdated", new
                            {
                                UserId = userId,
                                SocialBattery = socialBattery,
                                Mood = mood,
                                UpdatedAt = DateTime.UtcNow
                            });
                        }
                    }
                }

                await _loggingService.LogAsync(LogLevel.INFO, LogCategory.USERS, 
                    $"User status updated: {userId}", userId: userId);
            }
        }

        public async Task JoinTeam(string teamId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return;

            // Check if user is team member
            var isMember = await _context.TeamMembers
                .AnyAsync(tm => tm.TeamId == teamId && tm.UserId == userId);
            
            if (!isMember)
                return;

            await Groups.AddToGroupAsync(Context.ConnectionId, teamId);

            await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TEAMS, 
                $"User joined team group: {teamId}", userId: userId);
        }

        public async Task LeaveTeam(string teamId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return;

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, teamId);

            await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TEAMS, 
                $"User left team group: {teamId}", userId: userId);
        }

        public async Task SendTeamMessage(string teamId, string message)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return;

            // Check if user is team member
            var isMember = await _context.TeamMembers
                .AnyAsync(tm => tm.TeamId == teamId && tm.UserId == userId);
            
            if (!isMember)
                return;

            var user = await _context.Users.FindAsync(userId);
            var userName = user?.Name ?? user?.Email ?? "Unknown";

            await Clients.Group(teamId).SendAsync("TeamMessageReceived", new
            {
                TeamId = teamId,
                UserId = userId,
                UserName = userName,
                Message = message,
                Timestamp = DateTime.UtcNow
            });

            await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TEAMS, 
                $"Team message sent: {teamId}", userId: userId);
        }

        public async Task TaskUpdated(string taskId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return;

            var task = await _context.Tasks
                .Include(t => t.Team)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task != null && !string.IsNullOrEmpty(task.TeamId))
            {
                // Notify team members
                await Clients.Group(task.TeamId).SendAsync("TaskUpdated", new
                {
                    TaskId = taskId,
                    UpdatedBy = userId,
                    UpdatedAt = DateTime.UtcNow
                });

                await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TASKS, 
                    $"Task updated notification sent: {taskId}", userId: userId);
            }
        }

        public async Task TaskCompleted(string taskId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return;

            var task = await _context.Tasks
                .Include(t => t.Team)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task != null && !string.IsNullOrEmpty(task.TeamId))
            {
                // Notify team members
                await Clients.Group(task.TeamId).SendAsync("TaskCompleted", new
                {
                    TaskId = taskId,
                    CompletedBy = userId,
                    XP = task.XP,
                    CompletedAt = DateTime.UtcNow
                });

                await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TASKS, 
                    $"Task completed notification sent: {taskId}", userId: userId);
            }
        }

        public async Task TeamInvitationSent(string invitationId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return;

            var invitation = await _context.TeamInvitations
                .Include(ti => ti.Receiver)
                .FirstOrDefaultAsync(ti => ti.Id == invitationId);

            if (invitation != null)
            {
                // Notify receiver
                var receiverConnections = _userConnections
                    .Where(kvp => kvp.Value == invitation.ReceiverId)
                    .Select(kvp => kvp.Key)
                    .ToList();

                foreach (var connectionId in receiverConnections)
                {
                    await Clients.Client(connectionId).SendAsync("TeamInvitationReceived", new
                    {
                        InvitationId = invitationId,
                        TeamId = invitation.TeamId,
                        TeamName = invitation.TeamId, // Would need to fetch team name
                        SenderId = invitation.SenderId,
                        Message = invitation.Message,
                        SentAt = DateTime.UtcNow
                    });
                }

                await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TEAMS, 
                    $"Team invitation notification sent: {invitationId}", userId: userId);
            }
        }

        public async Task KeepAlive()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                // Update last activity
                var onlineUser = await _context.OnlineUsers
                    .FirstOrDefaultAsync(u => u.UserId == userId && u.ConnectionId == Context.ConnectionId);
                
                if (onlineUser != null)
                {
                    onlineUser.LastActivity = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }
        }
    }
}