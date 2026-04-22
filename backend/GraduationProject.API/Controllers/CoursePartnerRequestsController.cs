// Controllers/CoursePartnerRequestsController.cs
using System;
using System.Collections.Generic;
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
    /// Section rules (enforced on Send AND Accept):
    ///   Shared project (UseSharedProjectAcrossSections == true)
    ///     AllowCrossSectionTeams == false → sender & receiver must be in the SAME section
    ///     AllowCrossSectionTeams == true  → no restriction
    ///   Per-section project (UseSharedProjectAcrossSections == false)
    ///     ALWAYS enforce same section — AllowCrossSectionTeams is ignored.
    ///
    /// Accept logic — three cases (unchanged)
    /// ──────────────────────────
    ///   Case 1: Neither has a team → create a new team, sender = leader, add both.
    ///   Case 2: Sender has a team  → add receiver to sender's existing team.
    ///   Case 3: Receiver has a team → add sender to receiver's existing team.
    ///
    /// All cases respect the TeamSize from the active project setting (shared or per-section).
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
        // Input body:
        //   { "receiverStudentId": "<university student id string>" }
        //
        // Validations (all must pass):
        //   ✓ Both students are enrolled in the course.
        //   ✓ Cannot send to self.
        //   ✓ Section rule (see class-level doc).
        //   ✓ No existing pending request in either direction between the same pair.
        //   ✓ Sender is not already in a FULL team.
        //   ✓ Receiver is not already in a FULL team.
        //   ✓ An active project setting exists (so TeamSize is defined).
        // =====================================================================
        [HttpPost]
        public async Task<IActionResult> SendPartnerRequest(
    int courseId,
    [FromBody] SendPartnerRequestDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // ── 1. Student only + enrollment guard ────────────────────────────
            var (sender, courseError) = await GetEnrolledStudentAsync(courseId);
            if (courseError != null) return courseError;
            var senderProfile = sender!;

            // ── 2. Resolve receiver by university student id string ───────────
            if (string.IsNullOrWhiteSpace(dto.ReceiverStudentId))
                return BadRequest(new { message = "receiverStudentId is required." });

            var receiverProfile = await _db.StudentProfiles
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.StudentId == dto.ReceiverStudentId.Trim());

            if (receiverProfile == null)
                return NotFound(new { message = "Receiver student not found." });

            // ── 3. Cannot send to self ────────────────────────────────────────
            if (receiverProfile.Id == senderProfile.Id)
                return BadRequest(new { message = "You cannot send a partner request to yourself." });

            // ── 4. Load both enrollments (needed for section validation) ──────
            var senderEnrollment = await _db.CourseEnrollments
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == senderProfile.Id);

            var receiverEnrollment = await _db.CourseEnrollments
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == receiverProfile.Id);

            // Sender is guaranteed enrolled by GetEnrolledStudentAsync above,
            // but we double-check defensively.
            if (senderEnrollment == null)
                return BadRequest(new { message = "You are not enrolled in this course." });

            if (receiverEnrollment == null)
                return BadRequest(new { message = "The receiver is not enrolled in this course." });

            // ── 5. NEW: Both students MUST be assigned to a section ───────────
            //   Enforced unconditionally — a NULL section_id is always rejected,
            //   even for courses that have no sections configured.
            if (senderEnrollment.CourseSectionId == null || receiverEnrollment.CourseSectionId == null)
            {
                return BadRequest(new
                {
                    message = "Students must be assigned to a section before sending requests."
                });
            }

            // ── 6. Load course for section rules ──────────────────────────────
            var course = await _db.Courses.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == courseId);

            // ── 7. Section enforcement (existing logic — unchanged) ───────────
            //   Ensures both students share the SAME section when the course
            //   config requires it (per-section project OR AllowCrossSectionTeams == false).
            var sectionError = await ValidateSameSectionAsync(
                courseId, course!, senderProfile.Id, receiverProfile.Id);
            if (sectionError != null) return sectionError;

            // ── 8. Active project setting must exist (defines TeamSize) ───────
            var (activeSetting, teamSize, settingError) = await ResolveTeamSizeAsync(courseId, course!, senderProfile.Id);
            if (settingError != null) return settingError;
            var activeSettingId = activeSetting!.Id; // anchor project-setting id

            // ── 9. No existing pending request between this pair ──────────────
            var pendingExists = await _db.CoursePartnerRequests
                .AnyAsync(r =>
                    r.CourseId == courseId &&
                    r.Status == "pending" &&
                    (
                        (r.SenderStudentId == senderProfile.Id && r.ReceiverStudentId == receiverProfile.Id) ||
                        (r.SenderStudentId == receiverProfile.Id && r.ReceiverStudentId == senderProfile.Id)
                    ));

            if (pendingExists)
                return Conflict(new { message = "A pending partner request already exists between you and this student." });

            // ── 10. Sender must not be in a full team IN THIS PROJECT ─────────
            //        (students may be in a team in a DIFFERENT project in the
            //         same course — that no longer blocks them here)
            var senderTeamError = await CheckTeamNotFullAsync(
                activeSettingId, senderProfile.Id, teamSize, "You are already in a full team for this project.");
            if (senderTeamError != null) return senderTeamError;

            // ── 11. Receiver must not be in a full team IN THIS PROJECT ───────
            var receiverTeamError = await CheckTeamNotFullAsync(
                activeSettingId, receiverProfile.Id, teamSize, "The receiver is already in a full team for this project.");
            if (receiverTeamError != null) return receiverTeamError;

            // ── 12. Create request ────────────────────────────────────────────
            var request = new CoursePartnerRequest
            {
                CourseId = courseId,
                SenderStudentId = senderProfile.Id,
                ReceiverStudentId = receiverProfile.Id,
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
            // ── 1. Student only + enrollment guard ────────────────────────────
            var (student, courseError) = await GetEnrolledStudentAsync(courseId);
            if (courseError != null) return courseError;
            var studentProfile = student!;

            // ── 2. Fetch both directions ──────────────────────────────────────
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
        // 
        //   ACCEPT LOGIC — 3 CASES                                        
        //                                                                   
        //   Case 1: Neither has a team                                      
        //     → Create a brand-new CourseTeam                               
        //     → sender = leader, receiver = member                          
        //     → Add both CourseTeamMember rows                              
        //                                                                   
        //   Case 2: Sender already has a team, receiver does not           
        //     → Add receiver to sender's team as "member"                   
        //                                                                   
        //   Case 3: Receiver already has a team, sender does not            
        //     → Add sender to receiver's team as "member"                   
        //                                                                   
        // 
        // =====================================================================
        [HttpPost("{requestId:int}/accept")]
        public async Task<IActionResult> AcceptRequest(int courseId, int requestId)
        {
            // ── 1. Student only + enrollment guard ────────────────────────────
            var (receiver, courseError) = await GetEnrolledStudentAsync(courseId);
            if (courseError != null) return courseError;
            var receiverProfile = receiver!;

            // ── 2. Request exists + receiver is the correct party ─────────────
            var request = await _db.CoursePartnerRequests
                .FirstOrDefaultAsync(r => r.Id == requestId && r.CourseId == courseId);

            if (request == null)
                return NotFound(new { message = "Partner request not found." });

            if (request.ReceiverStudentId != receiverProfile.Id)
                return StatusCode(403, new { message = "Only the receiver can accept this request." });

            if (request.Status != "pending")
                return BadRequest(new { message = $"Request is already '{request.Status}' and cannot be accepted." });

            // ── 3. Load course for section rules ──────────────────────────────
            var course = await _db.Courses.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == courseId);

            // ── 4. Re-validate section constraint at accept time ──────────────
            var sectionError = await ValidateSameSectionAsync(
                courseId, course!, request.SenderStudentId, receiverProfile.Id);
            if (sectionError != null) return sectionError;

            // ── 5. Resolve team size (+ active project setting anchor) ────────
            var (activeSetting, teamSize, settingError) = await ResolveTeamSizeAsync(
                courseId, course!, receiverProfile.Id);
            if (settingError != null) return settingError;
            var activeSettingId = activeSetting!.Id;

            // ── 6. Re-validate enrollment for sender ──────────────────────────
            var senderEnrolled = await _db.CourseEnrollments
                .AnyAsync(e => e.CourseId == courseId && e.StudentId == request.SenderStudentId);

            if (!senderEnrolled)
                return BadRequest(new { message = "The request sender is no longer enrolled in this course." });

            // ── 7. Resolve existing teams IN THIS PROJECT ─────────────────────
            //        (a student may be in another team in a different project —
            //         that is irrelevant here)
            var senderMembership = await _db.CourseTeamMembers
                .Include(ctm => ctm.Team).ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(ctm => ctm.ProjectSettingId == activeSettingId
                                            && ctm.StudentId == request.SenderStudentId);

            var receiverMembership = await _db.CourseTeamMembers
                .Include(ctm => ctm.Team).ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(ctm => ctm.ProjectSettingId == activeSettingId
                                            && ctm.StudentId == receiverProfile.Id);

            // ── 8. Cannot merge two existing teams ────────────────────────────
            if (senderMembership != null && receiverMembership != null)
                return BadRequest(new { message = "Both students are already in teams for this project. Teams cannot be merged." });

            // ── 9. (active setting already resolved above — used as the FK) ──
            var sharedSetting = activeSetting; // alias preserved for readability

            // ── 10. Execute inside a transaction ──────────────────────────────
            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                CourseTeam resolvedTeam;

                if (senderMembership == null && receiverMembership == null)
                {
                    // ── CASE 1: neither has a team ────────────────────────────
                    if (teamSize < 2)
                        return BadRequest(new { message = "Team size is too small to accommodate two students." });

                    resolvedTeam = new CourseTeam
                    {
                        CourseId = courseId,
                        ProjectSettingId = sharedSetting.Id,
                        LeaderStudentId = request.SenderStudentId, // sender becomes leader
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.CourseTeams.Add(resolvedTeam);
                    await _db.SaveChangesAsync(); // flush to get resolvedTeam.Id

                    _db.CourseTeamMembers.Add(new CourseTeamMember
                    {
                        TeamId = resolvedTeam.Id,
                        CourseId = courseId,
                        ProjectSettingId = sharedSetting.Id,
                        StudentId = request.SenderStudentId,
                        Role = "leader",
                        JoinedAt = DateTime.UtcNow
                    });

                    _db.CourseTeamMembers.Add(new CourseTeamMember
                    {
                        TeamId = resolvedTeam.Id,
                        CourseId = courseId,
                        ProjectSettingId = sharedSetting.Id,
                        StudentId = receiverProfile.Id,
                        Role = "member",
                        JoinedAt = DateTime.UtcNow
                    });
                }
                else if (senderMembership != null)
                {
                    // ── CASE 2: sender has a team, receiver does not ──────────
                    resolvedTeam = senderMembership.Team;

                    var currentCount = resolvedTeam.Members.Count;
                    if (currentCount >= teamSize)
                        return BadRequest(new { message = "The sender's team is already full." });

                    _db.CourseTeamMembers.Add(new CourseTeamMember
                    {
                        TeamId = resolvedTeam.Id,
                        CourseId = courseId,
                        ProjectSettingId = resolvedTeam.ProjectSettingId,
                        StudentId = receiverProfile.Id,
                        Role = "member",
                        JoinedAt = DateTime.UtcNow
                    });
                }
                else
                {
                    // ── CASE 3: receiver has a team, sender does not ──────────
                    resolvedTeam = receiverMembership!.Team;

                    var currentCount = resolvedTeam.Members.Count;
                    if (currentCount >= teamSize)
                        return BadRequest(new { message = "Your team is already full." });

                    _db.CourseTeamMembers.Add(new CourseTeamMember
                    {
                        TeamId = resolvedTeam.Id,
                        CourseId = courseId,
                        ProjectSettingId = resolvedTeam.ProjectSettingId,
                        StudentId = request.SenderStudentId,
                        Role = "member",
                        JoinedAt = DateTime.UtcNow
                    });
                }

                // ── Finalise the request row ───────────────────────────────────
                request.Status = "accepted";
                request.TeamId = resolvedTeam.Id;
                request.RespondedAt = DateTime.UtcNow;

                var finalMemberCount = await _db.CourseTeamMembers
                    .CountAsync(m => m.TeamId == resolvedTeam.Id);

                if (finalMemberCount >= teamSize)
                {
                    // When the team is full, cancel all still-pending partner
                    // requests that involve any of this team's members.
                    //
                    // NOTE: CoursePartnerRequest has no ProjectSettingId — a
                    // request implicitly targets whatever project is active at
                    // accept time. Because AT MOST ONE project is active per
                    // course, scoping this cancellation by CourseId is
                    // equivalent to scoping by the active project. When a new
                    // project is later activated, fresh requests can be sent.
                    var teamMemberIds = await _db.CourseTeamMembers
                        .Where(m => m.TeamId == resolvedTeam.Id)
                        .Select(m => m.StudentId)
                        .ToListAsync();

                    var pendingRequestsToCancel = await _db.CoursePartnerRequests
                        .Where(r =>
                            r.CourseId == courseId &&
                            r.Id != request.Id &&
                            r.Status == "pending" &&
                            (
                                teamMemberIds.Contains(r.SenderStudentId) ||
                                teamMemberIds.Contains(r.ReceiverStudentId)
                            ))
                        .ToListAsync();

                    foreach (var r in pendingRequestsToCancel)
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
                return StatusCode(500, new { message = "Something went wrong while accepting the request. Please try again." });
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
            // ── 1. Student only + enrollment guard ────────────────────────────
            var (receiver, courseError) = await GetEnrolledStudentAsync(courseId);
            if (courseError != null) return courseError;
            var receiverProfile = receiver!;

            // ── 2. Request exists ─────────────────────────────────────────────
            var request = await _db.CoursePartnerRequests
                .FirstOrDefaultAsync(r => r.Id == requestId && r.CourseId == courseId);

            if (request == null)
                return NotFound(new { message = "Partner request not found." });

            // ── 3. Only the receiver can reject ──────────────────────────────
            if (request.ReceiverStudentId != receiverProfile.Id)
                return StatusCode(403, new { message = "Only the receiver can reject this request." });

            // ── 4. Must still be pending ──────────────────────────────────────
            if (request.Status != "pending")
                return BadRequest(new { message = $"Request is already '{request.Status}' and cannot be rejected." });

            // ── 5. Update status ──────────────────────────────────────────────
            request.Status = "rejected";
            request.RespondedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(new { message = "Partner request rejected." });
        }

        // ── Private Helpers ───────────────────────────────────────────────────

        /// <summary>
        /// Resolves the current user as an enrolled student in the given course.
        ///
        /// Returns (studentProfile, null) on success.
        /// Returns (null, errorResult) when:
        ///   - caller is not a student
        ///   - course does not exist
        ///   - student is not enrolled
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
        /// Checks whether the given sender and receiver satisfy the section constraint
        /// for the course. Returns a 400 error result when violated; null when OK.
        ///
        /// Rules:
        ///   UseSharedProjectAcrossSections == true  AND AllowCrossSectionTeams == true  → no restriction
        ///   UseSharedProjectAcrossSections == true  AND AllowCrossSectionTeams == false → same section
        ///   UseSharedProjectAcrossSections == false                                      → same section (always)
        ///
        /// Edge case: null == null is considered "same section" (neither student has
        ///            been assigned to a section yet). This matches the recommendation
        ///            filtering behaviour and prevents unnecessary crashes.
        /// </summary>
        private async Task<IActionResult?> ValidateSameSectionAsync(
            int courseId, Course course, int senderStudentId, int receiverStudentId)
        {
            bool enforceSameSection =
                !course.UseSharedProjectAcrossSections ||   // per-section project → always enforce
                !course.AllowCrossSectionTeams;              // shared but cross-section banned

            if (!enforceSameSection)
                return null;

            var senderEnrollment = await _db.CourseEnrollments
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == senderStudentId);

            var receiverEnrollment = await _db.CourseEnrollments
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == receiverStudentId);

            var senderSection = senderEnrollment?.CourseSectionId;
            var receiverSection = receiverEnrollment?.CourseSectionId;

            if (senderSection != receiverSection)
            {
                return BadRequest(new
                {
                    message = "You can only send partner requests to students in the same section."
                });
            }

            return null;
        }

        /// <summary>
        /// Resolves the effective TeamSize for the given student in the course,
        /// considering whether the project is shared or per-section.
        ///
        /// Returns (setting, teamSize, null) on success or (null, 0, errorResult).
        ///
        /// NOTE: The shared CourseProjectSetting is always required (it is the FK
        /// target referenced by CourseTeam.ProjectSettingId). For per-section
        /// projects we use the shared setting as an anchor and override TeamSize
        /// from the SectionProjectSetting when available.
        /// </summary>
        private async Task<(CourseProjectSetting? setting, int teamSize, IActionResult? error)>
            ResolveTeamSizeAsync(int courseId, Course course, int studentId)
        {
            var sharedSetting = await _db.CourseProjectSettings
                .AsNoTracking()
                .Where(ps => ps.CourseId == courseId && ps.IsActive)
                .OrderByDescending(ps => ps.CreatedAt)
                .FirstOrDefaultAsync();

            if (sharedSetting == null)
                return (null, 0, BadRequest(new
                {
                    message = "This course has no active project setting yet. The doctor must define one first."
                }));

            int teamSize = sharedSetting.TeamSize;

            if (!course.UseSharedProjectAcrossSections)
            {
                var enrollment = await _db.CourseEnrollments
                    .AsNoTracking()
                    .FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == studentId);

                if (enrollment?.CourseSectionId.HasValue == true)
                {
                    var sectionSetting = await _db.SectionProjectSettings
                        .AsNoTracking()
                        .Where(sps => sps.CourseSectionId == enrollment.CourseSectionId.Value
                                      && sps.IsActive)
                        .OrderByDescending(sps => sps.CreatedAt)
                        .FirstOrDefaultAsync();

                    if (sectionSetting != null)
                        teamSize = sectionSetting.TeamSize;
                }
            }

            return (sharedSetting, teamSize, null);
        }

        /// <summary>
        /// Returns a 400 error result when the student already belongs to a team
        /// IN THE GIVEN PROJECT that is at or above the defined TeamSize;
        /// returns null when all is fine. A student who has no team for this
        /// project yet always passes this check.
        ///
        /// NOTE: scope is PROJECT (ProjectSettingId), not course — a student
        /// may be in another team in the same course under a different project.
        /// </summary>
        private async Task<IActionResult?> CheckTeamNotFullAsync(
            int projectSettingId, int studentId, int teamSize, string errorMessage)
        {
            var membership = await _db.CourseTeamMembers
                .AsNoTracking()
                .Include(ctm => ctm.Team)
                .FirstOrDefaultAsync(ctm => ctm.ProjectSettingId == projectSettingId
                                            && ctm.StudentId == studentId);

            if (membership == null)
                return null; // no team in this project yet — always OK

            var memberCount = await _db.CourseTeamMembers
                .CountAsync(m => m.TeamId == membership.Team.Id);

            if (memberCount >= teamSize)
                return BadRequest(new { message = errorMessage });

            return null;
        }

        /// <summary>
        /// Maps a CoursePartnerRequest to the list API shape; <see cref="PartnerRequestListItemDto.Status"/> is always populated.
        /// </summary>
        private static PartnerRequestListItemDto MapRequestDto(CoursePartnerRequest r, string direction) =>
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

    // ── Input DTO (local — no separate file needed for a single field) ────────
    public class SendPartnerRequestDto
    {
        /// <summary>University student ID string (StudentProfile.StudentId), NOT the database PK.</summary>
        [Required]
        public string ReceiverStudentId { get; set; } = string.Empty;
    }
}