using MisionMaestra.API.DTOs;
using MisionMaestra.API.Models;

namespace MisionMaestra.API.Services
{
    public interface ILoggingService
    {
        Task LogAsync(LogLevel level, LogCategory category, string message, string? details = null, string? userId = null, string? ipAddress = null);
        Task<List<ServerLogDto>> GetLogsAsync(DashboardFilterRequest filter);
        Task<ServerStatsDto> GetServerStatsAsync();
        Task CleanupOldLogsAsync(int daysToKeep = 30);
    }
}