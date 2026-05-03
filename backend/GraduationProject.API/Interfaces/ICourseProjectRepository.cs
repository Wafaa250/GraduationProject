using GraduationProject.API.Models;

namespace GraduationProject.API.Interfaces
{
    public interface ICourseProjectRepository
    {
        Task<IEnumerable<CourseProject>> GetByCourseIdAsync(int courseId);
        Task<CourseProject?> GetByIdAsync(int projectId);
        Task<CourseProject> CreateAsync(CourseProject project, List<int> sectionIds);
        Task<CourseProject> UpdateAsync(CourseProject project, List<int> sectionIds);
        Task DeleteAsync(int projectId);
    }
}
