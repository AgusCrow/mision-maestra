using Microsoft.EntityFrameworkCore;
using MisionMaestra.API.DTOs;
using MisionMaestra.API.Models;
using Serilog;

namespace MisionMaestra.API.Services
{
    public class TaskService : ITaskService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILoggingService _loggingService;

        public TaskService(ApplicationDbContext context, ILoggingService loggingService)
        {
            _context = context;
            _loggingService = loggingService;
        }

        public async Task<TaskDto> CreateTaskAsync(string creatorId, CreateTaskRequest request)
        {
            try
            {
                // Validate team access if team task
                if (!string.IsNullOrEmpty(request.TeamId))
                {
                    var isTeamMember = await _context.TeamMembers
                        .AnyAsync(tm => tm.TeamId == request.TeamId && tm.UserId == creatorId);
                    
                    if (!isTeamMember)
                    {
                        throw new Exception("User is not a member of this team");
                    }
                }

                var task = new Models.Task
                {
                    Title = request.Title,
                    Description = request.Description,
                    XP = request.XP,
                    DueDate = request.DueDate,
                    Priority = request.Priority,
                    Category = request.Category,
                    IsPersonal = request.IsPersonal,
                    IsRecurring = request.IsRecurring,
                    RecurringInterval = request.RecurringInterval,
                    CreatorId = creatorId,
                    TeamId = request.TeamId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();

                // Assign users if specified
                if (request.AssignedUserIds != null && request.AssignedUserIds.Any())
                {
                    foreach (var assignedUserId in request.AssignedUserIds)
                    {
                        var assignment = new TaskAssignment
                        {
                            TaskId = task.Id,
                            UserId = assignedUserId,
                            CreatedAt = DateTime.UtcNow
                        };

                        _context.TaskAssignments.Add(assignment);
                    }
                    await _context.SaveChangesAsync();
                }

                await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TASKS, 
                    $"Task created: {task.Title}", userId: creatorId);

                return await GetTaskByIdAsync(task.Id);
            }
            catch (Exception ex)
            {
                await _loggingService.LogAsync(LogLevel.ERROR, LogCategory.TASKS, 
                    $"Task creation failed: {ex.Message}", userId: creatorId);
                throw;
            }
        }

        public async Task<TaskDto> GetTaskByIdAsync(string taskId)
        {
            var task = await _context.Tasks
                .Include(t => t.Creator)
                .Include(t => t.Team)
                .Include(t => t.Assignments)
                    .ThenInclude(a => a.User)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
            {
                throw new Exception("Task not found");
            }

            return MapToTaskDto(task);
        }

        public async Task<List<TaskDto>> GetUserTasksAsync(string userId)
        {
            var tasks = await _context.Tasks
                .Include(t => t.Creator)
                .Include(t => t.Team)
                .Include(t => t.Assignments)
                    .ThenInclude(a => a.User)
                .Where(t => t.CreatorId == userId || t.Assignments.Any(a => a.UserId == userId))
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return tasks.Select(MapToTaskDto).ToList();
        }

