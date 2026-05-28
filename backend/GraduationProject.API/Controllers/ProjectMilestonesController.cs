using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/graduation-projects/{projectId:int}/milestones")]
    [Authorize]
    public class ProjectMilestonesController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IGraduationProjectNotificationService _notifications;

        public ProjectMilestonesController(
            ApplicationDbContext db,
            IGraduationProjectNotificationService notifications)
        {
            _db = db;
            _notifications = notifications;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<ProjectMilestoneResponseDto>>> GetMilestones(int projectId)
        {
            var access = await EnsureCanViewMilestones(projectId);
            if (access is not null) return access;

            var rows = await _db.ProjectMilestones
                .AsNoTracking()
                .Where(m => m.ProjectId == projectId)
                .OrderBy(m => m.DueDate == null)
                .ThenBy(m => m.DueDate)
                .ThenByDescending(m => m.CreatedAt)
                .ToListAsync();

            return Ok(rows.Select(MapMilestone).ToList());
        }

        [HttpPost]
        [Authorize(Roles = "doctor")]
        public async Task<ActionResult<ProjectMilestoneResponseDto>> CreateMilestone(
            int projectId,
            [FromBody] CreateProjectMilestoneDto dto)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var project = await EnsureDoctorCanManageMilestones(projectId);
            if (project is null)
                return StatusCode(403, new { message = "Not authorized to manage milestones for this project." });

            var milestone = new ProjectMilestone
            {
                ProjectId = projectId,
                Title = dto.Title.Trim(),
                Description = dto.Description?.Trim(),
                DueDate = dto.DueDate,
                Status = MilestoneStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _db.ProjectMilestones.Add(milestone);
            project.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var actorUserId = AuthorizationHelper.GetUserId(User);
            await _notifications.NotifyMilestoneCreatedAsync(
                projectId,
                project.Name,
                milestone.Id,
                milestone.Title,
                actorUserId);

            return Ok(MapMilestone(milestone));
        }

        [HttpPatch("{milestoneId:int}/status")]
        [Authorize(Roles = "doctor")]
        public async Task<ActionResult<ProjectMilestoneResponseDto>> UpdateMilestoneStatus(
            int projectId,
            int milestoneId,
            [FromBody] UpdateProjectMilestoneStatusDto dto)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            var project = await EnsureDoctorCanManageMilestones(projectId);
            if (project is null)
                return StatusCode(403, new { message = "Not authorized to manage milestones for this project." });

            var milestone = await _db.ProjectMilestones
                .FirstOrDefaultAsync(m => m.Id == milestoneId && m.ProjectId == projectId);

            if (milestone is null)
                return NotFound(new { message = "Milestone not found." });

            milestone.Status = ParseMilestoneStatus(dto.Status);
            project.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var actorUserId = AuthorizationHelper.GetUserId(User);
            var statusLabel = FormatMilestoneStatus(milestone.Status);
            await _notifications.NotifyMilestoneStatusChangedAsync(
                projectId,
                project.Name,
                milestone.Id,
                milestone.Title,
                statusLabel,
                actorUserId);

            return Ok(MapMilestone(milestone));
        }

        [HttpDelete("{milestoneId:int}")]
        [Authorize(Roles = "doctor")]
        public async Task<IActionResult> DeleteMilestone(int projectId, int milestoneId)
        {
            var project = await EnsureDoctorCanManageMilestones(projectId);
            if (project is null)
                return StatusCode(403, new { message = "Not authorized to manage milestones for this project." });

            var milestone = await _db.ProjectMilestones
                .FirstOrDefaultAsync(m => m.Id == milestoneId && m.ProjectId == projectId);

            if (milestone is null)
                return NotFound(new { message = "Milestone not found." });

            var title = milestone.Title;
            _db.ProjectMilestones.Remove(milestone);
            project.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var actorUserId = AuthorizationHelper.GetUserId(User);
            await _notifications.NotifyMilestoneDeletedAsync(
                projectId,
                project.Name,
                milestoneId,
                title,
                actorUserId);

            return NoContent();
        }

        private async Task<ActionResult?> EnsureCanViewMilestones(int projectId)
        {
            var role = AuthorizationHelper.GetRole(User)?.ToLowerInvariant();
            var userId = AuthorizationHelper.GetUserId(User);

            if (userId <= 0)
                return Unauthorized(new { message = "Invalid user context." });

            var project = await _db.StudentProjects
                .AsNoTracking()
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project is null)
                return NotFound(new { message = "Project not found." });

            if (role == "doctor")
            {
                var doctorId = await _db.DoctorProfiles
                    .AsNoTracking()
                    .Where(d => d.UserId == userId)
                    .Select(d => (int?)d.Id)
                    .FirstOrDefaultAsync();

                if (doctorId.HasValue && project.SupervisorId == doctorId.Value)
                    return null;
            }

            if (role == "student")
            {
                var studentId = await _db.StudentProfiles
                    .AsNoTracking()
                    .Where(s => s.UserId == userId)
                    .Select(s => (int?)s.Id)
                    .FirstOrDefaultAsync();

                if (studentId.HasValue && project.Members.Any(m => m.StudentId == studentId.Value))
                    return null;
            }

            return StatusCode(403, new { message = "Not authorized to view milestones for this project." });
        }

        private async Task<StudentProject?> EnsureDoctorCanManageMilestones(int projectId)
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0) return null;

            var doctorId = await _db.DoctorProfiles
                .AsNoTracking()
                .Where(d => d.UserId == userId)
                .Select(d => (int?)d.Id)
                .FirstOrDefaultAsync();

            if (!doctorId.HasValue) return null;

            return await _db.StudentProjects
                .FirstOrDefaultAsync(p => p.Id == projectId && p.SupervisorId == doctorId.Value);
        }

        private static MilestoneStatus ParseMilestoneStatus(string status)
        {
            return status.Trim() switch
            {
                "Pending" => MilestoneStatus.Pending,
                "In Progress" => MilestoneStatus.InProgress,
                "Completed" => MilestoneStatus.Completed,
                _ => MilestoneStatus.Pending
            };
        }

        private static string FormatMilestoneStatus(MilestoneStatus status)
        {
            return status switch
            {
                MilestoneStatus.InProgress => "In Progress",
                MilestoneStatus.Completed => "Completed",
                _ => "Pending"
            };
        }

        private static ProjectMilestoneResponseDto MapMilestone(ProjectMilestone milestone)
        {
            return new ProjectMilestoneResponseDto
            {
                Id = milestone.Id,
                ProjectId = milestone.ProjectId,
                Title = milestone.Title,
                Description = milestone.Description,
                DueDate = milestone.DueDate,
                Status = FormatMilestoneStatus(milestone.Status),
                CreatedAt = milestone.CreatedAt
            };
        }
    }
}
