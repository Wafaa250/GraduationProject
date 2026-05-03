using GraduationProject.API.Models;

namespace GraduationProject.API.Interfaces
{
    public interface ISectionChatRepository
    {
        Task<IEnumerable<SectionChatMessage>> GetMessagesAsync(int sectionId, int limit);
        Task<SectionChatMessage> SendMessageAsync(SectionChatMessage message);
    }
}
