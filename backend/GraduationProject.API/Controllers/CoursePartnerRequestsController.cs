// Controllers/CoursePartnerRequestsController.cs
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
    /// Accept logic — three cases
    /// ──────────────────────────
    ///   Case 1: Neither has a team → create a new team, sender = leader, add both.
    ///   Case 2: Sender has a team  → add receiver to sender's existing team.
    ///   Case 3: Receiver has a team → add sender to receiver's existing team.
    ///
    /// All cases respect the TeamSize defined in the active CourseProjectSetting.
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

            // ── 4. Receiver must be enrolled ──────────────────────────────────
            var receiverEnrolled = await _db.CourseEnrollments
                .AnyAsync(e => e.CourseId == courseId && e.StudentId == receiverProfile.Id);

            if (!receiverEnrolled)
                return BadRequest(new { message = "The receiver is not enrolled in this course." });

            // ── 5. Active project setting must exist (defines TeamSize) ───────
            var setting = await _db.CourseProjectSettings
                .AsNoTracking()
                .Where(ps => ps.CourseId == courseId && ps.IsActive)
                .OrderByDescending(ps => ps.CreatedAt)
                .FirstOrDefaultAsync();

            if (setting == null)
                return BadRequest(new { message = "This course has no active project setting yet. The doctor must define one first." });

            // ── 6. No existing pending request between this pair ──────────────
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

            // ── 7. Sender must not be in a full team ──────────────────────────
            var senderTeamError = await CheckTeamNotFullAsync(courseId, senderProfile.Id, setting.TeamSize, "You are already in a full team.");
            if (senderTeamError != null) return senderTeamError;

            // ── 8. Receiver must not be in a full team ────────────────────────
            var receiverTeamError = await CheckTeamNotFullAsync(courseId, receiverProfile.Id, setting.TeamSize, "The receiver is already in a full team.");
            if (receiverTeamError != null) return receiverTeamError;

            // ── 9. Create request ─────────────────────────────────────────────
            var request = new CoursePartnerRequest
            {
                CourseId          = courseId,
                SenderStudentId   = senderProfile.Id,
                ReceiverStudentId = receiverProfile.Id,
                Status            = "pending",
                CreatedAt         = DateTime.UtcNow
            };

            _db.CoursePartnerRequests.Add(request);
            await _db.SaveChangesAsync();

            return StatusCode(201, new
            {
                message   = "Partner request sent successfully.",
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

            var incoming = all
                .Where(r => r.ReceiverStudentId == studentProfile.Id)
                .Select(r => MapRequest(r, direction: "incoming"))
                .ToList();

            var outgoing = all
                .Where(r => r.SenderStudentId == studentProfile.Id)
                .Select(r => MapRequest(r, direction: "outgoing"))
                .ToList();

            return Ok(new { incoming, outgoing });
        }

        // =====================================================================
        // POST /api/courses/{courseId}/partner-requests/{requestId}/accept
        //
        // Accept an incoming partner request and merge the two students into a team.
        //
        // ┌─────────────────────────────────────────────────────────────────┐
        // │  ACCEPT LOGIC — 3 CASES                                         │
        // │                                                                  │
        // │  Case 1: Neither has a team                                      │
        // │    → Create a brand-new CourseTeam                               │
        // │    → sender = leader, receiver = member                          │
        // │    → Add both CourseTeamMember rows                              │
        // │                                                                  │
        // │  Case 2: Sender already has a team, receiver does not            │
        // │    → Add receiver to sender's team as "member"                   │
        // │                                                                  │
        // │  Case 3: Receiver already has a team, sender does not            │
        // │    → Add sender to receiver's team as "member"                   │
        // │                                                                  │
        // │  ⚠ Case 4 (both have teams) is an error — cannot merge teams.   │
        // │                                                                  │
        // │  After any case:                                                 │
        // │    - request.Status = "accepted"                                 │
        // │    - request.TeamId = the resolved team id                       │
        // │    - request.RespondedAt = UtcNow                                │
        // └─────────────────────────────────────────────────────────────────┘
        //
        // All team-capacity validations are re-checked inside the transaction.
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

            // ── 3. Active setting → TeamSize ──────────────────────────────────
            var setting = await _db.CourseProjectSettings
                .AsNoTracking()
                .Where(ps => ps.CourseId == courseId && ps.IsActive)
                .OrderByDescending(ps => ps.CreatedAt)
                .FirstOrDefaultAsync();

            if (setting == null)
                return BadRequest(new { message = "No active project setting found. The doctor must define one first." });

            var teamSize = setting.TeamSize;

            // ── 4. Re-validate enrollment for sender (may have been unenrolled) ─
            var senderEnrolled = await _db.CourseEnrollments
                .AnyAsync(e => e.CourseId == courseId && e.StudentId == request.SenderStudentId);

            if (!senderEnrolled)
                return BadRequest(new { message = "The request sender is no longer enrolled in this course." });

            // ── 5. Resolve existing teams ──────────────────────────────────────
            var senderMembership = await _db.CourseTeamMembers
                .Include(ctm => ctm.Team).ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(ctm => ctm.CourseId == courseId && ctm.StudentId == request.SenderStudentId);

            var receiverMembership = await _db.CourseTeamMembers
                .Include(ctm => ctm.Team).ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(ctm => ctm.CourseId == courseId && ctm.StudentId == receiverProfile.Id);

            // ── 6. Cannot merge two existing teams ────────────────────────────
            if (senderMembership != null && receiverMembership != null)
                return BadRequest(new { message = "Both students are already in teams. Teams cannot be merged." });

            // ── 7. Execute inside a transaction ───────────────────────────────
            await using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                CourseTeam resolvedTeam;

                if (senderMembership == null && receiverMembership == null)
                {
                    // ── CASE 1: neither has a team ────────────────────────────
                    // Guard: a brand-new team will have 2 members — must fit.
                    if (teamSize < 2)
                        return BadRequest(new { message = "Team size is too small to accommodate two students." });

                    resolvedTeam = new CourseTeam
                    {
                        CourseId         = courseId,
                        ProjectSettingId = setting.Id,
                        LeaderStudentId  = request.SenderStudentId, // sender becomes leader
                        CreatedAt        = DateTime.UtcNow
                    };
                    _db.CourseTeams.Add(resolvedTeam);
                    await _db.SaveChangesAsync(); // flush to get resolvedTeam.Id

                    _db.CourseTeamMembers.Add(new CourseTeamMember
                    {
                        TeamId    = resolvedTeam.Id,
                        CourseId  = courseId,
                        StudentId = request.SenderStudentId,
                        Role      = "leader",
                        JoinedAt  = DateTime.UtcNow
                    });

                    _db.CourseTeamMembers.Add(new CourseTeamMember
                    {
                        TeamId    = resolvedTeam.Id,
                        CourseId  = courseId,
                        StudentId = receiverProfile.Id,
                        Role      = "member",
                        JoinedAt  = DateTime.UtcNow
                    });
                }
                else if (senderMembership != null)
                {
                    // ── CASE 2: sender has a team, receiver does not ──────────
                    resolvedTeam = senderMembership.Team;

                    // Re-count current members from DB (race-condition safe)
                    var currentCount = resolvedTeam.Members.Count;
                    if (currentCount >= teamSize)
                        return BadRequest(new { message = "The sender's team is already full." });

                    _db.CourseTeamMembers.Add(new CourseTeamMember
                    {
                        TeamId    = resolvedTeam.Id,
                        CourseId  = courseId,
                        StudentId = receiverProfile.Id,
                        Role      = "member",
                        JoinedAt  = DateTime.UtcNow
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
                        TeamId    = resolvedTeam.Id,
                        CourseId  = courseId,
                        StudentId = request.SenderStudentId,
                        Role      = "member",
                        JoinedAt  = DateTime.UtcNow
                    });
                }

                // ── Finalise the request row ───────────────────────────────────
                request.Status      = "accepted";
                request.TeamId      = resolvedTeam.Id;
                request.RespondedAt = DateTime.UtcNow;
                var finalMemberCount = await _db.CourseTeamMembers
               .CountAsync(m => m.TeamId == resolvedTeam.Id);

                if (finalMemberCount >= teamSize)
                {
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
            request.Status      = "rejected";
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
        /// Returns a 400 error result when the student already belongs to a team
        /// that is at or above the defined TeamSize; returns null when all is fine.
        /// A student who has no team yet always passes this check.
        /// </summary>
        private async Task<IActionResult?> CheckTeamNotFullAsync(
            int courseId, int studentId, int teamSize, string errorMessage)
        {
            var membership = await _db.CourseTeamMembers
                .AsNoTracking()
                .Include(ctm => ctm.Team)
                .FirstOrDefaultAsync(ctm => ctm.CourseId == courseId && ctm.StudentId == studentId);

            if (membership == null)
                return null; // no team yet — always OK

            var memberCount = await _db.CourseTeamMembers
           .CountAsync(m => m.TeamId == membership.Team.Id);

            if (memberCount >= teamSize)
                return BadRequest(new { message = errorMessage });

            return null;
        }

        /// <summary>
        /// Maps a CoursePartnerRequest to a flat anonymous response object.
        /// </summary>
        private static object MapRequest(CoursePartnerRequest r, string direction) => new
        {
            requestId         = r.Id,
            direction,
            status            = r.Status,
            courseId          = r.CourseId,
            teamId            = r.TeamId,
            createdAt         = r.CreatedAt,
            respondedAt       = r.RespondedAt,
            sender = new
            {
                studentId = r.SenderStudentId,
                name      = r.Sender?.User?.Name ?? string.Empty
            },
            receiver = new
            {
                studentId = r.ReceiverStudentId,
                name      = r.Receiver?.User?.Name ?? string.Empty
            }
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
