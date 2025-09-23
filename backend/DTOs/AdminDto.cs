namespace MisionMaestra.API.DTOs
{
    public class ServerStatsDto
    {
        public int TotalUsers { get; set; }
        public int OnlineUsers { get; set; }
        public int TotalTeams { get; set; }
        public int ActiveTeams { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int PendingTasks { get; set; }
        public int TotalInvitations { get; set; }
        public int PendingInvitations { get; set; }
        public DateTime ServerUptime { get; set; }
        public Dictionary<string, int> TasksByStatus { get; set; } = new();
        public Dictionary<string, int> UsersByLevel { get; set; } = new();
    }

    public class ServerLogDto
    {
        public string Id { get; set; } = string.Empty;
        public LogLevel Level { get; set; }
        public LogCategory Category { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Details { get; set; }
        public string? UserId { get; set; }
        public string? IPAddress { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class OnlineUserDto
    {
        public string Id { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string ConnectionId { get; set; } = string.Empty;
        public DateTime LastActivity { get; set; }
        public bool IsOnline { get; set; }
        public UserDto User { get; set; } = null!;
    }

    public class DashboardFilterRequest
    {
        public LogLevel? LogLevel { get; set; }
        public LogCategory? Category { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? Page { get; set; } = 1;
        public int? PageSize { get; set; } = 50;
    }

    public class PaginatedResponse<T>
    {
        public List<T> Items { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalItems { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }
}