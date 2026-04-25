// Controllers/CourseTeamsController.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;

namespace GraduationProject.API.Controllers
{
    /// <summary>
    /// Course Teams module.
    /// Covers:
    ///   - Student: view own team inside a course.
    ///   - Doctor:  view all teams inside an owned course.
    ///   - Leader:  remove a non-leader member from the team.
    ///
    /// Role rules:
    ///   - Doctor  → must own the course.
    ///   - Student → must be enrolled in the course.
    ///   - Leader  → must be the current leader of the team for destructive actions.
    /// </summary>
    [ApiController]
    [Route("api/courses/{courseId:int}")]
    [Authorize]
    public class CourseTeamsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public CourseTeamsController(ApplicationDbContext db) => _db = db;

        // =====================================================================
        // GET /api/courses/{courseId}/my-team
        //
        // Returns the team the current student belongs to inside the given course.
        //   - teamId, leaderId
        //   - members list  (studentId, name, role, joinedAt)
        //   - myRole        ("leader" | "member")
        // Returns 200 with null body if the student is not in any team yet.
        // =====================================================================
        [HttpGet("my-team")]
        public async Task<IActionResult> GetMyTeam(int courseId)
        {
            // ── 1. Student only ───────────────────────────────────────────────
            var student = await GetCurrentStudentProfileAsync();
            if (student == null)
                return StatusCode(403, new { message = "Only students can access this endpoint." });

            // ── 2. Course exists ──────────────────────────────────────────────
            var course = await _db.Courses.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
                return NotFound(new { message = "Course not found." });

            // ── 3. Student is enrolled ────────────────────────────────────────
            var isEnrolled = await _db.CourseEnrollments
                .AnyAsync(e => e.CourseId == courseId && e.StudentId == student.Id);

            if (!isEnrolled)
                return StatusCode(403, new { message = "You are not enrolled in this course." });

            // ── 4. Find membership row (CourseId constraint is on CourseTeamMember) ─
            var membership = await _db.CourseTeamMembers
                .AsNoTracking()
                .Include(ctm => ctm.Team)
                .Where(ctm => ctm.CourseId == courseId && ctm.StudentId == student.Id)
                .FirstOrDefaultAsync();

            if (membership == null)
                return Ok((object?)null); // not yet in a team — frontend handles null gracefully

            var team = membership.Team;

            // ── 5. Load all members of this team ──────────────────────────────
            var members = await _db.CourseTeamMembers
                .AsNoTracking()
                .Include(ctm => ctm.Student).ThenInclude(s => s.User)
                .Where(ctm => ctm.TeamId == team.Id)
                .OrderBy(ctm => ctm.StudentId == team.LeaderStudentId ? 0 : 1)
                .ThenBy(ctm => ctm.JoinedAt)
                .ToListAsync();

            var response = new
            {
                teamId   = team.Id,
                courseId = team.CourseId,
                projectSettingId = team.ProjectSettingId,
                leaderId = team.LeaderStudentId,
                myRole   = membership.Role,
                createdAt = team.CreatedAt,
                members  = members.Select(m => new
                {
                    studentId = m.StudentId,
                    userId    = m.Student?.UserId ?? 0,
                    name      = m.Student?.User?.Name ?? string.Empty,
                    role      = m.Role,
                    joinedAt  = m.JoinedAt
                }).ToList()
            };

            return Ok(response);
        }

