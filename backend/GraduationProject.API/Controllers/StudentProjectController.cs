// Controllers/StudentProjectController.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;

namespace GraduationProject.API.Controllers
{
    /// <summary>
    /// Core Project Engine of the platform.
    /// Handles project creation, discovery, team formation, and membership.
    ///
    /// Future integrations planned:
    ///   - AI-based project recommendations
    ///   - AI-assisted team matching
    ///   - Invitation system
    /// </summary>
    [ApiController]
    [Route("api/graduation-projects")]
    [Authorize]
    public class StudentProjectController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public StudentProjectController(ApplicationDbContext db) => _db = db;

        // =====================================================================
        // GET /api/graduation-projects
        // Project Discovery — returns all projects for browsing and search.
        // =====================================================================
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var callerProfileId = await GetCurrentStudentProfileIdAsync();

            var projects = await _db.StudentProjects
                .Include(p => p.Owner).ThenInclude(o => o.User)
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return Ok(projects.Select(p => MapToDto(p, callerProfileId)));
        }

        // =====================================================================
        // GET /api/graduation-projects/my
        // Returns the current student's project — either as owner or team member.
        // =====================================================================
        [HttpGet("my")]
        public async Task<IActionResult> GetMy()
        {
            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            var ownedProject = await _db.StudentProjects
                .Include(p => p.Owner).ThenInclude(o => o.User)
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(p => p.OwnerId == student.Id);

            if (ownedProject != null)
                return Ok(new { role = "owner", project = MapToDto(ownedProject, student.Id) });

            var membership = await _db.StudentProjectMembers
                .Include(m => m.Project)
                    .ThenInclude(p => p.Owner).ThenInclude(o => o.User)
                .Include(m => m.Project)
                    .ThenInclude(p => p.Members).ThenInclude(mem => mem.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(m => m.StudentId == student.Id);

            if (membership != null)
                return Ok(new { role = "member", project = MapToDto(membership.Project, student.Id) });

            return Ok(new { role = (string?)null, project = (object?)null });
        }

        // =====================================================================
        // GET /api/graduation-projects/{id}
        // =====================================================================
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var callerProfileId = await GetCurrentStudentProfileIdAsync();

            var project = await _db.StudentProjects
                .Include(p => p.Owner).ThenInclude(o => o.User)
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            return Ok(MapToDto(project, callerProfileId));
        }

        // =====================================================================
        // GET /api/graduation-projects/{id}/members
        // =====================================================================
        [HttpGet("{id:int}/members")]
        public async Task<IActionResult> GetMembers(int id)
        {
            var project = await _db.StudentProjects
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            var members = (project.Members ?? new List<StudentProjectMember>())
                .Select(m => new StudentProjectMemberDto
                {
                    StudentId = m.StudentId,
                    UserId = m.Student?.UserId ?? 0,
                    Name = m.Student?.User?.Name ?? "",
                    Email = m.Student?.User?.Email ?? "",
                    University = m.Student?.University ?? "",
                    Major = m.Student?.Major ?? "",
                    ProfilePicture = m.Student?.ProfilePictureBase64,
                    Role = m.Role,
                    JoinedAt = m.JoinedAt,
                })
                .ToList();

            return Ok(new
            {
                projectId = project.Id,
                currentMembers = members.Count,
                totalCapacity = project.PartnersCount,
                remainingSeats = Math.Max(0, project.PartnersCount - members.Count),
                members
            });
        }

        // =====================================================================
        // GET /api/graduation-projects/{projectId}/available-students
        // Returns all students with their invite status for a specific project.
        // Matching based on owner skills similarity.
        // Only the project owner can access.
        // =====================================================================
        [HttpGet("{projectId:int}/available-students")]
        public async Task<IActionResult> GetAvailableStudents(int projectId)
        {
            var owner = await GetStudentProfileAsync();
            if (owner == null) return Forbid();

            // ── 1. Project exists + load members ─────────────────────────────
            var project = await _db.StudentProjects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            // ── 2. Current user is the owner ──────────────────────────────────
            if (project.OwnerId != owner.Id)
                return StatusCode(403, new { message = "Not authorized." });

            // ── 3. Load all students except the owner ─────────────────────────
            var allStudents = await _db.StudentProfiles
                .Include(s => s.User)
                .Where(s => s.UserId != owner.UserId)
                .ToListAsync();

            // ── 4. Load pending invite receiver IDs for this project ──────────
            var pendingInviteReceiverIds = await _db.ProjectInvitations
                .Where(i => i.ProjectId == projectId && i.Status == "pending")
                .Select(i => i.ReceiverId)
                .ToListAsync();

            // ── 5. Pre-compute reusable values ────────────────────────────────
            var memberIds = project.Members.Select(m => m.StudentId).ToHashSet();
            var isProjectFull = project.Members.Count >= project.PartnersCount;

            // Owner's skill IDs for matchScore calculation
            var ownerIds = SkillHelper.ParseIntList(owner.Roles)
                .Concat(SkillHelper.ParseIntList(owner.TechnicalSkills))
                .Concat(SkillHelper.ParseIntList(owner.Tools))
                .ToList();

            // ── 6. Map each student to DTO ────────────────────────────────────
            var result = new List<ProjectAvailableStudentDto>();

            foreach (var s in allStudents)
            {
                var isMember = memberIds.Contains(s.Id);
                var hasPendingInvite = pendingInviteReceiverIds.Contains(s.Id);
                var isOwnerStudent = s.Id == project.OwnerId;

                // MatchScore — same logic as StudentsController
                var theirIds = SkillHelper.ParseIntList(s.Roles)
                    .Concat(SkillHelper.ParseIntList(s.TechnicalSkills))
                    .Concat(SkillHelper.ParseIntList(s.Tools))
                    .ToList();

                var common = ownerIds.Intersect(theirIds).Count();
                var complementary = theirIds.Except(ownerIds).Count();
                var matchScore = (int)(
                    (common * 0.6 / Math.Max(ownerIds.Count, 1) * 100) +
                    (complementary * 0.4 / Math.Max(theirIds.Count, 1) * 100)
                );
                matchScore = Math.Min(matchScore, 100);

                // Display names for up to 4 roles
                var roleIds = SkillHelper.ParseIntList(s.Roles).Take(4).ToList();
                var displayNames = await _db.Skills
                    .Where(sk => roleIds.Contains(sk.Id))
                    .Select(sk => sk.Name)
                    .ToListAsync();

                var canInvite = !isMember && !hasPendingInvite && !isOwnerStudent && !isProjectFull;

                result.Add(new ProjectAvailableStudentDto
                {
                    StudentId = s.Id,
                    UserId = s.UserId,
                    Name = s.User.Name,
                    Major = s.Major ?? "",
                    University = s.University ?? "",
                    AcademicYear = s.AcademicYear ?? "",
                    ProfilePicture = s.ProfilePictureBase64,
                    Skills = displayNames,
                    MatchScore = matchScore,
                    IsMember = isMember,
                    HasPendingInvite = hasPendingInvite,
                    IsOwner = isOwnerStudent,
                    IsProjectFull = isProjectFull,
                    CanInvite = canInvite,
                });
            }

            return Ok(result.OrderByDescending(s => s.MatchScore).ToList());
        }

        // =====================================================================
        // GET /api/graduation-projects/{projectId}/recommended-students
        // Returns students ranked by how well their skills match the project
        // required skills — NOT based on owner similarity.
        //
        // Improvements over basic version:
        //   - Skill names loaded once (no N+1 queries)
        //   - Graceful fallback when project has no required skills (score = 50)
        //   - No hard filter on matchScore > 0 (weaker matches stay at bottom)
        //   - Result capped at top 20 for performance
        //
        // [AI HOOK] Future: replace or augment this rule-based score with a
        //           real AI model that considers experience, availability, etc.
        // =====================================================================
        [HttpGet("{projectId:int}/recommended-students")]
        public async Task<IActionResult> GetRecommendedStudents(int projectId)
        {
            var owner = await GetStudentProfileAsync();
            if (owner == null) return Forbid();

            // ── 1. Project exists + load members ─────────────────────────────
            var project = await _db.StudentProjects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            // ── 2. Current user is the owner ──────────────────────────────────
            if (project.OwnerId != owner.Id)
                return StatusCode(403, new { message = "Not authorized." });

            // ── 3. Convert project required skill names → IDs ─────────────────
            var projectSkillIds = await GetProjectSkillIdsAsync(project.RequiredSkills);
            var hasRequirements = projectSkillIds.Count > 0;

            // ── 4. Load all students except the owner ─────────────────────────
            var allStudents = await _db.StudentProfiles
                .Include(s => s.User)
                .Where(s => s.UserId != owner.UserId)
                .ToListAsync();

            // ── 5. Load pending invite receiver IDs for this project ──────────
            var pendingInviteReceiverIds = await _db.ProjectInvitations
                .Where(i => i.ProjectId == projectId && i.Status == "pending")
                .Select(i => i.ReceiverId)
                .ToListAsync();

            // ── 6. Pre-compute reusable values ────────────────────────────────
            var memberIds = project.Members.Select(m => m.StudentId).ToHashSet();
            var isProjectFull = project.Members.Count >= project.PartnersCount;

            // ── 7. Load ALL skill names once — avoids N+1 queries ─────────────
            // Collect every role ID across all students in a single pass,
            // then fetch all names in one query instead of one per student.
            var allRoleIds = allStudents
                .SelectMany(s => SkillHelper.ParseIntList(s.Roles).Take(4))
                .Distinct()
                .ToList();

            var skillNameMap = await _db.Skills
                .Where(sk => allRoleIds.Contains(sk.Id))
                .ToDictionaryAsync(sk => sk.Id, sk => sk.Name);

            // ── 8. Map each student → score based on PROJECT skills ───────────
            var result = new List<ProjectAvailableStudentDto>();

            foreach (var s in allStudents)
            {
                var isMember = memberIds.Contains(s.Id);
                var hasPendingInvite = pendingInviteReceiverIds.Contains(s.Id);
                var isOwnerStudent = s.Id == project.OwnerId;

                // Student skill IDs from all three JSON fields
                var studentSkillIds = SkillHelper.ParseIntList(s.Roles)
                    .Concat(SkillHelper.ParseIntList(s.TechnicalSkills))
                    .Concat(SkillHelper.ParseIntList(s.Tools))
                    .ToHashSet();

                // matchScore logic:
                //   - If project has requirements → common / required * 100
                //   - If project has no requirements → neutral score 50
                //     (project is open to anyone, show all students as browsable)
                int matchScore;
                if (hasRequirements)
                {
                    var commonCount = projectSkillIds.Count(id => studentSkillIds.Contains(id));
                    matchScore = (int)Math.Min(
                        (double)commonCount / projectSkillIds.Count * 100, 100);
                }
                else
                {
                    matchScore = 50;
                }

                // Resolve display names from the pre-loaded map (no DB call here)
                var displayNames = SkillHelper.ParseIntList(s.Roles)
                    .Take(4)
                    .Where(id => skillNameMap.ContainsKey(id))
                    .Select(id => skillNameMap[id])
                    .ToList();

                var canInvite = !isMember && !hasPendingInvite && !isOwnerStudent && !isProjectFull;

                result.Add(new ProjectAvailableStudentDto
                {
                    StudentId = s.Id,
                    UserId = s.UserId,
                    Name = s.User.Name,
                    Major = s.Major ?? "",
                    University = s.University ?? "",
                    AcademicYear = s.AcademicYear ?? "",
                    ProfilePicture = s.ProfilePictureBase64,
                    Skills = displayNames,
                    MatchScore = matchScore,
                    IsMember = isMember,
                    HasPendingInvite = hasPendingInvite,
                    IsOwner = isOwnerStudent,
                    IsProjectFull = isProjectFull,
                    CanInvite = canInvite,
                });
            }

            // Sort descending by matchScore, cap at top 20
            return Ok(result
                .OrderByDescending(s => s.MatchScore)
                .Take(20)
                .ToList());
        }

        // =====================================================================
        // POST /api/graduation-projects
        // Create a new project — students only.
        // Owner is automatically inserted as the first member with Role = "leader".
        // =====================================================================
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateStudentProjectDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            var conflict = await CheckProjectConflict(student.Id);
            if (conflict != null) return conflict;

            var project = new StudentProject
            {
                OwnerId = student.Id,
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                RequiredSkills = dto.RequiredSkills.Count > 0
                                    ? JsonSerializer.Serialize(dto.RequiredSkills)
                                    : null,
                PartnersCount = dto.PartnersCount,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _db.StudentProjects.Add(project);
            await _db.SaveChangesAsync();

            var leaderExists = await _db.StudentProjectMembers
                .AnyAsync(m => m.ProjectId == project.Id && m.StudentId == project.OwnerId);

            if (!leaderExists)
            {
                _db.StudentProjectMembers.Add(new StudentProjectMember
                {
                    ProjectId = project.Id,
                    StudentId = project.OwnerId,
                    Role = "leader",
                    JoinedAt = DateTime.UtcNow,
                });
                await _db.SaveChangesAsync();
            }

            await _db.Entry(project).Reference(p => p.Owner).LoadAsync();
            await _db.Entry(project.Owner).Reference(o => o.User).LoadAsync();
            await _db.Entry(project).Collection(p => p.Members).Query()
                .Include(m => m.Student).ThenInclude(s => s.User)
                .LoadAsync();

            return StatusCode(201, MapToDto(project, student.Id));
        }

        // =====================================================================
        // PUT /api/graduation-projects/{id}
        // =====================================================================
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateStudentProjectDto dto)
        {
            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            var project = await _db.StudentProjects
                .Include(p => p.Owner).ThenInclude(o => o.User)
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            if (project.OwnerId != student.Id)
                return Forbid();

            if (dto.Name != null) project.Name = dto.Name.Trim();
            if (dto.Description != null) project.Description = dto.Description.Trim();
            if (dto.PartnersCount != null) project.PartnersCount = dto.PartnersCount.Value;
            if (dto.RequiredSkills != null)
                project.RequiredSkills = dto.RequiredSkills.Count > 0
                    ? JsonSerializer.Serialize(dto.RequiredSkills)
                    : null;

            project.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(MapToDto(project, student.Id));
        }

        // =====================================================================
        // DELETE /api/graduation-projects/{id}
        // =====================================================================
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            var project = await _db.StudentProjects
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            if (project.OwnerId != student.Id)
                return Forbid();

            _db.StudentProjects.Remove(project);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Project deleted successfully." });
        }

        // =====================================================================
        // POST /api/graduation-projects/{id}/join
        // =====================================================================
        [HttpPost("{id:int}/join")]
        public async Task<IActionResult> Join(int id)
        {
            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            var project = await _db.StudentProjects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            if (project.OwnerId == student.Id)
                return BadRequest(new { message = "You cannot join your own project as a member." });

            var alreadyInThisProject = project.Members.Any(m => m.StudentId == student.Id);
            if (alreadyInThisProject)
                return BadRequest(new { message = "You are already a member of this project." });

            var conflict = await CheckProjectConflict(student.Id);
            if (conflict != null) return conflict;

            // TotalCapacity = PartnersCount (owner counts as one of the members)
            if (project.Members.Count >= project.PartnersCount)
                return BadRequest(new { message = "This project's team is already full." });

            _db.StudentProjectMembers.Add(new StudentProjectMember
            {
                ProjectId = project.Id,
                StudentId = student.Id,
                Role = "member",
                JoinedAt = DateTime.UtcNow,
            });

            await _db.SaveChangesAsync();

            var updatedCount = project.Members.Count + 1;
            return Ok(new
            {
                message = "Successfully joined the project team.",
                currentMembers = updatedCount
            });
        }

        // =====================================================================
        // DELETE /api/graduation-projects/{id}/leave
        // =====================================================================
        [HttpDelete("{id:int}/leave")]
        public async Task<IActionResult> Leave(int id)
        {
            var student = await GetStudentProfileAsync();
            if (student == null) return Forbid();

            var membership = await _db.StudentProjectMembers
                .FirstOrDefaultAsync(m => m.ProjectId == id && m.StudentId == student.Id);

            if (membership == null)
                return NotFound(new { message = "You are not a member of this project." });

            if (membership.Role == "leader")
                return BadRequest(new { message = "Project owner cannot leave the project. Delete the project instead." });

            _db.StudentProjectMembers.Remove(membership);
            await _db.SaveChangesAsync();

            return Ok(new { message = "You have left the project team." });
        }

        // =====================================================================
        // POST /api/graduation-projects/{projectId}/invite/{receiverId}
        // =====================================================================
        [HttpPost("{projectId:int}/invite/{receiverId:int}")]
        public async Task<IActionResult> SendInvitation(int projectId, int receiverId)
        {
            var senderProfile = await GetStudentProfileAsync();
            if (senderProfile == null)
                return Forbid();

            var project = await _db.StudentProjects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            if (project.OwnerId != senderProfile.Id)
                return StatusCode(403, new { message = "Not authorized." });

            var receiverExists = await _db.StudentProfiles
                .AnyAsync(s => s.Id == receiverId);

            if (!receiverExists)
                return NotFound(new { message = "Receiver not found." });

            if (receiverId == senderProfile.Id)
                return BadRequest(new { message = "You cannot invite yourself." });

            // TotalCapacity = PartnersCount (owner counts as one of the members)
            if (project.Members.Count >= project.PartnersCount)
                return BadRequest(new { message = "Project is full." });

            var alreadyMember = project.Members.Any(m => m.StudentId == receiverId);
            if (alreadyMember)
                return BadRequest(new { message = "User already a member." });

            var pendingExists = await _db.ProjectInvitations
                .AnyAsync(i =>
                    i.ProjectId == projectId &&
                    i.ReceiverId == receiverId &&
                    i.Status == "pending");

            if (pendingExists)
                return Conflict(new { message = "Invitation already sent." });

            var invitation = new ProjectInvitation
            {
                ProjectId = projectId,
                SenderId = senderProfile.Id,
                ReceiverId = receiverId,
                Status = "pending",
                CreatedAt = DateTime.UtcNow,
                RespondedAt = null
            };

            _db.ProjectInvitations.Add(invitation);
            await _db.SaveChangesAsync();

            return StatusCode(201, new
            {
                message = "Invitation sent successfully.",
                invitationId = invitation.Id
            });
        }

        // ── Private Helpers ───────────────────────────────────────────────────

        private async Task<StudentProfile?> GetStudentProfileAsync()
        {
            if (AuthorizationHelper.GetRole(User) != "student") return null;
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
        }

        private async Task<int?> GetCurrentStudentProfileIdAsync()
        {
            if (AuthorizationHelper.GetRole(User) != "student") return null;
            var userId = AuthorizationHelper.GetUserId(User);
            var profile = await _db.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.UserId == userId);
            return profile?.Id;
        }

        private async Task<IActionResult?> CheckProjectConflict(int studentId)
        {
            var ownsProject = await _db.StudentProjects
                .AnyAsync(p => p.OwnerId == studentId);
            if (ownsProject)
                return Conflict(new { message = "You already own a project." });

            var isMember = await _db.StudentProjectMembers
                .AnyAsync(m => m.StudentId == studentId);
            if (isMember)
                return Conflict(new { message = "You are already a member of another project." });

            return null;
        }

        /// <summary>
        /// Converts a JSON array of skill name strings (from StudentProject.RequiredSkills)
        /// into a list of skill IDs from the Skills table.
        /// Returns empty list if RequiredSkills is null or empty.
        /// </summary>
        private async Task<List<int>> GetProjectSkillIdsAsync(string? requiredSkillsJson)
        {
            if (string.IsNullOrEmpty(requiredSkillsJson))
                return new List<int>();

            var skillNames = JsonSerializer.Deserialize<List<string>>(requiredSkillsJson) ?? new();

            if (skillNames.Count == 0)
                return new List<int>();

            return await _db.Skills
                .Where(sk => skillNames.Contains(sk.Name))
                .Select(sk => sk.Id)
                .ToListAsync();
        }

        /// <summary>
        /// Maps a StudentProject entity to its response DTO.
        ///
        /// Capacity logic:
        ///   PartnersCount  = total team size (owner included)
        ///   IsFull         = CurrentMembers >= PartnersCount
        ///   RemainingSeats = max(0, PartnersCount - CurrentMembers)
        /// </summary>
        private static StudentProjectResponseDto MapToDto(StudentProject p, int? callerProfileId)
        {
            var members = p.Members?.ToList() ?? new();
            var totalCapacity = p.PartnersCount;
            var currentCount = members.Count;

            return new StudentProjectResponseDto
            {
                Id = p.Id,
                OwnerId = p.OwnerId,
                OwnerUserId = p.Owner?.UserId ?? 0,
                OwnerName = p.Owner?.User?.Name ?? "",
                Name = p.Name,
                Description = p.Description,
                RequiredSkills = p.RequiredSkills != null
                    ? JsonSerializer.Deserialize<List<string>>(p.RequiredSkills) ?? new()
                    : new(),
                PartnersCount = p.PartnersCount,
                CurrentMembers = currentCount,
                IsFull = currentCount >= totalCapacity,
                IsOwner = callerProfileId.HasValue && p.OwnerId == callerProfileId.Value,
                RemainingSeats = Math.Max(0, totalCapacity - currentCount),
                Members = members.Select(m => new StudentProjectMemberDto
                {
                    StudentId = m.StudentId,
                    UserId = m.Student?.UserId ?? 0,
                    Name = m.Student?.User?.Name ?? "",
                    Email = m.Student?.User?.Email ?? "",
                    University = m.Student?.University ?? "",
                    Major = m.Student?.Major ?? "",
                    ProfilePicture = m.Student?.ProfilePictureBase64,
                    Role = m.Role,
                    JoinedAt = m.JoinedAt,
                }).ToList(),
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt,
            };
        }
    }
}