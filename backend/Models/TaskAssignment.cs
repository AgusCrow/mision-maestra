namespace MisionMaestra.API.Models
{
    public class TaskAssignment
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        public bool Completed { get; set; } = false;
        
        public DateTime? CompletedAt { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public string TaskId { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        // Navigation properties
        public virtual Task Task { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}