        // =====================================================================
        // GET /api/courses/{courseId}/teams
        //
        // Returns ALL teams inside the course — doctor-only.
        // Each team includes its members and the linked project setting id.
        // =====================================================================
        [HttpGet("teams")]
        public async Task<IActionResult> GetAllTeams(int courseId)
        {
            // ── 1. Doctor only + course ownership ────────────────────────────
            var (_, error) = await GetCourseWithDoctorGuardAsync(courseId);
            if (error != null) return error;

            // ── 2. Load teams ─────────────────────────────────────────────────
            // Materialize first; JSON projection happens in memory.
            var teams = await _db.CourseTeams
                .AsNoTracking()
                .Include(t => t.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .Include(t => t.ProjectSetting)
                .Where(t => t.CourseId == courseId)
                .OrderBy(t => t.CreatedAt)
                .ToListAsync();

            var result = teams.Select(t => new
            {
                teamId           = t.Id,
                courseId         = t.CourseId,
                projectSettingId = t.ProjectSettingId,
                projectTitle     = t.ProjectSetting?.Title ?? string.Empty,
                leaderId         = t.LeaderStudentId,
                memberCount      = t.Members.Count,
                createdAt        = t.CreatedAt,
                members = t.Members
                    .OrderBy(m => m.StudentId == t.LeaderStudentId ? 0 : 1)
                    .ThenBy(m => m.JoinedAt)
                    .Select(m => new
                    {
                        studentId = m.StudentId,
                        userId    = m.Student?.UserId ?? 0,
                        name      = m.Student?.User?.Name ?? string.Empty,
                        role      = m.Role,
                        joinedAt  = m.JoinedAt
                    }).ToList()
            }).ToList();

            return Ok(result);
        }

        // =====================================================================
        // DELETE /api/courses/{courseId}/teams/{teamId}/members/{studentId}
        //
        // Remove a non-leader member from the team.
        //
        // Rules:
        //   - Only the current leader can invoke this.
        //   - The leader cannot remove themselves (use leave / resign flow instead).
        //   - Target student must actually be a member of this team.
        //   - After removal, if the team becomes empty the team row is deleted
        //     (consistent with RemoveStudentFromCourseTeamsAsync in CoursesController).
        //
        // Note: leader promotion is NOT triggered here because the leader is
        //       never the one being removed — they use a separate leave endpoint.
        // =====================================================================
        [HttpDelete("teams/{teamId:int}/members/{studentId:int}")]
        public async Task<IActionResult> RemoveMember(int courseId, int teamId, int studentId)
        {
            // ── 1. Student (leader) only ───────────────────────────────────────
            var caller = await GetCurrentStudentProfileAsync();
            if (caller == null)
                return StatusCode(403, new { message = "Only students can access this endpoint." });

            // ── 2. Course exists ──────────────────────────────────────────────
            var course = await _db.Courses.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
                return NotFound(new { message = "Course not found." });

            // ── 3. Team exists and belongs to this course ─────────────────────
            var team = await _db.CourseTeams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.Id == teamId && t.CourseId == courseId);

            if (team == null)
                return NotFound(new { message = "Team not found." });

            // ── 4. Caller is the team leader ──────────────────────────────────
            if (team.LeaderStudentId != caller.Id)
                return StatusCode(403, new { message = "Only the team leader can remove members." });

            // ── 5. Leader cannot remove themselves via this endpoint ──────────
            if (studentId == caller.Id)
                return BadRequest(new { message = "You cannot remove yourself. Use the leave team endpoint instead." });

            // ── 6. Target is a member of this team ────────────────────────────
            var targetMembership = team.Members
                .FirstOrDefault(m => m.StudentId == studentId);

            if (targetMembership == null)
                return NotFound(new { message = "Student is not a member of this team." });

            // ── 7. Remove member ───────────────────────────────────────────────
            _db.CourseTeamMembers.Remove(targetMembership);

            // ── 8. If team is now empty, delete it entirely ───────────────────
            //      (after removal, Members still includes the removed row in EF
            //       tracking, so we subtract 1 manually)
            var remainingCount = team.Members.Count - 1;
            if (remainingCount <= 0)
                _db.CourseTeams.Remove(team);

            await _db.SaveChangesAsync();

            return Ok(new { message = "Member removed from team successfully." });
        }

        // ── Private Helpers ───────────────────────────────────────────────────

        /// <summary>
        /// Resolves the student profile for the current JWT user.
        /// Returns null when the caller is not a student.
        /// </summary>
        private async Task<StudentProfile?> GetCurrentStudentProfileAsync()
        {
            if (AuthorizationHelper.GetRole(User) != "student") return null;
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
        }

        /// <summary>
        /// Resolves the doctor profile for the current JWT user.
        /// Returns null when the caller is not a doctor.
        /// </summary>
        private async Task<DoctorProfile?> GetCurrentDoctorProfileAsync()
        {
            if (AuthorizationHelper.GetRole(User) != "doctor") return null;
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.DoctorProfiles
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == userId);
        }

        /// <summary>
        /// Shared guard for doctor-only operations on a specific course.
        /// Returns (course, null) on success; (null, errorResult) on failure.
        /// Mirrors GetCourseWithDoctorGuardAsync in CoursesController.
        /// </summary>
        private async Task<(Course? course, IActionResult? error)> GetCourseWithDoctorGuardAsync(int courseId)
        {
            var doctor = await GetCurrentDoctorProfileAsync();
            if (doctor == null)
                return (null, StatusCode(403, new { message = "Only doctors can perform this action." }));

            var course = await _db.Courses.FirstOrDefaultAsync(c => c.Id == courseId);

            if (course == null)
                return (null, NotFound(new { message = "Course not found." }));

            if (course.DoctorId != doctor.Id)
                return (null, StatusCode(403, new { message = "Not authorized. You do not own this course." }));

            return (course, null);
        }

        /// <summary>
        /// Returns the CourseTeamMember row for a given student inside a course, or null.
        /// Includes the parent CourseTeam navigation.
        /// </summary>
        private async Task<CourseTeamMember?> GetTeamMembershipAsync(int courseId, int studentId)
        {
            return await _db.CourseTeamMembers
                .Include(ctm => ctm.Team)
                .FirstOrDefaultAsync(ctm => ctm.CourseId == courseId && ctm.StudentId == studentId);
        }
    }
}
