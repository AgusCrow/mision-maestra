using System.ComponentModel.DataAnnotations;

namespace MisionMaestra.API.Models
{
    public enum Priority
    {
        LOW,
        MEDIUM,
        HIGH
    }

    public enum TaskStatus
    {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }

    public class Task
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public int XP { get; set; } = 10;
        
        public DateTime? DueDate { get; set; }
        
        public Priority Priority { get; set; } = Priority.MEDIUM;
        
        public string? Category { get; set; }
        
        public bool IsPersonal { get; set; } = false;
        
        public bool IsRecurring { get; set; } = false;
        
        public string? RecurringInterval { get; set; }
        
        public TaskStatus Status { get; set; } = TaskStatus.PENDING;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public string CreatorId { get; set; } = string.Empty;
        
        public string? TeamId { get; set; }
        
        // Navigation properties
        public virtual User Creator { get; set; } = null!;
        public virtual Team? Team { get; set; }
        public virtual ICollection<TaskAssignment> Assignments { get; set; } = new List<TaskAssignment>();
    }
}