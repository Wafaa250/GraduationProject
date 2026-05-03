using GraduationProject.API.Data;
using GraduationProject.API.Interfaces;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Repositories
{
    public class CourseTeamChatRepository : ICourseTeamChatRepository
    {
        private readonly ApplicationDbContext _context;

        public CourseTeamChatRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<CourseTeamMessage>> GetMessagesAsync(int courseTeamId, int limit = 100)
        {
            return await _context.CourseTeamMessages
                .Where(m => m.CourseTeamId == courseTeamId)
                .Include(m => m.Sender)
                .OrderBy(m => m.SentAt)
                .Take(Math.Clamp(limit, 1, 500))
                .ToListAsync();
        }

        public async Task<CourseTeamMessage> SendMessageAsync(CourseTeamMessage message)
        {
            _context.CourseTeamMessages.Add(message);
            await _context.SaveChangesAsync();
            await _context.Entry(message).Reference(m => m.Sender).LoadAsync();
            return message;
        }

        public async Task<bool> IsTeamMemberAsync(int courseTeamId, int userId)
        {
            return await _context.CourseTeamMembers
                .AnyAsync(m => m.CourseTeamId == courseTeamId && m.UserId == userId);
        }
    }
}