        public async Task<List<TaskDto>> GetTeamTasksAsync(string teamId)
        {
            var tasks = await _context.Tasks
                .Include(t => t.Creator)
                .Include(t => t.Team)
                .Include(t => t.Assignments)
                    .ThenInclude(a => a.User)
                .Where(t => t.TeamId == teamId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return tasks.Select(MapToTaskDto).ToList();
        }

        public async Task<List<TaskDto>> GetAllTasksAsync()
        {
            var tasks = await _context.Tasks
                .Include(t => t.Creator)
                .Include(t => t.Team)
                .Include(t => t.Assignments)
                    .ThenInclude(a => a.User)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return tasks.Select(MapToTaskDto).ToList();
        }

        public async Task<TaskDto> UpdateTaskAsync(string taskId, string userId, UpdateTaskRequest request)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
            {
                throw new Exception("Task not found");
            }

            // Check if user is task creator or team member
            if (task.CreatorId != userId && !string.IsNullOrEmpty(task.TeamId))
            {
                var isTeamMember = await _context.TeamMembers
                    .AnyAsync(tm => tm.TeamId == task.TeamId && tm.UserId == userId);
                
                if (!isTeamMember)
                {
                    throw new Exception("User is not authorized to update this task");
                }
            }
            else if (task.CreatorId != userId)
            {
                throw new Exception("User is not authorized to update this task");
            }

            // Update fields
            if (request.Title != null)
                task.Title = request.Title;
            if (request.Description != null)
                task.Description = request.Description;
            if (request.XP.HasValue)
                task.XP = request.XP.Value;
            if (request.DueDate.HasValue)
                task.DueDate = request.DueDate.Value;
            if (request.Priority.HasValue)
                task.Priority = request.Priority.Value;
            if (request.Category != null)
                task.Category = request.Category;
            if (request.IsPersonal.HasValue)
                task.IsPersonal = request.IsPersonal.Value;
            if (request.IsRecurring.HasValue)
                task.IsRecurring = request.IsRecurring.Value;
            if (request.RecurringInterval != null)
                task.RecurringInterval = request.RecurringInterval;
            if (request.Status.HasValue)
                task.Status = request.Status.Value;

            task.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Update assignments if specified
            if (request.AssignedUserIds != null)
            {
                // Remove existing assignments
                var existingAssignments = await _context.TaskAssignments
                    .Where(ta => ta.TaskId == taskId)
                    .ToListAsync();
                
                _context.TaskAssignments.RemoveRange(existingAssignments);
                await _context.SaveChangesAsync();

                // Add new assignments
                foreach (var assignedUserId in request.AssignedUserIds)
                {
                    var assignment = new TaskAssignment
                    {
                        TaskId = taskId,
                        UserId = assignedUserId,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.TaskAssignments.Add(assignment);
                }
                await _context.SaveChangesAsync();
            }

            await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TASKS, 
                $"Task updated: {task.Title}", userId: userId);

            return await GetTaskByIdAsync(taskId);
        }

        public async Task<bool> DeleteTaskAsync(string taskId, string userId)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
            {
                return false;
            }

