using System.ComponentModel.DataAnnotations;

namespace MisionMaestra.API.Models
{
    public class Achievement
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string Description { get; set; } = string.Empty;
        
        public string? Icon { get; set; }
        
        public int XPThreshold { get; set; }
        
        public string? Category { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual ICollection<UserAchievement> UserAchievements { get; set; } = new List<UserAchievement>();
    }

    public class UserAchievement
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        public DateTime EarnedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public string AchievementId { get; set; } = string.Empty;
        
        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual Achievement Achievement { get; set; } = null!;
    }
}