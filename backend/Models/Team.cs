using System.ComponentModel.DataAnnotations;

namespace MisionMaestra.API.Models
{
    public class Team
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string? Avatar { get; set; }
        
        public int TotalXP { get; set; } = 0;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public string LeaderId { get; set; } = string.Empty;
        
        // Navigation properties
        public virtual User Leader { get; set; } = null!;
        public virtual ICollection<TeamMember> Members { get; set; } = new List<TeamMember>();
        public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
        public virtual ICollection<TeamInvitation> Invitations { get; set; } = new List<TeamInvitation>();
    }
}