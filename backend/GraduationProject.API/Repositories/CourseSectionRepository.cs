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

        public async Task<CourseSection> UpdateAsync(CourseSection section)
        {
            _context.CourseSections.Update(section);
            await _context.SaveChangesAsync();
            return section;
        }

        public async Task<bool> DeleteAsync(int sectionId)
        {
            var hasEnrollments = await _context.SectionEnrollments
                .AnyAsync(e => e.CourseSectionId == sectionId);
            if (hasEnrollments) return false;

            var section = await _context.CourseSections.FindAsync(sectionId);
            if (section is null) return false;

            _context.CourseSections.Remove(section);
            await _context.SaveChangesAsync();
            return true;
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

        public async Task<bool> RemoveEnrollmentAsync(int sectionId, int studentProfileId)
        {
            var enrollment = await _context.SectionEnrollments
                .FirstOrDefaultAsync(e =>
                    e.CourseSectionId == sectionId && e.StudentProfileId == studentProfileId);
            if (enrollment is null) return false;

            _context.SectionEnrollments.Remove(enrollment);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<SectionEnrollment?> MoveEnrollmentWithinCourseAsync(
            int courseId,
            int studentProfileId,
            int targetSectionId)
        {
            var targetSection = await _context.CourseSections
                .FirstOrDefaultAsync(s => s.Id == targetSectionId && s.CourseId == courseId);
            if (targetSection is null) return null;

            var enrollment = await _context.SectionEnrollments
                .Include(e => e.Student).ThenInclude(s => s!.User)
                .FirstOrDefaultAsync(e =>
                    e.StudentProfileId == studentProfileId && e.Section.CourseId == courseId);

            if (enrollment is null) return null;

            enrollment.CourseSectionId = targetSectionId;
            await _context.SaveChangesAsync();
            return enrollment;
        }
    }
}