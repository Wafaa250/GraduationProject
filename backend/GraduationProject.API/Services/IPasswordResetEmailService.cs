using System.Threading.Tasks;

namespace GraduationProject.API.Services
{
    public enum PasswordResetDeliveryOutcome
    {
        /// <summary>Email accepted by SMTP server.</summary>
        Sent,
        /// <summary>No SMTP host configured — URL logged server-side only.</summary>
        NotConfigured,
        /// <summary>SMTP send failed.</summary>
        Failed,
    }

    public readonly record struct PasswordResetDeliveryResult(
        PasswordResetDeliveryOutcome Outcome,
        string? ErrorMessage = null);

    public interface IPasswordResetEmailService
    {
        Task<PasswordResetDeliveryResult> SendPasswordResetAsync(string toEmail, string resetUrl);
    }
}
