using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Helpers
{
    /// <summary>
    /// Invite eligibility aligned with <c>StudentProjectController.SendInvitation</c>
    /// plus membership rules from <c>CheckProjectConflict</c>.
    /// </summary>
    public static class GraduationProjectInviteEligibilityHelper
    {
        public static IReadOnlyList<string> EligibilityRuleDescriptions { get; } = new[]
        {
            "Receiver is not the project owner (StudentProfile.Id == project.OwnerId).",
            "Receiver does not own any row in graduation_projects (OwnerId == receiverId).",
            "Receiver is not already on the current project team (graduation_project_members for this project).",
            "Receiver has no pending project_invitations for this project.",
            "Receiver is not on any graduation project team (any graduation_project_members row).",
            "Project is not full (Members.Count < PartnersCount) — enforced before recommendations run.",
            "Matches POST /api/graduation-projects/{projectId}/invite/{receiverId} ownership/member/pending checks.",
        };

        public static async Task<HashSet<int>> GetGraduationProjectOwnerProfileIdsAsync(ApplicationDbContext db)
        {
            var ids = await db.StudentProjects
                .AsNoTracking()
                .Select(p => p.OwnerId)
                .ToListAsync();
            return ids.ToHashSet();
        }

        /// <summary>
        /// Returns true only if SendInvitation would not reject this receiver for the given project.
        /// Uses live DB queries for ownership and pending invites (same as invite endpoint).
        /// </summary>
        public static async Task<bool> CanBeInvitedToProjectAsync(
            ApplicationDbContext db,
            StudentProject project,
            int receiverStudentProfileId)
        {
            if (receiverStudentProfileId <= 0)
                return false;

            if (receiverStudentProfileId == project.OwnerId)
                return false;

            // POST .../invite/{receiverId} — "This student already owns a graduation project."
            if (await db.StudentProjects.AsNoTracking().AnyAsync(p => p.OwnerId == receiverStudentProfileId))
                return false;

            // POST .../invite — "User already a member."
            if (project.Members.Any(m => m.StudentId == receiverStudentProfileId))
                return false;

            // POST .../invite — pending invitation conflict
            if (await db.ProjectInvitations.AsNoTracking().AnyAsync(i =>
                    i.ProjectId == project.Id &&
                    i.ReceiverId == receiverStudentProfileId &&
                    i.Status == "pending"))
                return false;

            // CheckProjectConflict — already on another graduation project team
            if (await db.StudentProjectMembers.AsNoTracking().AnyAsync(m => m.StudentId == receiverStudentProfileId))
                return false;

            return true;
        }
    }
}
