namespace MisionMaestra.API.Models
{
    public enum InvitationStatus
    {
        PENDING,
        ACCEPTED,
        REJECTED,
        EXPIRED
    }

    public class TeamInvitation
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        public InvitationStatus Status { get; set; } = InvitationStatus.PENDING;
        
        public string? Message { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        [Required]
        public string SenderId { get; set; } = string.Empty;
        
        [Required]
        public string ReceiverId { get; set; } = string.Empty;
        
        [Required]
        public string TeamId { get; set; } = string.Empty;
        
        // Navigation properties
        public virtual User Sender { get; set; } = null!;
        public virtual User Receiver { get; set; } = null!;
        public virtual Team Team { get; set; } = null!;
    }
}