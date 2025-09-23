using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MisionMaestra.API.DTOs;
using MisionMaestra.API.Services;

namespace MisionMaestra.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly ILoggingService _loggingService;
        private readonly IUserService _userService;
        private readonly ITeamService _teamService;
        private readonly ITaskService _taskService;

        public AdminController(
            ILoggingService loggingService,
            IUserService userService,
            ITeamService teamService,
            ITaskService taskService)
        {
            _loggingService = loggingService;
            _userService = userService;
            _teamService = teamService;
            _taskService = taskService;
        }

        [HttpGet("stats")]
        public async Task<ActionResult<ServerStatsDto>> GetServerStats()
        {
            try
            {
                var stats = await _loggingService.GetServerStatsAsync();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("logs")]
        public async Task<ActionResult<PaginatedResponse<ServerLogDto>>> GetLogs([FromQuery] DashboardFilterRequest filter)
        {
            try
            {
                var logs = await _loggingService.GetLogsAsync(filter);
                
                // For simplicity, we'll return a basic paginated response
                // In a real implementation, you'd want to get the total count from the database
                var response = new PaginatedResponse<ServerLogDto>
                {
                    Items = logs,
                    Page = filter.Page ?? 1,
                    PageSize = filter.PageSize ?? 50,
                    TotalItems = logs.Count,
                    TotalPages = 1,
                    HasNextPage = false,
                    HasPreviousPage = (filter.Page ?? 1) > 1
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("logs/cleanup")]
        public async Task<ActionResult<bool>> CleanupOldLogs([FromQuery] int daysToKeep = 30)
        {
            try
            {
                await _loggingService.CleanupOldLogsAsync(daysToKeep);
                return Ok(true);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("users")]
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

        [HttpGet("teams")]
        public async Task<ActionResult<List<TeamDto>>> GetAllTeams()
        {
            try
            {
                var teams = await _teamService.GetAllTeamsAsync();
                return Ok(teams);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("tasks")]
        public async Task<ActionResult<List<TaskDto>>> GetAllTasks()
        {
            try
            {
                var tasks = await _taskService.GetAllTasksAsync();
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("online-users")]
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

        [HttpPost("system/shutdown")]
        public async Task<ActionResult<bool>> ShutdownSystem()
        {
            try
            {
                // Log the shutdown request
                await _loggingService.LogAsync(
                    LogLevel.WARNING,
                    LogCategory.SYSTEM,
                    "System shutdown requested by admin"
                );

                // In a real implementation, you would gracefully shut down the application
                // For now, we'll just return success
                return Ok(new { message = "Shutdown request received", shutdownInitiated = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("system/restart")]
        public async Task<ActionResult<bool>> RestartSystem()
        {
            try
            {
                // Log the restart request
                await _loggingService.LogAsync(
                    LogLevel.WARNING,
                    LogCategory.SYSTEM,
                    "System restart requested by admin"
                );

                // In a real implementation, you would gracefully restart the application
                // For now, we'll just return success
                return Ok(new { message = "Restart request received", restartInitiated = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}