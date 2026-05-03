using GraduationProject.API.Data;
using GraduationProject.API.Interfaces;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Repositories
{
    public class CourseSectionRepository : ICourseSectionRepository
    {
        private readonly ApplicationDbContext _context;

        public CourseSectionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        // ── Section CRUD ──────────────────────────────────────────────────────

        public async Task<IEnumerable<CourseSection>> GetByCourseIdAsync(int courseId)
        {
            return await _context.CourseSections
                .Where(s => s.CourseId == courseId)
                .OrderBy(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task<CourseSection?> GetByIdAsync(int sectionId)
        {
            return await _context.CourseSections
                .FirstOrDefaultAsync(s => s.Id == sectionId);
        }

        public async Task<CourseSection> CreateAsync(CourseSection section)
        {
            _context.CourseSections.Add(section);
            await _context.SaveChangesAsync();
            return section;
        }

        // ── Students ──────────────────────────────────────────────────────────

        public async Task<IEnumerable<SectionEnrollment>> GetStudentsAsync(int sectionId)
        {
            return await _context.SectionEnrollments
                .Where(e => e.CourseSectionId == sectionId)
                .Include(e => e.Student)
                    .ThenInclude(s => s.User)
                .OrderBy(e => e.EnrolledAt)
                .ToListAsync();
        }

        public async Task<(List<SectionEnrollment> Added, List<string> NotFound, List<string> AlreadyEnrolled)>
            AddStudentsAsync(int sectionId, List<string> universityIds)
        {
            var added = new List<SectionEnrollment>();
            var notFound = new List<string>();
            var alreadyEnrolled = new List<string>();

            var existingStudentIds = (await _context.SectionEnrollments
                .Where(e => e.CourseSectionId == sectionId)
                .Select(e => e.StudentProfileId)
                .ToListAsync())
                .ToHashSet();

            foreach (var uid in universityIds.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var profile = await _context.StudentProfiles
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.StudentId == uid);

                if (profile == null)
                {
                    notFound.Add(uid);
                    continue;
                }

                if (existingStudentIds.Contains(profile.Id))
                {
                    alreadyEnrolled.Add(uid);
                    continue;
                }

                var enrollment = new SectionEnrollment
                {
                    CourseSectionId = sectionId,
                    StudentProfileId = profile.Id,
                    EnrolledAt = DateTime.UtcNow,
                };

                _context.SectionEnrollments.Add(enrollment);
                enrollment.Student = profile;
                existingStudentIds.Add(profile.Id);
                added.Add(enrollment);
            }

            if (added.Count > 0)
                await _context.SaveChangesAsync();

            return (added, notFound, alreadyEnrolled);
        }

        // ── Enrolled courses (student view) ───────────────────────────────────

        public async Task<IEnumerable<SectionEnrollment>> GetEnrolledSectionsByStudentAsync(int studentProfileId)
        {
            return await _context.SectionEnrollments
                .Where(e => e.StudentProfileId == studentProfileId)
                .Include(e => e.Section)
                    .ThenInclude(s => s.Course)
                .OrderBy(e => e.EnrolledAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<SectionEnrollment>> GetAllEnrollmentsByCourseIdAsync(int courseId)
        {
            return await _context.SectionEnrollments
                .Where(e => e.Section.CourseId == courseId)
                .Include(e => e.Student)
                    .ThenInclude(s => s.User)
                .OrderBy(e => e.EnrolledAt)
                .ToListAsync();
        }
    }
}