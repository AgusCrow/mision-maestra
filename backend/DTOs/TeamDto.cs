using System.ComponentModel.DataAnnotations;

namespace MisionMaestra.API.DTOs
{
    public class CreateTeamRequest
    {
        [Required]
        [MinLength(3)]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string? Avatar { get; set; }
    }

    public class UpdateTeamRequest
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Avatar { get; set; }
    }

    public class TeamDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Avatar { get; set; }
        public int TotalXP { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string LeaderId { get; set; } = string.Empty;
        public UserDto Leader { get; set; } = null!;
        public List<TeamMemberDto> Members { get; set; } = new();
    }

    public class TeamMemberDto
    {
        public string Id { get; set; } = string.Empty;
        public TeamRole Role { get; set; }
        public DateTime JoinedAt { get; set; }
        public string UserId { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
    }

    public class InviteUserRequest
    {
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        public string? Message { get; set; }
    }

    public class TeamInvitationDto
    {
        public string Id { get; set; } = string.Empty;
        public InvitationStatus Status { get; set; }
        public string? Message { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string SenderId { get; set; } = string.Empty;
        public string ReceiverId { get; set; } = string.Empty;
        public string TeamId { get; set; } = string.Empty;
        public UserDto Sender { get; set; } = null!;
        public UserDto Receiver { get; set; } = null!;
        public TeamDto Team { get; set; } = null!;
    }

    public class RespondToInvitationRequest
    {
        [Required]
        public bool Accept { get; set; }
    }
}