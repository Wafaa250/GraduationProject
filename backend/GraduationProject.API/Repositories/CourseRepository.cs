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

        public async Task<Dictionary<int, string>> GetDoctorNamesByIdsAsync(List<int> doctorProfileIds)
        {
            if (doctorProfileIds == null || doctorProfileIds.Count == 0)
                return new Dictionary<int, string>();

            // Join DoctorProfiles → Users to get the name directly
            // Key = DoctorProfile.Id, Value = User.Name
            var result = await _context.DoctorProfiles
                .Where(d => doctorProfileIds.Contains(d.Id))
                .Select(d => new { d.Id, d.UserId })
                .ToListAsync();

            if (result.Count == 0)
                return new Dictionary<int, string>();

            var userIds = result.Select(x => x.UserId).ToList();
            var userNames = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, u.Name })
                .ToDictionaryAsync(u => u.Id, u => u.Name);

            return result.ToDictionary(
                d => d.Id,
                d => userNames.GetValueOrDefault(d.UserId, string.Empty));
        }

        public async Task<StudentProfile?> GetStudentByUniversityIdAsync(string universityId)
        {
            return await _context.StudentProfiles
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.StudentId == universityId);
        }
    }
}