            // Check if user is task creator or team leader
            if (task.CreatorId != userId && !string.IsNullOrEmpty(task.TeamId))
            {
                var team = await _context.Teams.FindAsync(task.TeamId);
                if (team == null || team.LeaderId != userId)
                {
                    throw new Exception("User is not authorized to delete this task");
                }
            }
            else if (task.CreatorId != userId)
            {
                throw new Exception("User is not authorized to delete this task");
            }

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TASKS, 
                $"Task deleted: {task.Title}", userId: userId);

            return true;
        }

        public async Task<TaskDto> CompleteTaskAsync(string taskId, string userId, CompleteTaskRequest request)
        {
            var task = await _context.Tasks
                .Include(t => t.Assignments)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
            {
                throw new Exception("Task not found");
            }

            // Check if user is assigned to the task or is the creator
            var assignment = task.Assignments.FirstOrDefault(a => a.UserId == userId);
            if (assignment == null && task.CreatorId != userId)
            {
                throw new Exception("User is not assigned to this task");
            }

            // Update assignment status
            if (assignment != null)
            {
                assignment.Completed = request.Completed;
                assignment.CompletedAt = request.Completed ? DateTime.UtcNow : null;
            }

            // Update task status
            task.Status = request.Completed ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS;
            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Award XP if task is completed
            if (request.Completed)
            {
                var user = await _context.Users.FindAsync(userId);
                if (user != null)
                {
                    user.TotalXP += task.XP;
                    user.Level = CalculateLevel(user.TotalXP);
                    user.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TASKS, 
                        $"Task completed: {task.Title}, XP awarded: {task.XP}", userId: userId);
                }
            }

            return await GetTaskByIdAsync(taskId);
        }

        public async Task<TaskDto> AssignTaskAsync(string taskId, string userId, AssignTaskRequest request)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
            {
                throw new Exception("Task not found");
            }

            // Check if user is task creator or team member
            if (task.CreatorId != userId && !string.IsNullOrEmpty(task.TeamId))
            {
                var isTeamMember = await _context.TeamMembers
                    .AnyAsync(tm => tm.TeamId == task.TeamId && tm.UserId == userId);
                
                if (!isTeamMember)
                {
                    throw new Exception("User is not authorized to assign this task");
                }
            }
            else if (task.CreatorId != userId)
            {
                throw new Exception("User is not authorized to assign this task");
            }

            // Remove existing assignments
            var existingAssignments = await _context.TaskAssignments
                .Where(ta => ta.TaskId == taskId)
                .ToListAsync();
            
            _context.TaskAssignments.RemoveRange(existingAssignments);
            await _context.SaveChangesAsync();

            // Add new assignments
            foreach (var assignedUserId in request.UserIds)
            {
                var assignment = new TaskAssignment
                {
                    TaskId = taskId,
                    UserId = assignedUserId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.TaskAssignments.Add(assignment);
            }
            await _context.SaveChangesAsync();

            await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TASKS, 
                $"Task assigned: {task.Title} to {request.UserIds.Count} users", userId: userId);

            return await GetTaskByIdAsync(taskId);
        }

        public async Task<List<TaskDto>> GetTasksByStatusAsync(TaskStatus status)
        {
            var tasks = await _context.Tasks
                .Include(t => t.Creator)
                .Include(t => t.Team)
                .Include(t => t.Assignments)
                    .ThenInclude(a => a.User)
                .Where(t => t.Status == status)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return tasks.Select(MapToTaskDto).ToList();
        }

        public async Task<List<TaskDto>> GetTasksByPriorityAsync(Priority priority)
        {
            var tasks = await _context.Tasks
                .Include(t => t.Creator)
                .Include(t => t.Team)
                .Include(t => t.Assignments)
                    .ThenInclude(a => a.User)
                .Where(t => t.Priority == priority)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return tasks.Select(MapToTaskDto).ToList();
        }

        private int CalculateLevel(int totalXP)
        {
            // Simple level calculation: 100 XP per level
            return (totalXP / 100) + 1;
        }

        private TaskDto MapToTaskDto(Models.Task task)
        {
            return new TaskDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                XP = task.XP,
                DueDate = task.DueDate,
                Priority = task.Priority,
                Category = task.Category,
                IsPersonal = task.IsPersonal,
                IsRecurring = task.IsRecurring,
                RecurringInterval = task.RecurringInterval,
                Status = task.Status,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,
                CreatorId = task.CreatorId,
                TeamId = task.TeamId,
                Creator = new UserDto
                {
                    Id = task.Creator.Id,
                    Email = task.Creator.Email,
                    Name = task.Creator.Name,
                    Avatar = task.Creator.Avatar,
                    TotalXP = task.Creator.TotalXP,
                    Level = task.Creator.Level,
                    SocialBattery = task.Creator.SocialBattery,
                    Mood = task.Creator.Mood,
                    CreatedAt = task.Creator.CreatedAt,
                    UpdatedAt = task.Creator.UpdatedAt
                },
                Team = task.Team != null ? new TeamDto
                {
                    Id = task.Team.Id,
                    Name = task.Team.Name,
                    Description = task.Team.Description,
                    Avatar = task.Team.Avatar,
                    TotalXP = task.Team.TotalXP,
                    CreatedAt = task.Team.CreatedAt,
                    UpdatedAt = task.Team.UpdatedAt,
                    LeaderId = task.Team.LeaderId
                } : null,
                Assignments = task.Assignments.Select(a => new TaskAssignmentDto
                {
                    Id = a.Id,
                    Completed = a.Completed,
                    CompletedAt = a.CompletedAt,
                    CreatedAt = a.CreatedAt,
                    TaskId = a.TaskId,
                    UserId = a.UserId,
                    User = new UserDto
                    {
                        Id = a.User.Id,
                        Email = a.User.Email,
                        Name = a.User.Name,
                        Avatar = a.User.Avatar,
                        TotalXP = a.User.TotalXP,
                        Level = a.User.Level,
                        SocialBattery = a.User.SocialBattery,
                        Mood = a.User.Mood,
                        CreatedAt = a.User.CreatedAt,
                        UpdatedAt = a.User.UpdatedAt
                    }
                }).ToList()
            };
        }
    }
}