using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MisionMaestra.API.DTOs;
using MisionMaestra.API.Services;

namespace MisionMaestra.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILoggingService _loggingService;

        public UsersController(IUserService userService, ILoggingService loggingService)
        {
            _userService = userService;
            _loggingService = loggingService;
        }

        [HttpGet]
        public async Task<ActionResult<List<UserDto>>> GetAllUsers()
        {
            try
            {
                var users = await _userService.GetAllUsersAsync();
                return Ok(users);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{userId}")]
        public async Task<ActionResult<UserDto>> GetUserById(string userId)
        {
            try
            {
                var user = await _userService.GetUserByIdAsync(userId);
                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("online")]
        public async Task<ActionResult<List<UserDto>>> GetOnlineUsers()
        {
            try
            {
                var users = await _userService.GetOnlineUsersAsync();
                return Ok(users);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<UserDto>>> SearchUsers([FromQuery] string searchTerm)
        {
            try
            {
                var users = await _userService.SearchUsersAsync(searchTerm);
                return Ok(users);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{userId}")]
        public async Task<ActionResult<UserDto>> UpdateUser(string userId, [FromBody] UpdateUserRequest request)
        {
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized();
            }

            // Users can only update their own profile
            if (currentUserId != userId)
            {
                return Forbid();
            }

            try
            {
                var user = await _userService.UpdateUserAsync(userId, request);
                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{userId}")]
        public async Task<ActionResult<bool>> DeleteUser(string userId)
        {
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized();
            }

            // Users can only delete their own account
            if (currentUserId != userId)
            {
                return Forbid();
            }

            try
            {
                var result = await _userService.DeleteUserAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}