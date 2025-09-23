using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using MisionMaestra.API.DTOs;
using MisionMaestra.API.Models;
using Serilog;

namespace MisionMaestra.API.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILoggingService _loggingService;

        public AuthService(ApplicationDbContext context, IConfiguration configuration, ILoggingService loggingService)
        {
            _context = context;
            _configuration = configuration;
            _loggingService = loggingService;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            try
            {
                // Check if user already exists
                if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                {
                    throw new Exception("User with this email already exists");
                }

                // Hash password
                string hashedPassword = BCrypt.HashPassword(request.Password);

                // Create user
                var user = new User
                {
                    Email = request.Email,
                    Name = request.Name,
                    Password = hashedPassword,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Log registration
                await _loggingService.LogAsync(LogLevel.INFO, LogCategory.AUTHENTICATION, 
                    $"User registered: {user.Email}", userId: user.Id);

                // Generate token
                string token = GenerateJwtToken(user);

                return new AuthResponse
                {
                    Token = token,
                    User = MapToUserDto(user)
                };
            }
            catch (Exception ex)
            {
                await _loggingService.LogAsync(LogLevel.ERROR, LogCategory.AUTHENTICATION, 
                    $"Registration failed: {ex.Message}");
                throw;
            }
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            try
            {
                // Find user
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (user == null)
                {
                    throw new Exception("Invalid credentials");
                }

                // Verify password
                if (!BCrypt.Verify(request.Password, user.Password))
                {
                    throw new Exception("Invalid credentials");
                }

                // Update last login
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Log login
                await _loggingService.LogAsync(LogLevel.INFO, LogCategory.AUTHENTICATION, 
                    $"User logged in: {user.Email}", userId: user.Id);

                // Generate token
                string token = GenerateJwtToken(user);

                return new AuthResponse
                {
                    Token = token,
                    User = MapToUserDto(user)
                };
            }
            catch (Exception ex)
            {
                await _loggingService.LogAsync(LogLevel.ERROR, LogCategory.AUTHENTICATION, 
                    $"Login failed: {ex.Message}");
                throw;
            }
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

        public string GenerateJwtToken(User user)
        {
            var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "fallback-secret-key");
            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("name", user.Name ?? ""),
                new Claim("level", user.Level.ToString())
            };

            var credentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
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