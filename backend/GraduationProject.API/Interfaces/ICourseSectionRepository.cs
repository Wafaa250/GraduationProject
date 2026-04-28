using GraduationProject.API.Models;

namespace GraduationProject.API.Interfaces
{
    public interface ICourseSectionRepository
    {
        Task<IEnumerable<CourseSection>> GetByCourseIdAsync(int courseId);
        Task<CourseSection?> GetByIdAsync(int sectionId);
        Task<CourseSection> CreateAsync(CourseSection section);

        // ── Students ──────────────────────────────────────────────────────────

        Task<IEnumerable<SectionEnrollment>> GetStudentsAsync(int sectionId);

        Task<(List<SectionEnrollment> Added, List<string> NotFound, List<string> AlreadyEnrolled)>
            AddStudentsAsync(int sectionId, List<string> universityIds);

        // ── Enrolled courses (student view) ───────────────────────────────────

        /// <summary>
        /// Returns all sections (with their course) that the student is enrolled in.
        /// </summary>
        Task<IEnumerable<SectionEnrollment>> GetEnrolledSectionsByStudentAsync(int studentProfileId);
    }
}
