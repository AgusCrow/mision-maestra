using MisionMaestra.API.DTOs;
using MisionMaestra.API.Models;

namespace MisionMaestra.API.Services
{
    public interface ITaskService
    {
        Task<TaskDto> CreateTaskAsync(string creatorId, CreateTaskRequest request);
        Task<TaskDto> GetTaskByIdAsync(string taskId);
        Task<List<TaskDto>> GetUserTasksAsync(string userId);
        Task<List<TaskDto>> GetTeamTasksAsync(string teamId);
        Task<List<TaskDto>> GetAllTasksAsync();
        Task<TaskDto> UpdateTaskAsync(string taskId, string userId, UpdateTaskRequest request);
        Task<bool> DeleteTaskAsync(string taskId, string userId);
        Task<TaskDto> CompleteTaskAsync(string taskId, string userId, CompleteTaskRequest request);
        Task<TaskDto> AssignTaskAsync(string taskId, string userId, AssignTaskRequest request);
        Task<List<TaskDto>> GetTasksByStatusAsync(TaskStatus status);
        Task<List<TaskDto>> GetTasksByPriorityAsync(Priority priority);
    }
}