using GraduationProject.API.Data;
using GraduationProject.API.Interfaces;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Repositories
{
    public class CourseTeamRepository : ICourseTeamRepository
    {
        private readonly ApplicationDbContext _context;

        public CourseTeamRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CourseTeam>> GetTeamsByProjectAsync(int projectId)
        {
            return await _context.CourseTeams
                .Where(t => t.CourseProjectId == projectId)
                .Include(t => t.Members)
                    .ThenInclude(m => m.Student)
                        .ThenInclude(s => s.User)
                .OrderBy(t => t.TeamIndex)
                .ToListAsync();
        }

        public async Task DeleteTeamsForProjectAsync(int projectId)
        {
            var existing = await _context.CourseTeams
                .Where(t => t.CourseProjectId == projectId)
                .ToListAsync();

            if (existing.Count == 0)
                return;

            _context.CourseTeams.RemoveRange(existing);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<CourseTeam>> SaveTeamsAsync(int projectId, List<CourseTeam> teams)
        {
            foreach (var t in teams)
                t.CourseProjectId = projectId;

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                var existing = await _context.CourseTeams
                    .Where(t => t.CourseProjectId == projectId)
                    .ToListAsync();

                _context.CourseTeams.RemoveRange(existing);
                await _context.SaveChangesAsync();

                _context.CourseTeams.AddRange(teams);
                await _context.SaveChangesAsync();

                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            return await GetTeamsByProjectAsync(projectId);
        }

        public async Task<CourseTeam?> GetTeamByIndexAsync(int projectId, int teamIndex)
        {
            return await _context.CourseTeams
                .Include(t => t.Members)
                    .ThenInclude(m => m.Student)
                        .ThenInclude(s => s.User)
                .FirstOrDefaultAsync(t => t.CourseProjectId == projectId && t.TeamIndex == teamIndex);
        }

        public async Task AddMemberAsync(int teamId, int studentProfileId, int userId)
        {
            // Already in this exact team — nothing to do
            var alreadyInThisTeam = await _context.CourseTeamMembers
                .AnyAsync(m => m.CourseTeamId == teamId && m.StudentProfileId == studentProfileId);

            if (alreadyInThisTeam) return;

            // If student is in another team of the same project, remove them first
            var projectId = await _context.CourseTeams
                .Where(t => t.Id == teamId)
                .Select(t => t.CourseProjectId)
                .FirstOrDefaultAsync();

            var existingMembership = await _context.CourseTeamMembers
                .Include(m => m.Team)
                .FirstOrDefaultAsync(m =>
                    m.StudentProfileId == studentProfileId &&
                    m.Team.CourseProjectId == projectId);

            if (existingMembership != null)
                _context.CourseTeamMembers.Remove(existingMembership);

            _context.CourseTeamMembers.Add(new CourseTeamMember
            {
                CourseTeamId     = teamId,
                StudentProfileId = studentProfileId,
                UserId           = userId,
                MatchScore       = 0,
            });

            await _context.SaveChangesAsync();
        }

        public async Task RemoveMemberAsync(int teamId, int studentProfileId)
        {
            var member = await _context.CourseTeamMembers
                .FirstOrDefaultAsync(m => m.CourseTeamId == teamId && m.StudentProfileId == studentProfileId);

            if (member != null)
            {
                _context.CourseTeamMembers.Remove(member);
                await _context.SaveChangesAsync();
            }
        }
    }
}
