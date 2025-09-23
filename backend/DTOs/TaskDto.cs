using System.ComponentModel.DataAnnotations;

namespace MisionMaestra.API.DTOs
{
    public class CreateTaskRequest
    {
        [Required]
        [MinLength(3)]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public int XP { get; set; } = 10;
        
        public DateTime? DueDate { get; set; }
        
        public Priority Priority { get; set; } = Priority.MEDIUM;
        
        public string? Category { get; set; }
        
        public bool IsPersonal { get; set; } = false;
        
        public bool IsRecurring { get; set; } = false;
        
        public string? RecurringInterval { get; set; }
        
        public string? TeamId { get; set; }
        
        public List<string>? AssignedUserIds { get; set; }
    }

    public class UpdateTaskRequest
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public int? XP { get; set; }
        public DateTime? DueDate { get; set; }
        public Priority? Priority { get; set; }
        public string? Category { get; set; }
        public bool? IsPersonal { get; set; }
        public bool? IsRecurring { get; set; }
        public string? RecurringInterval { get; set; }
        public TaskStatus? Status { get; set; }
        public List<string>? AssignedUserIds { get; set; }
    }

    public class TaskDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int XP { get; set; }
        public DateTime? DueDate { get; set; }
        public Priority Priority { get; set; }
        public string? Category { get; set; }
        public bool IsPersonal { get; set; }
        public bool IsRecurring { get; set; }
        public string? RecurringInterval { get; set; }
        public TaskStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string CreatorId { get; set; } = string.Empty;
        public string? TeamId { get; set; }
        public UserDto Creator { get; set; } = null!;
        public TeamDto? Team { get; set; }
        public List<TaskAssignmentDto> Assignments { get; set; } = new();
    }

    public class TaskAssignmentDto
    {
        public string Id { get; set; } = string.Empty;
        public bool Completed { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public string TaskId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
    }

    public class CompleteTaskRequest
    {
        [Required]
        public bool Completed { get; set; }
    }

    public class AssignTaskRequest
    {
        [Required]
        public List<string> UserIds { get; set; } = new();
    }
}