using System.Threading.Tasks;

namespace GraduationProject.API.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string toEmail, string resetUrl);

        /// <summary>
        /// Sends workspace onboarding credentials. Throws <see cref="EmailSendException"/> on failure.
        /// </summary>
        Task SendCompanyMemberWelcomeEmailAsync(
            string toEmail,
            string fullName,
            string companyName,
            string loginEmail,
            string temporaryPassword,
            string loginUrl);
    }
}
