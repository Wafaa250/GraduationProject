// Controllers/CoursePartnerRequestsController.cs
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using System.ComponentModel.DataAnnotations;

// ── REMOVED in this cleanup phase ─────────────────────────────────────────────
//   ResolveTeamSizeAsync        — read CourseProjectSetting / SectionProjectSetting
//   ValidateSameSectionAsync    — read Course.UseSharedProjectAcrossSections
//   CheckTeamNotFullAsync overload with (useProjectSetting: bool)
//                               — scoped by CourseTeamMember.ProjectSettingId
//
// ── KEPT (tables + models still exist in DB) ──────────────────────────────────
//   CourseProjectSetting, SectionProjectSetting models and DbSets are untouched.
//   ProjectSettingId columns on CourseTeam / CourseTeamMember still exist (nullable).
//   They are simply no longer written or read by this controller.
// ─────────────────────────────────────────────────────────────────────────────

namespace GraduationProject.API.Controllers
{
    /// <summary>
    /// Partner Request flow inside a course — student-to-student team-up requests.
    ///
    /// Endpoints
    /// ──────────
    ///   POST   /api/courses/{courseId}/partner-requests                      → Send
    ///   GET    /api/courses/{courseId}/partner-requests                      → List (mine)
    ///   POST   /api/courses/{courseId}/partner-requests/{requestId}/accept   → Accept
    ///   POST   /api/courses/{courseId}/partner-requests/{requestId}/reject   → Reject
    ///
    /// All logic is now exclusively CourseProject-based:
    ///   • TeamSize          → CourseProject.TeamSize
    ///   • Section rules     → CourseProject.AllowCrossSectionTeams / ApplyToAllSections
    ///   • Team membership   → CourseTeam.CourseProjectId
    ///   • Cancellation      → scoped to CoursePartnerRequest.CourseProjectId
    ///
    /// Accept logic — three cases (behaviour unchanged from original):
    ///   Case 1: Neither has a team → create a new team, sender = leader, add both.
    ///   Case 2: Sender has a team  → add receiver to sender's existing team.
    ///   Case 3: Receiver has a team → add sender to receiver's existing team.
    /// </summary>
    [ApiController]
    [Route("api/courses/{courseId:int}/partner-requests")]
    [Authorize]
    public class CoursePartnerRequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public CoursePartnerRequestsController(ApplicationDbContext db) => _db = db;

        // =====================================================================
        // POST /api/courses/{courseId}/partner-requests
        //
        // Send a partner request to another enrolled student.
        //
        // Body: { "receiverStudentId": "<university id string>", "courseProjectId": <int> }
        //
        // Validations (all must pass):
        //   ✓ CourseProject exists and belongs to this course.
        //   ✓ Both students are enrolled in the course and assigned to a section.
        //   ✓ Cannot send to self.
        //   ✓ Section rules derived from CourseProject.
        //   ✓ No existing pending request between this pair for the same project.
        //   ✓ Sender is not already in a full team for this project.
        //   ✓ Receiver is not already in a full team for this project.
        // =====================================================================
        [HttpPost]
        public async Task<IActionResult> SendPartnerRequest(
            int courseId,
            [FromBody] SendPartnerRequestDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // ── 1. Student only + enrollment guard ────────────────────────────
            var (sender, enrollError) = await GetEnrolledStudentAsync(courseId);
            if (enrollError != null) return enrollError;
            var senderProfile = sender!;

            // ── 2. Load and validate the CourseProject ────────────────────────
            var project = await _db.CourseProjects
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == dto.CourseProjectId && p.CourseId == courseId);

            if (project == null)
                return NotFound(new { message = "Project not found or does not belong to this course." });

            var teamSize = project.TeamSize;

