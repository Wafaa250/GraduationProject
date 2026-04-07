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
    [Route("api/student-projects")]
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
                .Include(p => p.Supervisor!).ThenInclude(s => s.User)
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
                .Include(p => p.Supervisor!).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(p => p.OwnerId == student.Id);

            if (ownedProject != null)
                return Ok(new { role = "owner", project = MapToDto(ownedProject, student.Id) });

            var membership = await _db.StudentProjectMembers
                .Include(m => m.Project)
                    .ThenInclude(p => p.Owner).ThenInclude(o => o.User)
                .Include(m => m.Project)
                    .ThenInclude(p => p.Members).ThenInclude(mem => mem.Student).ThenInclude(s => s.User)
                .Include(m => m.Project)
                    .ThenInclude(p => p.Supervisor!).ThenInclude(s => s.User)
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
                .Include(p => p.Supervisor!).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            return Ok(MapToDto(project, callerProfileId));
        }

        // =====================================================================
        // GET /api/graduation-projects/{id}/members
        // Returns full team data with caller-aware management flags.
        // Accessible by any authenticated student (not owner-only).
        // =====================================================================
        [HttpGet("{id:int}/members")]
        public async Task<IActionResult> GetMembers(int id)
        {
            var callerProfile = await GetStudentProfileAsync();

            var project = await _db.StudentProjects
                .Include(p => p.Members).ThenInclude(m => m.Student).ThenInclude(s => s.User)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            // ── Caller-aware flags ────────────────────────────────────────────
            var isOwner = callerProfile != null && project.OwnerId == callerProfile.Id;
            var isLeader = callerProfile != null && project.Members
                .Any(m => m.StudentId == callerProfile.Id && m.Role == "leader");

            // ── Capacity ──────────────────────────────────────────────────────
            var totalCapacity = project.PartnersCount;
            var currentMembers = project.Members.Count;
            var remainingSeats = Math.Max(0, totalCapacity - currentMembers);
            var isFull = currentMembers >= totalCapacity;

            // ── Members list — leader first, then by joinedAt ─────────────────
            var members = (project.Members ?? new List<StudentProjectMember>())
                .OrderBy(m => m.Role == "leader" ? 0 : 1)
                .ThenBy(m => m.JoinedAt)
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
                currentMembers,
                totalCapacity,
                remainingSeats,
                isFull,
                isOwner,
                isLeader,
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

            var project = await _db.StudentProjects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            if (project.OwnerId != owner.Id)
                return StatusCode(403, new { message = "Not authorized." });

            var allStudents = await _db.StudentProfiles
                .Include(s => s.User)
                .Where(s => s.UserId != owner.UserId)
                .ToListAsync();

            var pendingInviteReceiverIds = await _db.ProjectInvitations
                .Where(i => i.ProjectId == projectId && i.Status == "pending")
                .Select(i => i.ReceiverId)
                .ToListAsync();

            var memberIds = project.Members.Select(m => m.StudentId).ToHashSet();
            var isProjectFull = project.Members.Count >= project.PartnersCount;

            var ownerIds = SkillHelper.ParseIntList(owner.Roles)
                .Concat(SkillHelper.ParseIntList(owner.TechnicalSkills))
                .Concat(SkillHelper.ParseIntList(owner.Tools))
                .ToList();

            var result = new List<ProjectAvailableStudentDto>();

            foreach (var s in allStudents)
            {
                var isMember = memberIds.Contains(s.Id);
                var hasPendingInvite = pendingInviteReceiverIds.Contains(s.Id);
                var isOwnerStudent = s.Id == project.OwnerId;

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
                    Name = s.User?.Name ?? "",
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
        // [AI HOOK] Future: replace or augment this rule-based score with a
        //           real AI model that considers experience, availability, etc.
        // =====================================================================
        [HttpGet("{projectId:int}/recommended-students")]
        public async Task<IActionResult> GetRecommendedStudents(int projectId)
        {
            var owner = await GetStudentProfileAsync();
            if (owner == null) return Forbid();

            var project = await _db.StudentProjects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            if (project.OwnerId != owner.Id)
                return StatusCode(403, new { message = "Not authorized." });

            var projectSkillIds = await GetProjectSkillIdsAsync(project.RequiredSkills);
            var hasRequirements = projectSkillIds.Count > 0;

            var allStudents = await _db.StudentProfiles
                .Include(s => s.User)
                .Where(s => s.UserId != owner.UserId)
                .ToListAsync();

            var pendingInviteReceiverIds = await _db.ProjectInvitations
                .Where(i => i.ProjectId == projectId && i.Status == "pending")
                .Select(i => i.ReceiverId)
                .ToListAsync();

            var memberIds = project.Members.Select(m => m.StudentId).ToHashSet();
            var isProjectFull = project.Members.Count >= project.PartnersCount;

            var allRoleIds = allStudents
                .SelectMany(s => SkillHelper.ParseIntList(s.Roles).Take(4))
                .Distinct()
                .ToList();

            var skillNameMap = await _db.Skills
                .Where(sk => allRoleIds.Contains(sk.Id))
                .ToDictionaryAsync(sk => sk.Id, sk => sk.Name);

            var result = new List<ProjectAvailableStudentDto>();

            foreach (var s in allStudents)
            {
                var isMember = memberIds.Contains(s.Id);
                var hasPendingInvite = pendingInviteReceiverIds.Contains(s.Id);
                var isOwnerStudent = s.Id == project.OwnerId;

                var studentSkillIds = SkillHelper.ParseIntList(s.Roles)
                    .Concat(SkillHelper.ParseIntList(s.TechnicalSkills))
                    .Concat(SkillHelper.ParseIntList(s.Tools))
                    .ToHashSet();

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
                    Name = s.User?.Name ?? "",
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
            var ownerNav = project.Owner;
            if (ownerNav != null)
                await _db.Entry(ownerNav).Reference(o => o.User).LoadAsync();
            await _db.Entry(project).Collection(p => p.Members).Query()
                .Include(m => m.Student).ThenInclude(s => s.User)
                .LoadAsync();
            await _db.Entry(project).Reference(p => p.Supervisor).LoadAsync();

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
                .Include(p => p.Supervisor!).ThenInclude(s => s.User)
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
        // DELETE /api/graduation-projects/{projectId}/members/{memberId}
        // Remove a member from the project team — leader only.
        // memberId = StudentProfile.Id
        // =====================================================================
        [HttpDelete("{projectId:int}/members/{memberId:int}")]
        public async Task<IActionResult> RemoveMember(int projectId, int memberId)
        {
            var caller = await GetStudentProfileAsync();
            if (caller == null) return Forbid();

            // ── 1. Project exists ─────────────────────────────────────────────
            var project = await _db.StudentProjects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            // ── 2. Current user is the leader ─────────────────────────────────
            var callerMembership = project.Members
                .FirstOrDefault(m => m.StudentId == caller.Id);

            if (callerMembership?.Role != "leader")
                return StatusCode(403, new { message = "Not authorized. Only the project leader can remove members." });

            // ── 3. Leader cannot remove themselves ────────────────────────────
            if (memberId == caller.Id)
                return BadRequest(new { message = "You cannot remove yourself from the project." });

            // ── 4. Target member exists in this project ───────────────────────
            var target = project.Members.FirstOrDefault(m => m.StudentId == memberId);

            if (target == null)
                return NotFound(new { message = "Member not found in this project." });

            // ── 5. Remove member ──────────────────────────────────────────────
            _db.StudentProjectMembers.Remove(target);
            await _db.SaveChangesAsync();

            // Count from DB after save — reliable, reflects real state
            var updatedCount = await _db.StudentProjectMembers
                .CountAsync(m => m.ProjectId == projectId);

            return Ok(new
            {
                message = "Member removed successfully.",
                currentMembers = updatedCount
            });
        }

        // =====================================================================
        // PUT /api/graduation-projects/{projectId}/change-leader/{memberId}
        // Transfer leadership to another team member — current leader only.
        // memberId = StudentProfile.Id of the new leader
        // =====================================================================
        [HttpPut("{projectId:int}/change-leader/{memberId:int}")]
        public async Task<IActionResult> ChangeLeader(int projectId, int memberId)
        {
            var caller = await GetStudentProfileAsync();
            if (caller == null) return Forbid();

            // ── 1. Project exists + load members ─────────────────────────────
            var project = await _db.StudentProjects
                .Include(p => p.Members)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            // ── 2. Current user is the leader ─────────────────────────────────
            var callerMembership = project.Members
                .FirstOrDefault(m => m.StudentId == caller.Id);

            if (callerMembership?.Role != "leader")
                return StatusCode(403, new { message = "Not authorized. Only the project leader can transfer leadership." });

            // ── 3. Cannot assign leader to yourself ───────────────────────────
            if (memberId == caller.Id)
                return BadRequest(new { message = "You are already the leader." });

            // ── 4. Target member exists in this project ───────────────────────
            var targetMembership = project.Members
                .FirstOrDefault(m => m.StudentId == memberId);

            if (targetMembership == null)
                return NotFound(new { message = "Member not found in this project." });

            // ── 5. Transfer leadership — exactly one leader after update ──────
            callerMembership.Role = "member";
            targetMembership.Role = "leader";

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Leader updated successfully.",
                newLeaderId = memberId
            });
        }

        // =====================================================================
        // POST /api/graduation-projects/{projectId}/request-supervisor/{doctorId}
        // POST /api/student-projects/{projectId}/request-supervisor/{doctorId}
        // Send a supervision request to a doctor — leader only.
        // =====================================================================
        [HttpPost("{projectId:int}/request-supervisor/{doctorId:int}")]
        public async Task<IActionResult> RequestSupervisor(int projectId, int doctorId)
        {
            var caller = await GetStudentProfileAsync();
            if (caller == null) return Forbid();

            // ── 1. Project exists ────────────────────────────────────────────
            var project = await _db.StudentProjects
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            // ── 2. Only project leader (StudentProjectMembers) ───────────────
            var isLeader = await _db.StudentProjectMembers
                .AnyAsync(m => m.ProjectId == projectId && m.StudentId == caller.Id && m.Role == "leader");

            if (!isLeader)
                return StatusCode(403, new { message = "Not authorized. Only the project leader can send supervision requests." });

            // ── 3. Doctor exists ──────────────────────────────────────────────
            var doctorExists = await _db.DoctorProfiles
                .AnyAsync(d => d.Id == doctorId);

            if (!doctorExists)
                return NotFound(new { message = "Doctor not found." });

            // ── 4. Supervisor not already assigned ───────────────────────────
            if (project.SupervisorId != null)
                return BadRequest(new { message = "This project already has a supervisor." });

            // ── 5. No duplicate pending request for same project + doctor ─────
            var pendingExists = await _db.SupervisorRequests
                .AnyAsync(r =>
                    r.ProjectId == projectId &&
                    r.DoctorId == doctorId &&
                    r.Status == "pending");

            if (pendingExists)
                return BadRequest(new { message = "A pending supervision request already exists for this doctor." });

            // ── 6. Create request ─────────────────────────────────────────────
            var request = new SupervisorRequest
            {
                ProjectId = projectId,
                DoctorId = doctorId,
                SenderId = caller.Id,
                Status = "pending",
                CreatedAt = DateTime.UtcNow,
                RespondedAt = null
            };

            _db.SupervisorRequests.Add(request);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Supervisor request sent successfully" });
        }

        // =====================================================================
        // POST /api/graduation-projects/{projectId}/request-supervisor-cancel
        // POST /api/student-projects/{projectId}/request-supervisor-cancel
        // Send supervisor cancellation request to assigned doctor — leader only.
        // =====================================================================
        [HttpPost("{projectId:int}/request-supervisor-cancel")]
        public async Task<IActionResult> RequestSupervisorCancellation(int projectId)
        {
            var caller = await GetStudentProfileAsync();
            if (caller == null) return Forbid();

            var project = await _db.StudentProjects
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            var isLeader = await _db.StudentProjectMembers
                .AnyAsync(m => m.ProjectId == projectId && m.StudentId == caller.Id && m.Role == "leader");

            if (!isLeader)
                return StatusCode(403, new { message = "Not authorized. Only the project leader can send cancellation requests." });

            if (project.SupervisorId == null)
                return BadRequest(new { message = "This project does not have a supervisor." });

            var pendingExists = await _db.SupervisorCancellationRequests
                .AnyAsync(r =>
                    r.ProjectId == projectId &&
                    r.DoctorId == project.SupervisorId.Value &&
                    r.Status == "pending");

            if (pendingExists)
                return BadRequest(new { message = "A pending cancellation request already exists." });

            var request = new SupervisorCancellationRequest
            {
                ProjectId = projectId,
                DoctorId = project.SupervisorId.Value,
                SenderId = caller.Id,
                Status = "pending",
                CreatedAt = DateTime.UtcNow,
                RespondedAt = null
            };

            _db.SupervisorCancellationRequests.Add(request);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Cancellation request sent" });
        }

        // =====================================================================
        // GET /api/graduation-projects/{projectId}/recommended-supervisors
        // GET /api/student-projects/{projectId}/recommended-supervisors
        // Returns doctors ranked by how well they match project required skills.
        // =====================================================================

        [HttpGet("{projectId:int}/recommended-supervisors")]
        public async Task<ActionResult<IReadOnlyList<RecommendedSupervisorDto>>> GetRecommendedSupervisors(int projectId)
        {
            var caller = await GetStudentProfileAsync();
            if (caller == null) return Forbid();

            var project = await _db.StudentProjects
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound(new { message = "Project not found." });

            var isLeader = await _db.StudentProjectMembers
                .AnyAsync(m => m.ProjectId == projectId && m.StudentId == caller.Id && m.Role == "leader");

            if (!isLeader)
                return StatusCode(403, new { message = "Only project leader can view recommended supervisors." });

            var doctors = await _db.DoctorProfiles
                .Include(d => d.User)
                .AsNoTracking()
                .ToListAsync();

            var rows = doctors.Select(d => (d.Id, d.User?.Name ?? string.Empty, d.Specialization)).ToList();
            var result = RecommendedSupervisorHelper.Build(rows, project.RequiredSkills);

            return Ok(result);
        }
        // =====================================================================
        // POST /api/supervisor-requests/{id}/accept
        // POST /api/student-projects/supervisor-requests/{id}/accept
        // Accept supervision request — doctor only.
        // =====================================================================
        [HttpPost("/api/supervisor-requests/{id:int}/accept")]
        [HttpPost("/api/student-projects/supervisor-requests/{id:int}/accept")]
        public async Task<IActionResult> AcceptSupervisorRequest(int id)
        {
            if (AuthorizationHelper.GetRole(User) != "doctor")
                return StatusCode(403, new { message = "Only doctors can accept requests." });

            var doctor = await GetCurrentDoctorProfileAsync();
            if (doctor == null)
                return NotFound(new { message = "Doctor profile not found." });

            var request = await _db.SupervisorRequests
                .Include(r => r.Project)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
                return NotFound(new { message = "Request not found." });

            if (request.DoctorId != doctor.Id)
                return StatusCode(403, new { message = "Not authorized for this request." });

            if (request.Status != "pending")
                return BadRequest(new { message = "This request has already been processed." });

            if (request.Project?.SupervisorId != null)
                return BadRequest(new { message = "This project already has a supervisor." });

            request.Status = "accepted";
            request.RespondedAt = DateTime.UtcNow;
            if (request.Project != null)
                request.Project.SupervisorId = request.DoctorId;

            var otherRequests = await _db.SupervisorRequests
                .Where(r => r.ProjectId == request.ProjectId
                         && r.Status == "pending"
                         && r.Id != request.Id)
                .ToListAsync();

            foreach (var r in otherRequests)
            {
                r.Status = "rejected";
                r.RespondedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            return Ok(new { message = "Supervisor request accepted successfully" });
        }


        // =====================================================================
        // POST /api/supervisor-requests/{id}/reject
        // POST /api/student-projects/supervisor-requests/{id}/reject
        // Reject supervision request — doctor only.
        // =====================================================================
        [HttpPost("/api/supervisor-requests/{id:int}/reject")]
        [HttpPost("/api/student-projects/supervisor-requests/{id:int}/reject")]
        public async Task<IActionResult> RejectSupervisorRequest(int id)
        {
            if (AuthorizationHelper.GetRole(User) != "doctor")
                return StatusCode(403, new { message = "Only doctors can reject requests." });

            var doctor = await GetCurrentDoctorProfileAsync();
            if (doctor == null)
                return NotFound(new { message = "Doctor profile not found." });

            var request = await _db.SupervisorRequests
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
                return NotFound(new { message = "Request not found." });

            if (request.DoctorId != doctor.Id)
                return StatusCode(403, new { message = "Not authorized for this request." });

            if (request.Status != "pending")
                return BadRequest(new { message = "This request has already been processed." });

            request.Status = "rejected";
            request.RespondedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Supervisor request rejected successfully" });
        }

        // =====================================================================
        // GET /api/graduation-projects/doctors/me/requests
        // Returns all supervisor requests for the logged-in doctor.
        // =====================================================================
        [HttpGet("/api/doctors/me/requests")]
        public async Task<IActionResult> GetDoctorRequests()
        {
            // ── 1. Check role ────────────────────────────────────────────────
            if (AuthorizationHelper.GetRole(User) != "doctor")
                return StatusCode(403, new { message = "Only doctors can access this endpoint." });

            var doctor = await GetCurrentDoctorProfileAsync();
            if (doctor == null)
                return NotFound(new { message = "Doctor profile not found." });

            // ── 3. Fetch requests with related data (NO N+1) ─────────────────
            var requests = await _db.SupervisorRequests
                .Where(r => r.DoctorId == doctor.Id)
                .Include(r => r.Project)
                .Include(r => r.Sender).ThenInclude(s => s.User)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            // ── 4. Map to clean response ─────────────────────────────────────
            var result = requests.Select(r => new
            {
                requestId = r.Id,

                project = new
                {
                    projectId = r.ProjectId,
                    name = r.Project?.Name ?? "",
                    description = r.Project?.Description,
                    requiredSkills = r.Project?.RequiredSkills is { } reqJson
                        ? JsonSerializer.Deserialize<List<string>>(reqJson) ?? new List<string>()
                        : new List<string>()
                },

                sender = new
                {
                    studentId = r.SenderId,
                    name = r.Sender?.User?.Name ?? "",
                    major = r.Sender?.Major ?? "",
                    university = r.Sender?.University ?? ""
                },

                status = r.Status,
                createdAt = r.CreatedAt,
                respondedAt = r.RespondedAt
            });

            return Ok(result);
        }

        // =====================================================================
        // GET /api/doctors/me/supervisor-cancel-requests
        // Returns all supervisor cancellation requests for the logged-in doctor.
        // =====================================================================
        [HttpGet("/api/doctors/me/supervisor-cancel-requests")]
        public async Task<IActionResult> GetDoctorSupervisorCancelRequests()
        {
            if (AuthorizationHelper.GetRole(User) != "doctor")
                return StatusCode(403, new { message = "Only doctors can access this endpoint." });

            var doctor = await GetCurrentDoctorProfileAsync();
            if (doctor == null)
                return NotFound(new { message = "Doctor profile not found." });

            var requests = await _db.SupervisorCancellationRequests
                .Where(r => r.DoctorId == doctor.Id)
                .Include(r => r.Project)
                .Include(r => r.Sender).ThenInclude(s => s.User)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var result = requests.Select(r => new
            {
                requestId = r.Id,
                projectId = r.ProjectId,
                projectName = r.Project?.Name ?? "",
                studentName = r.Sender?.User?.Name ?? "",
                status = r.Status
            });

            return Ok(result);
        }

        // =====================================================================
        // POST /api/supervisor-cancel-requests/{id}/accept
        // Accept supervisor cancellation request — doctor only.
        // =====================================================================
        [HttpPost("/api/supervisor-cancel-requests/{id:int}/accept")]
        public async Task<IActionResult> AcceptSupervisorCancelRequest(int id)
        {
            if (AuthorizationHelper.GetRole(User) != "doctor")
                return StatusCode(403, new { message = "Only doctors can accept requests." });

            var doctor = await GetCurrentDoctorProfileAsync();
            if (doctor == null)
                return NotFound(new { message = "Doctor profile not found." });

            var request = await _db.SupervisorCancellationRequests
                .Include(r => r.Project)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
                return NotFound(new { message = "Request not found." });

            if (request.DoctorId != doctor.Id)
                return StatusCode(403, new { message = "Not authorized for this request." });

            if (request.Status != "pending")
                return BadRequest(new { message = "This request has already been processed." });

            request.Status = "accepted";
            request.RespondedAt = DateTime.UtcNow;
            if (request.Project != null)
                request.Project.SupervisorId = null;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Supervisor removed successfully" });
        }

        // =====================================================================
        // POST /api/supervisor-cancel-requests/{id}/reject
        // Reject supervisor cancellation request — doctor only.
        // =====================================================================
        [HttpPost("/api/supervisor-cancel-requests/{id:int}/reject")]
        public async Task<IActionResult> RejectSupervisorCancelRequest(int id)
        {
            if (AuthorizationHelper.GetRole(User) != "doctor")
                return StatusCode(403, new { message = "Only doctors can reject requests." });

            var doctor = await GetCurrentDoctorProfileAsync();
            if (doctor == null)
                return NotFound(new { message = "Doctor profile not found." });

            var request = await _db.SupervisorCancellationRequests
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
                return NotFound(new { message = "Request not found." });

            if (request.DoctorId != doctor.Id)
                return StatusCode(403, new { message = "Not authorized for this request." });

            if (request.Status != "pending")
                return BadRequest(new { message = "This request has already been processed." });

            request.Status = "rejected";
            request.RespondedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Cancellation request rejected" });
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

        /// <summary>Doctor profile for the current JWT user. Call only after verifying role is doctor.</summary>
        private async Task<DoctorProfile?> GetCurrentDoctorProfileAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            return await _db.DoctorProfiles.FirstOrDefaultAsync(d => d.UserId == userId);
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

                Supervisor = p.Supervisor != null ? new SupervisorDto
                {
                    DoctorId = p.Supervisor?.Id ?? 0,
                    Name = p.Supervisor?.User?.Name ?? "",
                    Specialization = p.Supervisor?.Specialization ?? ""
                } : null,

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