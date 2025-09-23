using MisionMaestra.API.DTOs;
using MisionMaestra.API.Models;

namespace MisionMaestra.API.Services
{
    public interface IUserService
    {
        Task<List<UserDto>> GetAllUsersAsync();
        Task<UserDto> GetUserByIdAsync(string userId);
        Task<List<UserDto>> GetOnlineUsersAsync();
        Task<UserDto> UpdateUserAsync(string userId, UpdateUserRequest request);
        Task<bool> DeleteUserAsync(string userId);
        Task<List<UserDto>> SearchUsersAsync(string searchTerm);
    }
}