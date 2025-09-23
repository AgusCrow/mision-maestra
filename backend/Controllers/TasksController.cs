using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MisionMaestra.API.DTOs;
using MisionMaestra.API.Services;

namespace MisionMaestra.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly ILoggingService _loggingService;

        public TasksController(ITaskService taskService, ILoggingService loggingService)
        {
            _taskService = taskService;
            _loggingService = loggingService;
        }

        [HttpPost]
        public async Task<ActionResult<TaskDto>> CreateTask([FromBody] CreateTaskRequest request)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var task = await _taskService.CreateTaskAsync(userId, request);
                return CreatedAtAction(nameof(GetTaskById), new { taskId = task.Id }, task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{taskId}")]
        public async Task<ActionResult<TaskDto>> GetTaskById(string taskId)
        {
            try
            {
                var task = await _taskService.GetTaskByIdAsync(taskId);
                return Ok(task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("my-tasks")]
        public async Task<ActionResult<List<TaskDto>>> GetUserTasks()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var tasks = await _taskService.GetUserTasksAsync(userId);
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("team/{teamId}")]
        public async Task<ActionResult<List<TaskDto>>> GetTeamTasks(string teamId)
        {
            try
            {
                var tasks = await _taskService.GetTeamTasksAsync(teamId);
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
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

        [HttpGet("status/{status}")]
        public async Task<ActionResult<List<TaskDto>>> GetTasksByStatus(TaskStatus status)
        {
            try
            {
                var tasks = await _taskService.GetTasksByStatusAsync(status);
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("priority/{priority}")]
        public async Task<ActionResult<List<TaskDto>>> GetTasksByPriority(Priority priority)
        {
            try
            {
                var tasks = await _taskService.GetTasksByPriorityAsync(priority);
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{taskId}")]
        public async Task<ActionResult<TaskDto>> UpdateTask(string taskId, [FromBody] UpdateTaskRequest request)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var task = await _taskService.UpdateTaskAsync(taskId, userId, request);
                return Ok(task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{taskId}")]
        public async Task<ActionResult<bool>> DeleteTask(string taskId)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var result = await _taskService.DeleteTaskAsync(taskId, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{taskId}/complete")]
        public async Task<ActionResult<TaskDto>> CompleteTask(string taskId, [FromBody] CompleteTaskRequest request)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var task = await _taskService.CompleteTaskAsync(taskId, userId, request);
                return Ok(task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{taskId}/assign")]
        public async Task<ActionResult<TaskDto>> AssignTask(string taskId, [FromBody] AssignTaskRequest request)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var task = await _taskService.AssignTaskAsync(taskId, userId, request);
                return Ok(task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}