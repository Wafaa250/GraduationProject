using System.Threading;
using System.Threading.Tasks;

namespace GraduationProject.API.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string toEmail, string recipientName, string resetLink, CancellationToken cancellationToken = default);
    }
}
