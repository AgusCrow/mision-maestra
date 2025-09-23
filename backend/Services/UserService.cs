using Microsoft.EntityFrameworkCore;
using MisionMaestra.API.DTOs;
using MisionMaestra.API.Models;
using Serilog;

namespace MisionMaestra.API.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILoggingService _loggingService;

        public UserService(ApplicationDbContext context, ILoggingService loggingService)
        {
            _context = context;
            _loggingService = loggingService;
        }

        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return users.Select(MapToUserDto).ToList();
        }

        public async Task<UserDto> GetUserByIdAsync(string userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new Exception("User not found");
            }

            return MapToUserDto(user);
        }

        public async Task<List<UserDto>> GetOnlineUsersAsync()
        {
            var onlineUserIds = await _context.OnlineUsers
                .Where(u => u.IsOnline)
                .Select(u => u.UserId)
                .ToListAsync();

            var users = await _context.Users
                .Where(u => onlineUserIds.Contains(u.Id))
                .ToListAsync();

            return users.Select(MapToUserDto).ToList();
        }

        public async Task<UserDto> UpdateUserAsync(string userId, UpdateUserRequest request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new Exception("User not found");
            }

            // Update fields
            if (request.Name != null)
                user.Name = request.Name;
            if (request.Avatar != null)
                user.Avatar = request.Avatar;
            if (request.SocialBattery.HasValue)
                user.SocialBattery = request.SocialBattery.Value;
            if (request.Mood != null)
                user.Mood = request.Mood;

            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _loggingService.LogAsync(LogLevel.INFO, LogCategory.USERS, 
                $"User profile updated: {user.Email}", userId: user.Id);

            return MapToUserDto(user);
        }

        public async Task<bool> DeleteUserAsync(string userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return false;
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            await _loggingService.LogAsync(LogLevel.INFO, LogCategory.USERS, 
                $"User deleted: {user.Email}", userId: user.Id);

            return true;
        }

        public async Task<List<UserDto>> SearchUsersAsync(string searchTerm)
        {
            var users = await _context.Users
                .Where(u => u.Email.Contains(searchTerm) || 
                           (u.Name != null && u.Name.Contains(searchTerm)))
                .OrderBy(u => u.Name)
                .ThenBy(u => u.Email)
                .Take(20)
                .ToListAsync();

            return users.Select(MapToUserDto).ToList();
        }

        private UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.Name,
                Avatar = user.Avatar,
                TotalXP = user.TotalXP,
                Level = user.Level,
                SocialBattery = user.SocialBattery,
                Mood = user.Mood,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };
        }
    }
}