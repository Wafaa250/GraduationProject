using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize(Roles = "student")]
    public class CourseTeamInvitationsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<CourseTeamInvitationsController> _logger;

        public CourseTeamInvitationsController(
            ApplicationDbContext db,
            ILogger<CourseTeamInvitationsController> logger)
        {
            _db = db;
            _logger = logger;
        }

        [HttpPost("course-projects/{projectId:int}/invite")]
        public async Task<IActionResult> InviteToCourseProject(int projectId, [FromBody] SendCourseTeamInvitationsDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var sender = await GetCurrentStudentProfileAsync();
            if (sender == null) return Unauthorized(new { message = "Student profile not found." });

            var project = await _db.CourseProjects
                .Include(p => p.Sections)
                .FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return NotFound(new { message = "Project not found." });
            if (project.AiMode != "student")
                return BadRequest(new { message = "Invitations are only available for student-select projects." });

            var senderAlreadyInTeam = await IsStudentInProjectTeam(projectId, sender.Id);
            if (senderAlreadyInTeam)
                return BadRequest(new { message = "You are already in a team for this project." });

            var receiverIds = dto.ReceiverIds
                .Where(id => id > 0 && id != sender.Id)
                .Distinct()
                .ToList();
            if (receiverIds.Count == 0)
                return BadRequest(new { message = "No valid receivers provided." });

            var pendingSentCount = await _db.CourseTeamInvitations
                .CountAsync(i => i.ProjectId == projectId && i.SenderId == sender.Id && i.Status == "pending");
            var acceptedSentCount = await _db.CourseTeamInvitations
                .CountAsync(i => i.ProjectId == projectId && i.SenderId == sender.Id && i.Status == "accepted");
            var committedMembers = 1 + acceptedSentCount + pendingSentCount;
            if (committedMembers >= project.TeamSize)
                return BadRequest(new { message = "Team is already full. You cannot send more invitations." });

            var availableInviteSlots = Math.Max(0, project.TeamSize - committedMembers);
            if (receiverIds.Count > availableInviteSlots)
                return BadRequest(new { message = $"You can send at most {availableInviteSlots} more invitation(s)." });

            var sectionMap = await GetSectionMapByStudentAsync(project.CourseId);
            if (!sectionMap.TryGetValue(sender.Id, out var senderSectionId))
                return BadRequest(new { message = "You are not enrolled in this course." });

            var newInvitations = new List<CourseTeamInvitation>();
            foreach (var receiverId in receiverIds)
            {
                var receiverExists = await _db.StudentProfiles.AnyAsync(s => s.Id == receiverId);
                if (!receiverExists) continue;

                if (await IsStudentInProjectTeam(projectId, receiverId)) continue;

                if (!sectionMap.TryGetValue(receiverId, out var receiverSectionId)) continue;
                if (!IsStudentEligibleForProject(project, senderSectionId, receiverSectionId)) continue;

                var pendingExists = await _db.CourseTeamInvitations.AnyAsync(i =>
                    i.ProjectId == projectId &&
                    i.SenderId == sender.Id &&
                    i.ReceiverId == receiverId &&
                    i.Status == "pending");
                if (pendingExists) continue;

                newInvitations.Add(new CourseTeamInvitation
                {
                    ProjectId = projectId,
                    SenderId = sender.Id,
                    ReceiverId = receiverId,
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow,
                });
            }

            if (newInvitations.Count == 0)
                return BadRequest(new { message = "No eligible students to invite." });

            _db.CourseTeamInvitations.AddRange(newInvitations);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Invitations sent.",
                sentCount = newInvitations.Count,
                invitationIds = newInvitations.Select(i => i.Id).ToList(),
            });
        }

        [HttpGet("team-invitations/my")]
        public async Task<IActionResult> GetMyTeamInvitations()
        {
            var receiver = await GetCurrentStudentProfileAsync();
            if (receiver == null) return Unauthorized(new { message = "Student profile not found." });

            var invitations = await _db.CourseTeamInvitations
                .Include(i => i.Project)
                .Include(i => i.Sender).ThenInclude(s => s.User)
                .Where(i => i.ReceiverId == receiver.Id)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            var data = invitations.Select(i => new
            {
                id = i.Id,
                projectId = i.ProjectId,
                projectTitle = i.Project?.Title ?? string.Empty,
                senderId = i.SenderId,
                senderName = i.Sender?.User?.Name ?? string.Empty,
                receiverId = i.ReceiverId,
                status = i.Status,
                createdAt = i.CreatedAt,
                respondedAt = i.RespondedAt,
            });

            return Ok(data);
        }

        [HttpPost("team-invitations/{id:int}/accept")]
        public async Task<IActionResult> AcceptInvitation(int id)
        {
            var receiver = await GetCurrentStudentProfileAsync();
            if (receiver == null) return Unauthorized(new { message = "Student profile not found." });

            var invitation = await _db.CourseTeamInvitations
                .Include(i => i.Project)
                .ThenInclude(p => p.Sections)
                .FirstOrDefaultAsync(i => i.Id == id);
            if (invitation == null) return NotFound(new { message = "Invitation not found." });
            if (invitation.ReceiverId != receiver.Id) return Forbid();
            if (invitation.Status != "pending")
                return BadRequest(new { message = "Invitation is already processed." });

            if (await IsStudentInProjectTeam(invitation.ProjectId, receiver.Id))
                return BadRequest(new { message = "You are already in a team for this project." });
            if (await IsStudentInProjectTeam(invitation.ProjectId, invitation.SenderId))
                return BadRequest(new { message = "Team is already full for this invitation sender." });

            var acceptedSentCount = await _db.CourseTeamInvitations
                .CountAsync(i =>
                    i.ProjectId == invitation.ProjectId &&
                    i.SenderId == invitation.SenderId &&
                    i.Status == "accepted");
            var senderCommittedMembers = 1 + acceptedSentCount;
            if (senderCommittedMembers >= invitation.Project.TeamSize)
                return BadRequest(new { message = "Team is already complete. This invitation cannot be accepted." });

            invitation.Status = "accepted";
            invitation.RespondedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var teamCreated = await TryCreateTeamFromAcceptedInvitationsAsync(invitation.ProjectId, invitation.SenderId);
            return Ok(new
            {
                message = "Invitation accepted.",
                teamCreated = teamCreated,
            });
        }

        [HttpPost("team-invitations/{id:int}/reject")]
        public async Task<IActionResult> RejectInvitation(int id)
        {
            var receiver = await GetCurrentStudentProfileAsync();
            if (receiver == null) return Unauthorized(new { message = "Student profile not found." });

            var invitation = await _db.CourseTeamInvitations
                .FirstOrDefaultAsync(i => i.Id == id);
            if (invitation == null) return NotFound(new { message = "Invitation not found." });
            if (invitation.ReceiverId != receiver.Id) return Forbid();
            if (invitation.Status != "pending")
                return BadRequest(new { message = "Invitation is already processed." });

            invitation.Status = "rejected";
            invitation.RespondedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Invitation rejected." });
        }

        [HttpGet("course-projects/{projectId:int}/eligible-students")]
        public async Task<IActionResult> GetEligibleStudentsForInvitation(int projectId)
        {
            try
            {
                var sender = await GetCurrentStudentProfileAsync();
                if (sender == null) return BadRequest(new { message = "Student profile not found." });

                var project = await _db.CourseProjects
                    .Include(p => p.Sections)
                    .FirstOrDefaultAsync(p => p.Id == projectId);
                if (project == null) return NotFound(new { message = "Project not found." });
                if (project.AiMode != "student")
                    return BadRequest(new { message = "This endpoint is only for student-select projects." });

                var sectionMap = await GetSectionMapByStudentAsync(project.CourseId);
                if (sectionMap.Count == 0)
                    return Ok(Array.Empty<object>());
                if (!sectionMap.TryGetValue(sender.Id, out var senderSectionId))
                    return BadRequest(new { message = "You are not enrolled in this course." });

                var currentTeamStudentIds = await GetProjectTeamStudentIdsAsync(projectId);
                var pendingInvitedIds = await _db.CourseTeamInvitations
                    .Where(i => i.ProjectId == projectId && i.SenderId == sender.Id && i.Status == "pending")
                    .Select(i => i.ReceiverId)
                    .ToListAsync();
                var requiredProjectSkills = GetProjectRequiredSkills(project);

                var enrolledStudentIds = sectionMap.Keys.ToList();
                if (enrolledStudentIds.Count == 0)
                    return Ok(Array.Empty<object>());

                var students = await _db.StudentProfiles
                    .Include(s => s.User)
                    .Where(s => enrolledStudentIds.Contains(s.Id))
                    .ToListAsync();
                var skillMap = await BuildSkillNameMapAsync(students.Append(sender));
                var senderSkills = skillMap.GetValueOrDefault(sender.Id, new HashSet<string>(StringComparer.OrdinalIgnoreCase));

                var result = students
                    .Where(s => s.Id != sender.Id)
                    .Select(s =>
                    {
                        var receiverSectionId = sectionMap.GetValueOrDefault(s.Id, 0);
                        var eligibleBySection = IsStudentEligibleForProject(project, senderSectionId, receiverSectionId);
                        var alreadyInTeam = currentTeamStudentIds.Contains(s.Id);
                        var alreadyInvited = pendingInvitedIds.Contains(s.Id);
                        var canInvite = eligibleBySection && !alreadyInTeam && !alreadyInvited;
                        var studentSkills = skillMap.GetValueOrDefault(s.Id, new HashSet<string>(StringComparer.OrdinalIgnoreCase));
                        var projectMatches = studentSkills.Intersect(requiredProjectSkills, StringComparer.OrdinalIgnoreCase).Count();
                        var complementaryCount = studentSkills.Except(senderSkills, StringComparer.OrdinalIgnoreCase).Count();
                        var matchScore = projectMatches + complementaryCount;
                        var matchReason = $"Matches {projectMatches} project skills, complements {complementaryCount} missing skill{(complementaryCount == 1 ? "" : "s")}";
                        return new
                        {
                            studentId = s.Id,
                            userId = s.UserId,
                            name = s.User?.Name ?? string.Empty,
                            sectionId = receiverSectionId,
                            skills = studentSkills,
                            matchScore,
                            matchReason,
                            canInvite,
                            alreadyInvited,
                            alreadyInTeam,
                        };
                    })
                    .OrderByDescending(r => r.matchScore)
                    .ThenBy(r => r.name)
                    .ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load eligible students for projectId {ProjectId}", projectId);
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("course-projects/{projectId:int}/my-team")]
        public async Task<IActionResult> GetMyCourseProjectTeam(int projectId)
        {
            var me = await GetCurrentStudentProfileAsync();
            if (me == null) return Unauthorized(new { message = "Student profile not found." });
            var meName = await _db.Users
                .Where(u => u.Id == me.UserId)
                .Select(u => u.Name)
                .FirstOrDefaultAsync() ?? string.Empty;

            var project = await _db.CourseProjects
                .FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return NotFound(new { message = "Project not found." });

            var team = await _db.CourseTeams
                .Include(t => t.Members)
                .ThenInclude(m => m.Student)
                .ThenInclude(s => s.User)
                .FirstOrDefaultAsync(t =>
                    t.CourseProjectId == projectId &&
                    t.Members.Any(m => m.StudentProfileId == me.Id));

            if (team != null)
            {
                var members = team.Members
                    .OrderBy(m => m.Student?.User?.Name ?? string.Empty)
                    .Select(m => new
                    {
                        studentId = m.StudentProfileId,
                        userId = m.UserId,
                        name = m.Student?.User?.Name ?? string.Empty,
                        status = "accepted",
                    })
                    .ToList();

                return Ok(new
                {
                    projectId,
                    teamSize = project.TeamSize,
                    selectedCount = members.Count,
                    seatsLeft = Math.Max(0, project.TeamSize - members.Count),
                    status = members.Count >= project.TeamSize ? "complete" : "forming",
                    members,
                    invitations = Array.Empty<object>(),
                });
            }

            var sent = await _db.CourseTeamInvitations
                .Include(i => i.Receiver).ThenInclude(s => s.User)
                .Where(i => i.ProjectId == projectId && i.SenderId == me.Id)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            var acceptedReceivers = sent
                .Where(i => i.Status == "accepted")
                .Select(i => new
                {
                    studentId = i.ReceiverId,
                    userId = i.Receiver?.UserId ?? 0,
                    name = i.Receiver?.User?.Name ?? string.Empty,
                    status = "accepted",
                })
                .ToList();

            var formingMembers = new List<object>
            {
                new
                {
                    studentId = me.Id,
                    userId = me.UserId,
                    name = meName,
                    status = "accepted",
                },
            };
            formingMembers.AddRange(acceptedReceivers);

            var invitations = sent.Select(i => new
            {
                id = i.Id,
                receiverId = i.ReceiverId,
                receiverUserId = i.Receiver?.UserId ?? 0,
                receiverName = i.Receiver?.User?.Name ?? string.Empty,
                status = i.Status,
                createdAt = i.CreatedAt,
                respondedAt = i.RespondedAt,
            }).ToList();

            var selectedCount = formingMembers.Count;
            var seatsLeft = Math.Max(0, project.TeamSize - selectedCount);

            return Ok(new
            {
                projectId,
                teamSize = project.TeamSize,
                selectedCount,
                seatsLeft,
                status = selectedCount >= project.TeamSize ? "complete" : "forming",
                members = formingMembers,
                invitations,
            });
        }

        private async Task<bool> TryCreateTeamFromAcceptedInvitationsAsync(int projectId, int senderId)
        {
            var project = await _db.CourseProjects
                .Include(p => p.Sections)
                .FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return false;

            if (await IsStudentInProjectTeam(projectId, senderId))
                return false;

            var acceptedInvites = await _db.CourseTeamInvitations
                .Where(i => i.ProjectId == projectId && i.SenderId == senderId && i.Status == "accepted")
                .OrderBy(i => i.RespondedAt ?? i.CreatedAt)
                .ToListAsync();

            var memberIds = new List<int> { senderId };
            memberIds.AddRange(acceptedInvites.Select(i => i.ReceiverId));
            memberIds = memberIds.Distinct().ToList();

            if (memberIds.Count < project.TeamSize) return false;

            var selectedMemberIds = memberIds.Take(project.TeamSize).ToList();
            var existingTeamMembers = await GetProjectTeamStudentIdsAsync(projectId);
            if (selectedMemberIds.Any(existingTeamMembers.Contains))
                return false;

            var sectionMap = await GetSectionMapByStudentAsync(project.CourseId);
            if (!sectionMap.TryGetValue(senderId, out var senderSectionId))
                return false;
            if (selectedMemberIds.Any(id => !sectionMap.ContainsKey(id)))
                return false;
            if (selectedMemberIds.Any(id => !IsStudentEligibleForProject(project, senderSectionId, sectionMap[id])))
                return false;

            var profiles = await _db.StudentProfiles
                .Where(s => selectedMemberIds.Contains(s.Id))
                .ToDictionaryAsync(s => s.Id, s => s.UserId);

            if (selectedMemberIds.Any(id => !profiles.ContainsKey(id)))
                return false;

            var nextTeamIndex = await _db.CourseTeams
                .Where(t => t.CourseProjectId == projectId)
                .Select(t => (int?)t.TeamIndex)
                .MaxAsync() ?? -1;

            var team = new CourseTeam
            {
                CourseProjectId = projectId,
                TeamIndex = nextTeamIndex + 1,
                CreatedAt = DateTime.UtcNow,
                Members = selectedMemberIds.Select(studentId => new CourseTeamMember
                {
                    StudentProfileId = studentId,
                    UserId = profiles[studentId],
                    MatchScore = 0,
                }).ToList(),
            };

            _db.CourseTeams.Add(team);

            var pendingInvites = await _db.CourseTeamInvitations
                .Where(i => i.ProjectId == projectId && i.SenderId == senderId && i.Status == "pending")
                .ToListAsync();
            foreach (var inv in pendingInvites)
            {
                inv.Status = "rejected";
                inv.RespondedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return true;
        }

        private async Task<StudentProfile?> GetCurrentStudentProfileAsync()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId == 0) return null;
            return await _db.StudentProfiles.FirstOrDefaultAsync(s => s.UserId == userId);
        }

        private async Task<bool> IsStudentInProjectTeam(int projectId, int studentProfileId)
        {
            return await _db.CourseTeamMembers
                .AnyAsync(m => m.StudentProfileId == studentProfileId && m.Team.CourseProjectId == projectId);
        }

        private async Task<HashSet<int>> GetProjectTeamStudentIdsAsync(int projectId)
        {
            var ids = await _db.CourseTeamMembers
                .Where(m => m.Team.CourseProjectId == projectId)
                .Select(m => m.StudentProfileId)
                .Distinct()
                .ToListAsync();
            return ids.ToHashSet();
        }

        private async Task<Dictionary<int, int>> GetSectionMapByStudentAsync(int courseId)
        {
            var pairs = await _db.SectionEnrollments
                .Where(e => e.Section.CourseId == courseId)
                .Select(e => new { e.StudentProfileId, e.CourseSectionId })
                .Distinct()
                .ToListAsync();

            // Guard against duplicate student keys (students enrolled in multiple sections).
            return pairs
                .GroupBy(x => x.StudentProfileId)
                .ToDictionary(g => g.Key, g => g.First().CourseSectionId);
        }

        private HashSet<string> GetProjectRequiredSkills(CourseProject project)
        {
            // Prefer explicit required skills from model; fallback to description for older projects.
            var fromRequiredSkills = ParseSkillNamesFromJsonOrCsv(project.RequiredSkills);
            if (fromRequiredSkills.Count > 0) return fromRequiredSkills;

            var fromDescription = ParseSkillNamesFromJsonOrCsv(project.Description);
            if (fromDescription.Count > 0) return fromDescription;
            return new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        }

        private async Task<Dictionary<int, HashSet<string>>> BuildSkillNameMapAsync(IEnumerable<StudentProfile> profiles)
        {
            var list = profiles.Where(p => p != null).ToList();
            var allIds = list.SelectMany(p =>
                SkillHelper.ParseIntList(p.TechnicalSkills)
                .Concat(SkillHelper.ParseIntList(p.Roles))
                .Concat(SkillHelper.ParseIntList(p.Tools)))
                .Distinct()
                .ToList();

            var idToName = new Dictionary<int, string>();
            if (allIds.Count > 0)
            {
                var dbNames = await _db.Skills
                    .Where(sk => allIds.Contains(sk.Id))
                    .Select(sk => new { sk.Id, sk.Name })
                    .ToListAsync();
                foreach (var row in dbNames)
                {
                    if (!string.IsNullOrWhiteSpace(row.Name)) idToName[row.Id] = row.Name.Trim();
                }
            }

            var map = new Dictionary<int, HashSet<string>>();
            foreach (var p in list)
            {
                var names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach (var n in ParseSkillNamesFromJsonOrCsv(p.TechnicalSkills)) names.Add(n);
                foreach (var n in ParseSkillNamesFromJsonOrCsv(p.Roles)) names.Add(n);
                foreach (var n in ParseSkillNamesFromJsonOrCsv(p.Tools)) names.Add(n);

                foreach (var id in SkillHelper.ParseIntList(p.TechnicalSkills)) if (idToName.TryGetValue(id, out var n)) names.Add(n);
                foreach (var id in SkillHelper.ParseIntList(p.Roles)) if (idToName.TryGetValue(id, out var n)) names.Add(n);
                foreach (var id in SkillHelper.ParseIntList(p.Tools)) if (idToName.TryGetValue(id, out var n)) names.Add(n);

                map[p.Id] = names;
            }
            return map;
        }

        private static HashSet<string> ParseSkillNamesFromJsonOrCsv(string? raw)
        {
            var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (string.IsNullOrWhiteSpace(raw)) return set;

            try
            {
                var arr = JsonSerializer.Deserialize<List<string>>(raw);
                if (arr != null)
                {
                    foreach (var v in arr)
                    {
                        if (!string.IsNullOrWhiteSpace(v)) set.Add(v.Trim());
                    }
                    if (set.Count > 0) return set;
                }
            }
            catch
            {
                // fallback to CSV-ish parse below
            }

            var parts = raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var p in parts)
            {
                if (!string.IsNullOrWhiteSpace(p)) set.Add(p.Trim());
            }
            return set;
        }

        private static bool IsStudentEligibleForProject(CourseProject project, int senderSectionId, int receiverSectionId)
        {
            if (project.ApplyToAllSections)
            {
                if (!project.AllowCrossSectionTeams && senderSectionId != receiverSectionId)
                    return false;
                return true;
            }

            var allowedSectionIds = project.Sections.Select(s => s.CourseSectionId).ToHashSet();
            return allowedSectionIds.Contains(senderSectionId) && allowedSectionIds.Contains(receiverSectionId);
        }
    }
}
