using System.ComponentModel.DataAnnotations;

namespace MisionMaestra.API.Models
{
    public class User
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        public string? Name { get; set; }
        
        public string? Avatar { get; set; }
        
        [Required]
        public string Password { get; set; } = string.Empty;
        
        public int TotalXP { get; set; } = 0;
        
        public int Level { get; set; } = 1;
        
        public int SocialBattery { get; set; } = 50;
        
        public string? Mood { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual ICollection<TeamMember> TeamMemberships { get; set; } = new List<TeamMember>();
        public virtual ICollection<Team> CreatedTeams { get; set; } = new List<Team>();
        public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
        public virtual ICollection<TaskAssignment> AssignedTasks { get; set; } = new List<TaskAssignment>();
        public virtual ICollection<TeamInvitation> SentInvitations { get; set; } = new List<TeamInvitation>();
        public virtual ICollection<TeamInvitation> ReceivedInvitations { get; set; } = new List<TeamInvitation>();
        public virtual ICollection<UserAchievement> Achievements { get; set; } = new List<UserAchievement>();
    }
}