            // ── 3. Resolve receiver by university student id string ───────────
            var receiverProfile = await _db.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.StudentId == dto.ReceiverStudentId.Trim());

            if (receiverProfile == null)
                return NotFound(new { message = "Receiver student not found." });

            // ── 4. Cannot send to self ────────────────────────────────────────
            if (receiverProfile.Id == senderProfile.Id)
                return BadRequest(new { message = "You cannot send a partner request to yourself." });

            // ── 5. Load both enrollments ──────────────────────────────────────
            var senderEnrollment = await _db.CourseEnrollments
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == senderProfile.Id);

            var receiverEnrollment = await _db.CourseEnrollments
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == receiverProfile.Id);

            if (senderEnrollment == null)
                return BadRequest(new { message = "You are not enrolled in this course." });

            if (receiverEnrollment == null)
                return BadRequest(new { message = "The receiver is not enrolled in this course." });

            // ── 6. Both students must be assigned to a section ────────────────
            if (senderEnrollment.CourseSectionId == null || receiverEnrollment.CourseSectionId == null)
                return BadRequest(new
                {
                    message = "Students must be assigned to a section before sending requests."
                });

            // ── 7. Section enforcement from CourseProject ─────────────────────
            var sectionError = await ValidateSectionForProjectAsync(
                courseId, project,
                senderProfile.Id, receiverProfile.Id,
                senderEnrollment.CourseSectionId.Value,
                receiverEnrollment.CourseSectionId.Value);
            if (sectionError != null) return sectionError;

            // ── 8. No existing pending request between this pair for this project
            var pendingExists = await _db.CoursePartnerRequests
                .AnyAsync(r =>
                    r.CourseId == courseId &&
                    r.CourseProjectId == project.Id &&
                    r.Status == "pending" &&
                    (
                        (r.SenderStudentId == senderProfile.Id && r.ReceiverStudentId == receiverProfile.Id) ||
                        (r.SenderStudentId == receiverProfile.Id && r.ReceiverStudentId == senderProfile.Id)
                    ));

            if (pendingExists)
                return Conflict(new
                {
                    message = "A pending partner request already exists between you and this student for this project."
                });

            // ── 9. Sender must not be in a full team for this project ─────────
            var senderTeamError = await CheckTeamNotFullAsync(
                project.Id, senderProfile.Id, teamSize,
                "You are already in a full team for this project.");
            if (senderTeamError != null) return senderTeamError;

            // ── 10. Receiver must not be in a full team for this project ──────
            var receiverTeamError = await CheckTeamNotFullAsync(
                project.Id, receiverProfile.Id, teamSize,
                "The receiver is already in a full team for this project.");
            if (receiverTeamError != null) return receiverTeamError;

            // ── 11. Persist ───────────────────────────────────────────────────
            var request = new CoursePartnerRequest
            {
                CourseId = courseId,
                SenderStudentId = senderProfile.Id,
                ReceiverStudentId = receiverProfile.Id,
                CourseProjectId = project.Id,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };

            _db.CoursePartnerRequests.Add(request);
            await _db.SaveChangesAsync();

            return StatusCode(201, new
            {
                message = "Partner request sent successfully.",
                requestId = request.Id
            });
        }

        // =====================================================================
        // GET /api/courses/{courseId}/partner-requests
        //
        // Returns the current student's incoming and outgoing requests.
        // =====================================================================
        [HttpGet]
        public async Task<IActionResult> GetMyRequests(int courseId)
        {
            var (student, enrollError) = await GetEnrolledStudentAsync(courseId);
            if (enrollError != null) return enrollError;
            var studentProfile = student!;

            var all = await _db.CoursePartnerRequests
                .AsNoTracking()
                .Include(r => r.Sender).ThenInclude(s => s.User)
                .Include(r => r.Receiver).ThenInclude(s => s.User)
                .Where(r =>
                    r.CourseId == courseId &&
                    (r.SenderStudentId == studentProfile.Id || r.ReceiverStudentId == studentProfile.Id))
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var dto = new PartnerRequestsListDto
            {
                Incoming = all
                    .Where(r => r.ReceiverStudentId == studentProfile.Id)
                    .Select(r => MapRequestDto(r, direction: "incoming"))
                    .ToList(),
                Outgoing = all
                    .Where(r => r.SenderStudentId == studentProfile.Id)
                    .Select(r => MapRequestDto(r, direction: "outgoing"))
                    .ToList(),
            };

            return Ok(dto);
        }

        // =====================================================================
        // POST /api/courses/{courseId}/partner-requests/{requestId}/accept
        //
        // Accept an incoming partner request and merge the two students into a team.
        //
        // ┌─────────────────────────────────────────────────────────────────────┐
        // │  ACCEPT LOGIC — 3 CASES                                             │
        // │                                                                     │
        // │  Case 1: Neither has a team                                         │
        // │    → Create a brand-new CourseTeam (CourseProjectId set)            │
        // │    → sender = leader, receiver = member                             │
        // │    → Add both CourseTeamMember rows                                 │
        // │                                                                     │
        // │  Case 2: Sender already has a team, receiver does not               │
        // │    → Add receiver to sender's team as "member"                      │
        // │                                                                     │
        // │  Case 3: Receiver already has a team, sender does not               │
        // │    → Add sender to receiver's team as "member"                      │
        // └─────────────────────────────────────────────────────────────────────┘
        // =====================================================================
        [HttpPost("{requestId:int}/accept")]
        public async Task<IActionResult> AcceptRequest(int courseId, int requestId)
        {
            // ── 1. Student only + enrollment guard ────────────────────────────
            var (receiver, enrollError) = await GetEnrolledStudentAsync(courseId);
            if (enrollError != null) return enrollError;
            var receiverProfile = receiver!;

            // ── 2. Request exists + receiver is the correct party ─────────────
            var request = await _db.CoursePartnerRequests
                .FirstOrDefaultAsync(r => r.Id == requestId && r.CourseId == courseId);

            if (request == null)
                return NotFound(new { message = "Partner request not found." });

            if (request.ReceiverStudentId != receiverProfile.Id)
                return StatusCode(403, new { message = "Only the receiver can accept this request." });

            if (request.Status != "pending")
                return BadRequest(new
                {
                    message = $"Request is already '{request.Status}' and cannot be accepted."
                });

            // ── 3. CourseProjectId must be present ────────────────────────────
            // Requests created before the CourseProject migration carry NULL.
            // These cannot be accepted — the student must re-send.
            if (request.CourseProjectId == null)
                return BadRequest(new
                {
                    message = "This request has no associated project. " +
                              "Please cancel it and send a new one."
                });

            // ── 4. Load and validate the CourseProject ────────────────────────
            var project = await _db.CourseProjects
                .AsNoTracking()
                .FirstOrDefaultAsync(p =>
                    p.Id == request.CourseProjectId.Value &&
                    p.CourseId == courseId);

            if (project == null)
                return NotFound(new
                {
                    message = "The project associated with this request no longer exists."
                });

            var teamSize = project.TeamSize;

            // ── 5. Re-validate section constraint at accept time ──────────────
            var senderEnrollment = await _db.CourseEnrollments
                .AsNoTracking()
                .FirstOrDefaultAsync(e =>
                    e.CourseId == courseId &&
                    e.StudentId == request.SenderStudentId);

            var receiverEnrollment = await _db.CourseEnrollments
                .AsNoTracking()
                .FirstOrDefaultAsync(e =>
                    e.CourseId == courseId &&
                    e.StudentId == receiverProfile.Id);

            if (senderEnrollment == null)
                return BadRequest(new
                {
                    message = "The request sender is no longer enrolled in this course."
                });

            if (receiverEnrollment == null)
                return BadRequest(new { message = "You are no longer enrolled in this course." });

            if (senderEnrollment.CourseSectionId == null || receiverEnrollment.CourseSectionId == null)
                return BadRequest(new
                {
                    message = "Both students must be assigned to a section before accepting."
                });

            var sectionError = await ValidateSectionForProjectAsync(
                courseId, project,
                request.SenderStudentId, receiverProfile.Id,
                senderEnrollment.CourseSectionId.Value,
                receiverEnrollment.CourseSectionId.Value);
            if (sectionError != null) return sectionError;

            // ── 6. Resolve existing team memberships scoped to this project ───
            // Anchor: CourseTeam.CourseProjectId — no ProjectSettingId involved.
            var senderMembership = await _db.CourseTeamMembers
                .Include(ctm => ctm.Team).ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(ctm =>
                    ctm.Team.CourseProjectId == project.Id &&
                    ctm.StudentId == request.SenderStudentId);

            var receiverMembership = await _db.CourseTeamMembers
                .Include(ctm => ctm.Team).ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(ctm =>
                    ctm.Team.CourseProjectId == project.Id &&
                    ctm.StudentId == receiverProfile.Id);

            // ── 7. Cannot merge two existing teams ────────────────────────────
            if (senderMembership != null && receiverMembership != null)
                return BadRequest(new
                {
                    message = "Both students are already in teams for this project. " +
                              "Teams cannot be merged."
                });

            // ── 8. Execute inside a transaction ───────────────────────────────
            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                CourseTeam resolvedTeam;

                if (senderMembership == null && receiverMembership == null)
                {
                    // ── CASE 1: neither has a team — create one ───────────────
                    if (teamSize < 2)
                        return BadRequest(new
                        {
                            message = "Team size is too small to accommodate two students."
                        });

                    resolvedTeam = new CourseTeam
                    {
                        CourseId = courseId,
                        CourseProjectId = project.Id,               // new system anchor
                        // ProjectSettingId omitted — nullable after Phase 4 migration
                        LeaderStudentId = request.SenderStudentId,
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.CourseTeams.Add(resolvedTeam);
                    await _db.SaveChangesAsync(); // flush to get resolvedTeam.Id

                    _db.CourseTeamMembers.Add(new CourseTeamMember
                    {
                        TeamId = resolvedTeam.Id,
                        CourseId = courseId,
                        // ProjectSettingId omitted — nullable after Phase 4 migration
                        StudentId = request.SenderStudentId,
                        Role = "leader",
                        JoinedAt = DateTime.UtcNow
                    });

                    _db.CourseTeamMembers.Add(new CourseTeamMember
                    {
                        TeamId = resolvedTeam.Id,
                        CourseId = courseId,
                        // ProjectSettingId omitted — nullable after Phase 4 migration
                        StudentId = receiverProfile.Id,
                        Role = "member",
                        JoinedAt = DateTime.UtcNow
                    });
                }
                else if (senderMembership != null)
                {
                    // ── CASE 2: sender has a team, receiver does not ──────────
                    resolvedTeam = senderMembership.Team;

                    if (resolvedTeam.Members.Count >= teamSize)
                        return BadRequest(new { message = "The sender's team is already full." });

                    _db.CourseTeamMembers.Add(new CourseTeamMember
                    {
                        TeamId = resolvedTeam.Id,
                        CourseId = courseId,
                        // ProjectSettingId omitted — nullable after Phase 4 migration
                        StudentId = receiverProfile.Id,
                        Role = "member",
                        JoinedAt = DateTime.UtcNow
                    });
                }
                else
                {
                    // ── CASE 3: receiver has a team, sender does not ──────────
                    resolvedTeam = receiverMembership!.Team;

                    if (resolvedTeam.Members.Count >= teamSize)
                        return BadRequest(new { message = "Your team is already full." });

                    _db.CourseTeamMembers.Add(new CourseTeamMember
                    {
                        TeamId = resolvedTeam.Id,
                        CourseId = courseId,
                        // ProjectSettingId omitted — nullable after Phase 4 migration
                        StudentId = request.SenderStudentId,
                        Role = "member",
                        JoinedAt = DateTime.UtcNow
                    });
                }

                // ── 9. Finalise the request row ───────────────────────────────
                request.Status = "accepted";
                request.TeamId = resolvedTeam.Id;
                request.RespondedAt = DateTime.UtcNow;

                // ── 10. If team is now full, cancel sibling pending requests ──
                // Scoped to the same CourseProject only — a student may have
                // separate pending requests for different projects in this course;
                // those remain unaffected.
                var persistedCount = await _db.CourseTeamMembers
                    .CountAsync(m => m.TeamId == resolvedTeam.Id);

                var trackedAddCount = _db.ChangeTracker
                    .Entries<CourseTeamMember>()
                    .Count(e =>
                        e.State == EntityState.Added &&
                        e.Entity.TeamId == resolvedTeam.Id);

                if (persistedCount + trackedAddCount >= teamSize)
                {
                    // Union of persisted + just-added member IDs
                    var persistedMemberIds = await _db.CourseTeamMembers
                        .Where(m => m.TeamId == resolvedTeam.Id)
                        .Select(m => m.StudentId)
                        .ToListAsync();

                    var addedMemberIds = _db.ChangeTracker
                        .Entries<CourseTeamMember>()
                        .Where(e =>
                            e.State == EntityState.Added &&
                            e.Entity.TeamId == resolvedTeam.Id)
                        .Select(e => e.Entity.StudentId)
                        .ToList();

                    var allMemberIds = persistedMemberIds.Union(addedMemberIds).ToList();

                    var toCancel = await _db.CoursePartnerRequests
                        .Where(r =>
                            r.CourseId == courseId &&
                            r.CourseProjectId == project.Id &&   // same project only
                            r.Id != request.Id &&
                            r.Status == "pending" &&
                            (
                                allMemberIds.Contains(r.SenderStudentId) ||
                                allMemberIds.Contains(r.ReceiverStudentId)
                            ))
                        .ToListAsync();

                    foreach (var r in toCancel)
                    {
                        r.Status = "cancelled";
                        r.RespondedAt = DateTime.UtcNow;
                    }
                }

                await _db.SaveChangesAsync();
                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                return StatusCode(500, new
                {
                    message = "Something went wrong while accepting the request. Please try again."
                });
            }

            return Ok(new { message = "Partner request accepted. You are now in a team together." });
        }

        // =====================================================================
        // POST /api/courses/{courseId}/partner-requests/{requestId}/reject
        //
        // Reject an incoming pending request — receiver only.
        // =====================================================================
        [HttpPost("{requestId:int}/reject")]
        public async Task<IActionResult> RejectRequest(int courseId, int requestId)
        {
            var (receiver, enrollError) = await GetEnrolledStudentAsync(courseId);
            if (enrollError != null) return enrollError;
            var receiverProfile = receiver!;

            var request = await _db.CoursePartnerRequests
                .FirstOrDefaultAsync(r => r.Id == requestId && r.CourseId == courseId);

            if (request == null)
                return NotFound(new { message = "Partner request not found." });

            if (request.ReceiverStudentId != receiverProfile.Id)
                return StatusCode(403, new { message = "Only the receiver can reject this request." });

            if (request.Status != "pending")
                return BadRequest(new
                {
                    message = $"Request is already '{request.Status}' and cannot be rejected."
                });

            request.Status = "rejected";
            request.RespondedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Partner request rejected." });
        }

        // ── Private helpers ───────────────────────────────────────────────────

        /// <summary>
        /// Resolves the current JWT user as an enrolled student in the given course.
        /// Returns (studentProfile, null) on success.
        /// Returns (null, errorResult) on any failure.
        /// </summary>
        private async Task<(StudentProfile? student, IActionResult? error)>
            GetEnrolledStudentAsync(int courseId)
        {
            if (AuthorizationHelper.GetRole(User) != "student")
                return (null, StatusCode(403, new { message = "Only students can access this endpoint." }));

            var userId = AuthorizationHelper.GetUserId(User);
            var student = await _db.StudentProfiles
                .FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
                return (null, NotFound(new { message = "Student profile not found." }));

            var courseExists = await _db.Courses.AnyAsync(c => c.Id == courseId);
            if (!courseExists)
                return (null, NotFound(new { message = "Course not found." }));

            var enrolled = await _db.CourseEnrollments
                .AnyAsync(e => e.CourseId == courseId && e.StudentId == student.Id);

            if (!enrolled)
                return (null, StatusCode(403, new { message = "You are not enrolled in this course." }));

            return (student, null);
        }

        /// <summary>
        /// Validates section constraints for a specific CourseProject.
        ///
        /// AllowCrossSectionTeams == false → sender and receiver must share a section.
        /// ApplyToAllSections     == false → both students must be in one of the
        ///                                   project's assigned sections.
        ///
        /// Called by both SendPartnerRequest and AcceptRequest.
        /// </summary>
        private async Task<IActionResult?> ValidateSectionForProjectAsync(
            int courseId,
            CourseProject project,
            int senderStudentId,
            int receiverStudentId,
            int senderSectionId,
            int receiverSectionId)
        {
            if (!project.AllowCrossSectionTeams && senderSectionId != receiverSectionId)
                return BadRequest(new
                {
                    message = "You can only partner with students in the same section."
                });

            if (!project.ApplyToAllSections)
            {
                var allowedSectionIds = await _db.CourseProjectSections
                    .AsNoTracking()
                    .Where(cps => cps.CourseProjectId == project.Id)
                    .Select(cps => cps.CourseSectionId)
                    .ToListAsync();

                if (!allowedSectionIds.Contains(senderSectionId))
                    return BadRequest(new
                    {
                        message = "You are not enrolled in a section that is part of this project."
                    });

                if (!allowedSectionIds.Contains(receiverSectionId))
                    return BadRequest(new
                    {
                        message = "The receiver is not enrolled in a section that is part of this project."
                    });
            }

            return null;
        }

        /// <summary>
        /// Returns a 400 error when <paramref name="studentId"/> already belongs to
        /// a team for <paramref name="courseProjectId"/> that is at or above
        /// <paramref name="teamSize"/>. Returns null when no such full team exists.
        ///
        /// Scopes exclusively by CourseTeam.CourseProjectId — new system only.
        /// </summary>
        private async Task<IActionResult?> CheckTeamNotFullAsync(
            int courseProjectId,
            int studentId,
            int teamSize,
            string errorMessage)
        {
            var team = await _db.CourseTeams
                .AsNoTracking()
                .Where(t => t.CourseProjectId == courseProjectId)
                .FirstOrDefaultAsync(t =>
                    _db.CourseTeamMembers.Any(m =>
                        m.TeamId == t.Id &&
                        m.StudentId == studentId));

            if (team == null)
                return null;

            var memberCount = await _db.CourseTeamMembers
                .CountAsync(m => m.TeamId == team.Id);

            return memberCount >= teamSize
                ? BadRequest(new { message = errorMessage })
                : null;
        }

        /// <summary>
        /// Maps a CoursePartnerRequest entity to a response DTO.
        /// </summary>
        private static PartnerRequestListItemDto MapRequestDto(
            CoursePartnerRequest r, string direction) =>
            new()
            {
                RequestId = r.Id,
                Direction = direction,
                Status = string.IsNullOrWhiteSpace(r.Status) ? "pending" : r.Status,
                CourseId = r.CourseId,
                TeamId = r.TeamId,
                CreatedAt = r.CreatedAt,
                RespondedAt = r.RespondedAt,
                Sender = new PartnerRequestParticipantDto
                {
                    StudentId = r.SenderStudentId,
                    Name = r.Sender?.User?.Name ?? string.Empty,
                },
                Receiver = new PartnerRequestParticipantDto
                {
                    StudentId = r.ReceiverStudentId,
                    Name = r.Receiver?.User?.Name ?? string.Empty,
                },
            };
    }

    // ── Input DTO ─────────────────────────────────────────────────────────────

    public class SendPartnerRequestDto
    {
        /// <summary>University student ID string (StudentProfile.StudentId), NOT the DB PK.</summary>
        [Required]
        public string ReceiverStudentId { get; set; } = string.Empty;

        /// <summary>The CourseProject this request is for. Required.</summary>
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "CourseProjectId must be a valid project id.")]
        public int CourseProjectId { get; set; }
    }
}