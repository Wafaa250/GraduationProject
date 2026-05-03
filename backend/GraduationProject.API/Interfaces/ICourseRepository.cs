using GraduationProject.API.Models;

namespace GraduationProject.API.Interfaces
{
    public interface ICourseRepository
    {
        Task<IEnumerable<Course>> GetByDoctorIdAsync(int doctorId);
        Task<Course?> GetByIdAsync(int courseId);
        Task<Course> CreateAsync(Course course);

        Task<int?> GetDoctorProfileIdByUserIdAsync(int userId);
        Task<int?> GetStudentProfileIdByUserIdAsync(int userId);

        /// <summary>Returns a map of DoctorProfileId → DoctorUserName.</summary>
        Task<Dictionary<int, string>> GetDoctorNamesByIdsAsync(List<int> doctorProfileIds);

        /// <summary>Finds a StudentProfile by university student ID string.</summary>
        Task<GraduationProject.API.Models.StudentProfile?> GetStudentByUniversityIdAsync(string universityId);
    }
}