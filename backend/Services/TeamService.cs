using Microsoft.EntityFrameworkCore;
using MisionMaestra.API.DTOs;
using MisionMaestra.API.Models;
using Serilog;

namespace MisionMaestra.API.Services
{
    public class TeamService : ITeamService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILoggingService _loggingService;

        public TeamService(ApplicationDbContext context, ILoggingService loggingService)
        {
            _context = context;
            _loggingService = loggingService;
        }

        public async Task<TeamDto> CreateTeamAsync(string leaderId, CreateTeamRequest request)
        {
            try
            {
                var team = new Team
                {
                    Name = request.Name,
                    Description = request.Description,
                    Avatar = request.Avatar,
                    LeaderId = leaderId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Teams.Add(team);
                await _context.SaveChangesAsync();

                // Add leader as team member
                var teamMember = new TeamMember
                {
                    UserId = leaderId,
                    TeamId = team.Id,
                    Role = TeamRole.LEADER,
                    JoinedAt = DateTime.UtcNow
                };

                _context.TeamMembers.Add(teamMember);
                await _context.SaveChangesAsync();

                await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TEAMS, 
                    $"Team created: {team.Name}", userId: leaderId);

                return await GetTeamByIdAsync(team.Id);
            }
            catch (Exception ex)
            {
                await _loggingService.LogAsync(LogLevel.ERROR, LogCategory.TEAMS, 
                    $"Team creation failed: {ex.Message}", userId: leaderId);
                throw;
            }
        }

        public async Task<TeamDto> GetTeamByIdAsync(string teamId)
        {
            var team = await _context.Teams
                .Include(t => t.Leader)
                .Include(t => t.Members)
                    .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(t => t.Id == teamId);

            if (team == null)
            {
                throw new Exception("Team not found");
            }

            return MapToTeamDto(team);
        }

        public async Task<List<TeamDto>> GetUserTeamsAsync(string userId)
        {
            var teams = await _context.TeamMembers
                .Where(tm => tm.UserId == userId)
                .Include(tm => tm.Team)
                    .ThenInclude(t => t.Leader)
                .Include(tm => tm.Team)
                    .ThenInclude(t => t.Members)
                        .ThenInclude(m => m.User)
                .Select(tm => tm.Team)
                .ToListAsync();

            return teams.Select(MapToTeamDto).ToList();
        }

        public async Task<List<TeamDto>> GetAllTeamsAsync()
        {
            var teams = await _context.Teams
                .Include(t => t.Leader)
                .Include(t => t.Members)
                    .ThenInclude(m => m.User)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return teams.Select(MapToTeamDto).ToList();
        }

        public async Task<TeamDto> UpdateTeamAsync(string teamId, string userId, UpdateTeamRequest request)
        {
            var team = await _context.Teams.FindAsync(teamId);
            if (team == null)
            {
                throw new Exception("Team not found");
            }

            // Check if user is team leader
            if (team.LeaderId != userId)
            {
                throw new Exception("Only team leader can update team");
            }

            // Update fields
            if (request.Name != null)
                team.Name = request.Name;
            if (request.Description != null)
                team.Description = request.Description;
            if (request.Avatar != null)
                team.Avatar = request.Avatar;

            team.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TEAMS, 
                $"Team updated: {team.Name}", userId: userId);

