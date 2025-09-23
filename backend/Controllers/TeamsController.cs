using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MisionMaestra.API.DTOs;
using MisionMaestra.API.Services;

namespace MisionMaestra.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TeamsController : ControllerBase
    {
        private readonly ITeamService _teamService;
        private readonly ILoggingService _loggingService;

        public TeamsController(ITeamService teamService, ILoggingService loggingService)
        {
            _teamService = teamService;
            _loggingService = loggingService;
        }

        [HttpPost]
        public async Task<ActionResult<TeamDto>> CreateTeam([FromBody] CreateTeamRequest request)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var team = await _teamService.CreateTeamAsync(userId, request);
                return CreatedAtAction(nameof(GetTeamById), new { teamId = team.Id }, team);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{teamId}")]
        public async Task<ActionResult<TeamDto>> GetTeamById(string teamId)
        {
            try
            {
                var team = await _teamService.GetTeamByIdAsync(teamId);
                return Ok(team);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("my-teams")]
        public async Task<ActionResult<List<TeamDto>>> GetUserTeams()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var teams = await _teamService.GetUserTeamsAsync(userId);
                return Ok(teams);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
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

        [HttpPut("{teamId}")]
        public async Task<ActionResult<TeamDto>> UpdateTeam(string teamId, [FromBody] UpdateTeamRequest request)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var team = await _teamService.UpdateTeamAsync(teamId, userId, request);
                return Ok(team);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{teamId}")]
        public async Task<ActionResult<bool>> DeleteTeam(string teamId)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var result = await _teamService.DeleteTeamAsync(teamId, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{teamId}/invite")]
        public async Task<ActionResult<TeamInvitationDto>> InviteUser(string teamId, [FromBody] InviteUserRequest request)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var invitation = await _teamService.InviteUserAsync(teamId, userId, request);
                return CreatedAtAction(nameof(GetInvitation), new { invitationId = invitation.Id }, invitation);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("invitations")]
        public async Task<ActionResult<List<TeamInvitationDto>>> GetUserInvitations()
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var invitations = await _teamService.GetUserInvitationsAsync(userId);
                return Ok(invitations);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{teamId}/invitations")]
        public async Task<ActionResult<List<TeamInvitationDto>>> GetTeamInvitations(string teamId)
        {
            try
            {
                var invitations = await _teamService.GetTeamInvitationsAsync(teamId);
                return Ok(invitations);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("invitations/{invitationId}/respond")]
        public async Task<ActionResult<TeamInvitationDto>> RespondToInvitation(string invitationId, [FromBody] RespondToInvitationRequest request)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var invitation = await _teamService.RespondToInvitationAsync(invitationId, userId, request);
                return Ok(invitation);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{teamId}/leave")]
        public async Task<ActionResult<bool>> LeaveTeam(string teamId)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var result = await _teamService.LeaveTeamAsync(teamId, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{teamId}/members/{memberId}")]
        public async Task<ActionResult<bool>> RemoveTeamMember(string teamId, string memberId)
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var result = await _teamService.RemoveTeamMemberAsync(teamId, memberId, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("invitations/{invitationId}")]
        public async Task<ActionResult<TeamInvitationDto>> GetInvitation(string invitationId)
        {
            try
            {
                // This is a helper method - we'll need to implement it in the service
                // For now, return not found
                return NotFound();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}