using GraduationProject.API.Data;
using GraduationProject.API.Interfaces;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Repositories
{
    public class CourseRepository : ICourseRepository
    {
        private readonly ApplicationDbContext _context;

        public CourseRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int?> GetDoctorProfileIdByUserIdAsync(int userId)
        {
            var profile = await _context.DoctorProfiles
                .FirstOrDefaultAsync(d => d.UserId == userId);
            return profile?.Id;
        }

        public async Task<int?> GetStudentProfileIdByUserIdAsync(int userId)
        {
            var profile = await _context.StudentProfiles
                .FirstOrDefaultAsync(s => s.UserId == userId);
            return profile?.Id;
        }

        public async Task<IEnumerable<Course>> GetByDoctorIdAsync(int doctorId)
        {
            return await _context.Courses
                .Where(c => c.DoctorId == doctorId)
                .Include(c => c.Doctor)
                    .ThenInclude(d => d.User)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<Course?> GetByIdAsync(int courseId)
        {
            return await _context.Courses
                .Include(c => c.Doctor)
                    .ThenInclude(d => d.User)
                .FirstOrDefaultAsync(c => c.Id == courseId);
        }

        public async Task<Course> CreateAsync(Course course)
        {
            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            await _context.Entry(course)
                .Reference(c => c.Doctor)
                .Query()
                .Include(d => d.User)
                .LoadAsync();

            return course;
        }
    }
}