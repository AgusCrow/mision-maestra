using System.ComponentModel.DataAnnotations;

namespace MisionMaestra.API.DTOs
{
    public class RegisterRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
        
        public string? Name { get; set; }
    }

    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
    }

    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Name { get; set; }
        public string? Avatar { get; set; }
        public int TotalXP { get; set; }
        public int Level { get; set; }
        public int SocialBattery { get; set; }
        public string? Mood { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateUserRequest
    {
        public string? Name { get; set; }
        public string? Avatar { get; set; }
        public int? SocialBattery { get; set; }
        public string? Mood { get; set; }
    }
}