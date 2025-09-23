namespace MisionMaestra.API.Models
{
    public enum LogLevel
    {
        INFO,
        WARNING,
        ERROR,
        DEBUG
    }

    public enum LogCategory
    {
        AUTHENTICATION,
        TEAMS,
        TASKS,
        USERS,
        SYSTEM,
        SECURITY
    }

    public class ServerLog
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        public LogLevel Level { get; set; } = LogLevel.INFO;
        
        public LogCategory Category { get; set; } = LogCategory.SYSTEM;
        
        public string Message { get; set; } = string.Empty;
        
        public string? Details { get; set; }
        
        public string? UserId { get; set; }
        
        public string? IPAddress { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class OnlineUser
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public string ConnectionId { get; set; } = string.Empty;
        
        public DateTime LastActivity { get; set; } = DateTime.UtcNow;
        
        public bool IsOnline { get; set; } = true;
        
        // Navigation properties
        public virtual User User { get; set; } = null!;
    }
}