namespace MisionMaestra.API.Models
{
    public enum TeamRole
    {
        LEADER,
        MEMBER
    }

    public class TeamMember
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        public TeamRole Role { get; set; } = TeamRole.MEMBER;
        
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public string TeamId { get; set; } = string.Empty;
        
        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual Team Team { get; set; } = null!;
    }
}