            return await GetTeamByIdAsync(teamId);
        }

        public async Task<bool> DeleteTeamAsync(string teamId, string userId)
        {
            var team = await _context.Teams.FindAsync(teamId);
            if (team == null)
            {
                return false;
            }

            // Check if user is team leader
            if (team.LeaderId != userId)
            {
                throw new Exception("Only team leader can delete team");
            }

            _context.Teams.Remove(team);
            await _context.SaveChangesAsync();

            await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TEAMS, 
                $"Team deleted: {team.Name}", userId: userId);

            return true;
        }

        public async Task<TeamInvitationDto> InviteUserAsync(string teamId, string senderId, InviteUserRequest request)
        {
            var team = await _context.Teams.FindAsync(teamId);
            if (team == null)
            {
                throw new Exception("Team not found");
            }

            // Check if sender is team member
            var isMember = await _context.TeamMembers
                .AnyAsync(tm => tm.TeamId == teamId && tm.UserId == senderId);
            
            if (!isMember)
            {
                throw new Exception("Only team members can invite users");
            }

            // Check if user exists
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                throw new Exception("User not found");
            }

            // Check if user is already a team member
            var isAlreadyMember = await _context.TeamMembers
                .AnyAsync(tm => tm.TeamId == teamId && tm.UserId == request.UserId);
            
            if (isAlreadyMember)
            {
                throw new Exception("User is already a team member");
            }

            // Check if there's already a pending invitation
            var existingInvitation = await _context.TeamInvitations
                .AnyAsync(ti => ti.TeamId == teamId && ti.ReceiverId == request.UserId && ti.Status == InvitationStatus.PENDING);
            
            if (existingInvitation)
            {
                throw new Exception("User already has a pending invitation");
            }

            var invitation = new TeamInvitation
            {
                TeamId = teamId,
                SenderId = senderId,
                ReceiverId = request.UserId,
                Message = request.Message,
                Status = InvitationStatus.PENDING,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.TeamInvitations.Add(invitation);
            await _context.SaveChangesAsync();

            await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TEAMS, 
                $"Team invitation sent: {team.Name} to {user.Email}", userId: senderId);

            return await GetInvitationDtoAsync(invitation.Id);
        }

        public async Task<TeamInvitationDto> RespondToInvitationAsync(string invitationId, string userId, RespondToInvitationRequest request)
        {
            var invitation = await _context.TeamInvitations
                .Include(ti => ti.Team)
                .FirstOrDefaultAsync(ti => ti.Id == invitationId);

            if (invitation == null)
            {
                throw new Exception("Invitation not found");
            }

            // Check if user is the receiver
            if (invitation.ReceiverId != userId)
            {
                throw new Exception("Only the receiver can respond to invitation");
            }

            // Check if invitation is still pending
            if (invitation.Status != InvitationStatus.PENDING)
            {
                throw new Exception("Invitation is no longer pending");
            }

            invitation.Status = request.Accept ? InvitationStatus.ACCEPTED : InvitationStatus.REJECTED;
            invitation.UpdatedAt = DateTime.UtcNow;

            if (request.Accept)
            {
                // Add user to team
                var teamMember = new TeamMember
                {
                    UserId = userId,
                    TeamId = invitation.TeamId,
                    Role = TeamRole.MEMBER,
                    JoinedAt = DateTime.UtcNow
                };

                _context.TeamMembers.Add(teamMember);
            }

            await _context.SaveChangesAsync();

            await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TEAMS, 
                $"Team invitation {request.Accept ? "accepted" : "rejected"}: {invitation.Team.Name}", userId: userId);

            return await GetInvitationDtoAsync(invitationId);
        }

        public async Task<List<TeamInvitationDto>> GetUserInvitationsAsync(string userId)
        {
            var invitations = await _context.TeamInvitations
                .Include(ti => ti.Sender)
                .Include(ti => ti.Receiver)
                .Include(ti => ti.Team)
                .Where(ti => ti.ReceiverId == userId)
                .OrderByDescending(ti => ti.CreatedAt)
                .ToListAsync();

            return invitations.Select(MapToInvitationDto).ToList();
        }

        public async Task<List<TeamInvitationDto>> GetTeamInvitationsAsync(string teamId)
        {
            var invitations = await _context.TeamInvitations
                .Include(ti => ti.Sender)
                .Include(ti => ti.Receiver)
                .Include(ti => ti.Team)
                .Where(ti => ti.TeamId == teamId)
                .OrderByDescending(ti => ti.CreatedAt)
                .ToListAsync();

            return invitations.Select(MapToInvitationDto).ToList();
        }

        public async Task<bool> LeaveTeamAsync(string teamId, string userId)
        {
            var teamMember = await _context.TeamMembers
                .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == userId);

            if (teamMember == null)
            {
                return false;
            }

            // Check if user is team leader
            var team = await _context.Teams.FindAsync(teamId);
            if (team != null && team.LeaderId == userId)
            {
                throw new Exception("Team leader cannot leave team. Please transfer leadership first.");
            }

            _context.TeamMembers.Remove(teamMember);
            await _context.SaveChangesAsync();

            await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TEAMS, 
                $"User left team: {team?.Name}", userId: userId);

            return true;
        }

        public async Task<bool> RemoveTeamMemberAsync(string teamId, string memberId, string requesterId)
        {
            var team = await _context.Teams.FindAsync(teamId);
            if (team == null)
            {
                throw new Exception("Team not found");
            }

            // Check if requester is team leader
            if (team.LeaderId != requesterId)
            {
                throw new Exception("Only team leader can remove members");
            }

            var teamMember = await _context.TeamMembers
                .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == memberId);

            if (teamMember == null)
            {
                return false;
            }

            _context.TeamMembers.Remove(teamMember);
            await _context.SaveChangesAsync();

            await _loggingService.LogAsync(LogLevel.INFO, LogCategory.TEAMS, 
                $"Team member removed: {team.Name}", userId: requesterId);

            return true;
        }

        private async Task<TeamInvitationDto> GetInvitationDtoAsync(string invitationId)
        {
            var invitation = await _context.TeamInvitations
                .Include(ti => ti.Sender)
                .Include(ti => ti.Receiver)
                .Include(ti => ti.Team)
                .FirstOrDefaultAsync(ti => ti.Id == invitationId);

            if (invitation == null)
            {
                throw new Exception("Invitation not found");
            }

            return MapToInvitationDto(invitation);
        }

        private TeamDto MapToTeamDto(Team team)
        {
            return new TeamDto
            {
                Id = team.Id,
                Name = team.Name,
                Description = team.Description,
                Avatar = team.Avatar,
                TotalXP = team.TotalXP,
                CreatedAt = team.CreatedAt,
                UpdatedAt = team.UpdatedAt,
                LeaderId = team.LeaderId,
                Leader = new UserDto
                {
                    Id = team.Leader.Id,
                    Email = team.Leader.Email,
                    Name = team.Leader.Name,
                    Avatar = team.Leader.Avatar,
                    TotalXP = team.Leader.TotalXP,
                    Level = team.Leader.Level,
                    SocialBattery = team.Leader.SocialBattery,
                    Mood = team.Leader.Mood,
                    CreatedAt = team.Leader.CreatedAt,
                    UpdatedAt = team.Leader.UpdatedAt
                },
                Members = team.Members.Select(m => new TeamMemberDto
                {
                    Id = m.Id,
                    Role = m.Role,
                    JoinedAt = m.JoinedAt,
                    UserId = m.UserId,
                    User = new UserDto
                    {
                        Id = m.User.Id,
                        Email = m.User.Email,
                        Name = m.User.Name,
                        Avatar = m.User.Avatar,
                        TotalXP = m.User.TotalXP,
                        Level = m.User.Level,
                        SocialBattery = m.User.SocialBattery,
                        Mood = m.User.Mood,
                        CreatedAt = m.User.CreatedAt,
                        UpdatedAt = m.User.UpdatedAt
                    }
                }).ToList()
            };
        }

        private TeamInvitationDto MapToInvitationDto(TeamInvitation invitation)
        {
            return new TeamInvitationDto
            {
                Id = invitation.Id,
                Status = invitation.Status,
                Message = invitation.Message,
                CreatedAt = invitation.CreatedAt,
                UpdatedAt = invitation.UpdatedAt,
                SenderId = invitation.SenderId,
                ReceiverId = invitation.ReceiverId,
                TeamId = invitation.TeamId,
                Sender = new UserDto
                {
                    Id = invitation.Sender.Id,
                    Email = invitation.Sender.Email,
                    Name = invitation.Sender.Name,
                    Avatar = invitation.Sender.Avatar,
                    TotalXP = invitation.Sender.TotalXP,
                    Level = invitation.Sender.Level,
                    SocialBattery = invitation.Sender.SocialBattery,
                    Mood = invitation.Sender.Mood,
                    CreatedAt = invitation.Sender.CreatedAt,
                    UpdatedAt = invitation.Sender.UpdatedAt
                },
                Receiver = new UserDto
                {
                    Id = invitation.Receiver.Id,
                    Email = invitation.Receiver.Email,
                    Name = invitation.Receiver.Name,
                    Avatar = invitation.Receiver.Avatar,
                    TotalXP = invitation.Receiver.TotalXP,
                    Level = invitation.Receiver.Level,
                    SocialBattery = invitation.Receiver.SocialBattery,
                    Mood = invitation.Receiver.Mood,
                    CreatedAt = invitation.Receiver.CreatedAt,
                    UpdatedAt = invitation.Receiver.UpdatedAt
                },
                Team = new TeamDto
                {
                    Id = invitation.Team.Id,
                    Name = invitation.Team.Name,
                    Description = invitation.Team.Description,
                    Avatar = invitation.Team.Avatar,
                    TotalXP = invitation.Team.TotalXP,
                    CreatedAt = invitation.Team.CreatedAt,
                    UpdatedAt = invitation.Team.UpdatedAt,
                    LeaderId = invitation.Team.LeaderId
                }
            };
        }
    }
}