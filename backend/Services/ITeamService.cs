using MisionMaestra.API.DTOs;
using MisionMaestra.API.Models;

namespace MisionMaestra.API.Services
{
    public interface ITeamService
    {
        Task<TeamDto> CreateTeamAsync(string leaderId, CreateTeamRequest request);
        Task<TeamDto> GetTeamByIdAsync(string teamId);
        Task<List<TeamDto>> GetUserTeamsAsync(string userId);
        Task<List<TeamDto>> GetAllTeamsAsync();
        Task<TeamDto> UpdateTeamAsync(string teamId, string userId, UpdateTeamRequest request);
        Task<bool> DeleteTeamAsync(string teamId, string userId);
        Task<TeamInvitationDto> InviteUserAsync(string teamId, string senderId, InviteUserRequest request);
        Task<TeamInvitationDto> RespondToInvitationAsync(string invitationId, string userId, RespondToInvitationRequest request);
        Task<List<TeamInvitationDto>> GetUserInvitationsAsync(string userId);
        Task<List<TeamInvitationDto>> GetTeamInvitationsAsync(string teamId);
        Task<bool> LeaveTeamAsync(string teamId, string userId);
        Task<bool> RemoveTeamMemberAsync(string teamId, string memberId, string requesterId);
    }
}