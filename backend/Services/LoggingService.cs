using Microsoft.EntityFrameworkCore;
using MisionMaestra.API.DTOs;
using MisionMaestra.API.Models;
using Serilog;

namespace MisionMaestra.API.Services
{
    public class LoggingService : ILoggingService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger _logger;

        public LoggingService(ApplicationDbContext context, ILogger logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task LogAsync(LogLevel level, LogCategory category, string message, string? details = null, string? userId = null, string? ipAddress = null)
        {
            try
            {
                var log = new ServerLog
                {
                    Level = level,
                    Category = category,
                    Message = message,
                    Details = details,
                    UserId = userId,
                    IPAddress = ipAddress,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ServerLogs.Add(log);
                await _context.SaveChangesAsync();

                // Also log to Serilog
                _logger.Information("{Category}: {Message} (User: {UserId}, IP: {IPAddress})", 
                    category, message, userId ?? "N/A", ipAddress ?? "N/A");
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Failed to log to database: {Message}", ex.Message);
            }
        }

        public async Task<List<ServerLogDto>> GetLogsAsync(DashboardFilterRequest filter)
        {
            var query = _context.ServerLogs.AsQueryable();

            if (filter.LogLevel.HasValue)
                query = query.Where(l => l.Level == filter.LogLevel.Value);

            if (filter.Category.HasValue)
                query = query.Where(l => l.Category == filter.Category.Value);

            if (filter.StartDate.HasValue)
                query = query.Where(l => l.CreatedAt >= filter.StartDate.Value);

            if (filter.EndDate.HasValue)
                query = query.Where(l => l.CreatedAt <= filter.EndDate.Value);

            var page = filter.Page ?? 1;
            var pageSize = filter.PageSize ?? 50;

            var logs = await query
                .OrderByDescending(l => l.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return logs.Select(MapToLogDto).ToList();
        }

        public async Task<ServerStatsDto> GetServerStatsAsync()
        {
            var now = DateTime.UtcNow;
            var last24Hours = now.AddHours(-24);

            var totalUsers = await _context.Users.CountAsync();
            var onlineUsers = await _context.OnlineUsers.CountAsync(u => u.IsOnline);
            var totalTeams = await _context.Teams.CountAsync();
            var activeTeams = await _context.TeamMembers
                .Where(tm => tm.JoinedAt > last24Hours)
                .Select(tm => tm.TeamId)
                .Distinct()
                .CountAsync();
            var totalTasks = await _context.Tasks.CountAsync();
            var completedTasks = await _context.Tasks.CountAsync(t => t.Status == TaskStatus.COMPLETED);
            var pendingTasks = await _context.Tasks.CountAsync(t => t.Status == TaskStatus.PENDING);
            var totalInvitations = await _context.TeamInvitations.CountAsync();
            var pendingInvitations = await _context.TeamInvitations.CountAsync(ti => ti.Status == InvitationStatus.PENDING);

            // Tasks by status
            var tasksByStatus = await _context.Tasks
                .GroupBy(t => t.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToDictionaryAsync(x => x.Status, x => x.Count);

            // Users by level
            var usersByLevel = await _context.Users
                .GroupBy(u => u.Level)
                .Select(g => new { Level = g.Key.ToString(), Count = g.Count() })
                .ToDictionaryAsync(x => x.Level, x => x.Count);

            return new ServerStatsDto
            {
                TotalUsers = totalUsers,
                OnlineUsers = onlineUsers,
                TotalTeams = totalTeams,
                ActiveTeams = activeTeams,
                TotalTasks = totalTasks,
                CompletedTasks = completedTasks,
                PendingTasks = pendingTasks,
                TotalInvitations = totalInvitations,
                PendingInvitations = pendingInvitations,
                ServerUptime = now,
                TasksByStatus = tasksByStatus,
                UsersByLevel = usersByLevel
            };
        }

        public async Task CleanupOldLogsAsync(int daysToKeep = 30)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-daysToKeep);
            
            var oldLogs = await _context.ServerLogs
                .Where(l => l.CreatedAt < cutoffDate)
                .ToListAsync();

            if (oldLogs.Any())
            {
                _context.ServerLogs.RemoveRange(oldLogs);
                await _context.SaveChangesAsync();

                _logger.Information("Cleaned up {Count} old log entries", oldLogs.Count);
            }
        }

        private ServerLogDto MapToLogDto(ServerLog log)
        {
            return new ServerLogDto
            {
                Id = log.Id,
                Level = log.Level,
                Category = log.Category,
                Message = log.Message,
                Details = log.Details,
                UserId = log.UserId,
                IPAddress = log.IPAddress,
                CreatedAt = log.CreatedAt
            };
        }
    }
}