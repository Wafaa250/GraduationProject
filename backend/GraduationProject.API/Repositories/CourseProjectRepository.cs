using GraduationProject.API.Data;
using GraduationProject.API.Interfaces;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Repositories
{
    public class CourseProjectRepository : ICourseProjectRepository
    {
        private readonly ApplicationDbContext _context;

        public CourseProjectRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CourseProject>> GetByCourseIdAsync(int courseId)
        {
            return await _context.CourseProjects
                .Where(p => p.CourseId == courseId)
                .Include(p => p.Sections)
                    .ThenInclude(s => s.Section)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<CourseProject?> GetByIdAsync(int projectId)
        {
            return await _context.CourseProjects
                .Include(p => p.Sections)
                    .ThenInclude(s => s.Section)
                .FirstOrDefaultAsync(p => p.Id == projectId);
        }

        public async Task<CourseProject> CreateAsync(CourseProject project, List<int> sectionIds)
        {
            _context.CourseProjects.Add(project);
            await _context.SaveChangesAsync();

            await SyncSectionsAsync(project.Id, sectionIds);

            return (await GetByIdAsync(project.Id))!;
        }

        public async Task<CourseProject> UpdateAsync(CourseProject project, List<int> sectionIds)
        {
            _context.CourseProjects.Update(project);
            await _context.SaveChangesAsync();

            await SyncSectionsAsync(project.Id, sectionIds);

            return (await GetByIdAsync(project.Id))!;
        }

        public async Task DeleteAsync(int projectId)
        {
            var project = await _context.CourseProjects.FindAsync(projectId);
            if (project != null)
            {
                _context.CourseProjects.Remove(project);
                await _context.SaveChangesAsync();
            }
        }

        // ── private helper ────────────────────────────────────────────────────

        private async Task SyncSectionsAsync(int projectId, List<int> sectionIds)
        {
            // Remove old
            var existing = await _context.CourseProjectSections
                .Where(s => s.CourseProjectId == projectId)
                .ToListAsync();
            _context.CourseProjectSections.RemoveRange(existing);

            // Add new
            if (sectionIds.Count > 0)
            {
                var newLinks = sectionIds.Distinct().Select(sid => new CourseProjectSection
                {
                    CourseProjectId  = projectId,
                    CourseSectionId  = sid,
                });
                _context.CourseProjectSections.AddRange(newLinks);
            }

            await _context.SaveChangesAsync();
        }
    }
}
