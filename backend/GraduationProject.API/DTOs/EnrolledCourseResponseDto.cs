namespace GraduationProject.API.DTOs
{
    /// <summary>
    /// Returned by GET /api/courses/enrolled (student view).
    /// Matches the EnrolledCourse interface in studentCoursesApi.ts.
    /// </summary>
    public class EnrolledCourseResponseDto
    {
        public int CourseId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Semester { get; set; }
        public int DoctorId { get; set; }
        public string DoctorName { get; set; } = string.Empty;

        /// <summary>Which section this student is enrolled in.</summary>
        public EnrolledSectionDto? Section { get; set; }
    }

    public class EnrolledSectionDto
    {
        public int SectionId { get; set; }
        public string SectionName { get; set; } = string.Empty;
    }
}
