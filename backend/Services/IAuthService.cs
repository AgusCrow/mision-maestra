using MisionMaestra.API.DTOs;
using MisionMaestra.API.Models;

namespace MisionMaestra.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponse> RegisterAsync(RegisterRequest request);
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<UserDto> GetUserByIdAsync(string userId);
        Task<UserDto> UpdateUserAsync(string userId, UpdateUserRequest request);
        string GenerateJwtToken(User user);
    }
}