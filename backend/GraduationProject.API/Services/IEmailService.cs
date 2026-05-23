using System.Threading.Tasks;

namespace GraduationProject.API.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string toEmail, string resetUrl);
    }
}
