using GraduationProject.API.Models;

namespace GraduationProject.API.Interfaces
{
    public interface ICourseSectionRepository
    {
        Task<IEnumerable<CourseSection>> GetByCourseIdAsync(int courseId);
        Task<CourseSection?> GetByIdAsync(int sectionId);
        Task<CourseSection> CreateAsync(CourseSection section);
        Task<CourseSection> UpdateAsync(CourseSection section);

        /// <returns>false if section has enrollments and cannot be deleted.</returns>
        Task<bool> DeleteAsync(int sectionId);

        // ── Students ──────────────────────────────────────────────────────────

        Task<IEnumerable<SectionEnrollment>> GetStudentsAsync(int sectionId);

        Task<(List<SectionEnrollment> Added, List<string> NotFound, List<string> AlreadyEnrolled)>
            AddStudentsAsync(int sectionId, List<string> universityIds);

        // ── Enrolled courses (student view) ───────────────────────────────────

        /// <summary>
        /// Returns all sections (with their course) that the student is enrolled in.
        /// </summary>
        Task<IEnumerable<SectionEnrollment>> GetEnrolledSectionsByStudentAsync(int studentProfileId);

        /// <summary>Returns all enrollments for all sections of a course.</summary>
        Task<IEnumerable<SectionEnrollment>> GetAllEnrollmentsByCourseIdAsync(int courseId);

        Task<bool> RemoveEnrollmentAsync(int sectionId, int studentProfileId);

        /// <summary>Moves a student's enrollment within the same course to another section.</summary>
        Task<SectionEnrollment?> MoveEnrollmentWithinCourseAsync(
            int courseId,
            int studentProfileId,
            int targetSectionId);
    }
}