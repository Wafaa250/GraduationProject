using GraduationProject.API.Data;
using GraduationProject.API.Interfaces;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Repositories
{
    public class SectionChatRepository : ISectionChatRepository
    {
        private readonly ApplicationDbContext _context;

        public SectionChatRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SectionChatMessage>> GetMessagesAsync(int sectionId, int limit)
        {
            return await _context.SectionChatMessages
                .Where(m => m.CourseSectionId == sectionId)
                .Include(m => m.Sender)
                .OrderByDescending(m => m.SentAt)
                .Take(limit)
                .OrderBy(m => m.SentAt)        // return in ascending order after limiting
                .ToListAsync();
        }

        public async Task<SectionChatMessage> SendMessageAsync(SectionChatMessage message)
        {
            _context.SectionChatMessages.Add(message);
            await _context.SaveChangesAsync();

            // Reload with Sender so controller can map immediately
            await _context.Entry(message)
                .Reference(m => m.Sender)
                .LoadAsync();

            return message;
        }
    }
}
