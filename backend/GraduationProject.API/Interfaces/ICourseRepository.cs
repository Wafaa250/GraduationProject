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
    }
}