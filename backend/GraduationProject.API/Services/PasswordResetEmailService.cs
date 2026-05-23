using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services
{
    public class PasswordResetEmailService : IPasswordResetEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<PasswordResetEmailService> _logger;

        public PasswordResetEmailService(
            IConfiguration config,
            ILogger<PasswordResetEmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task<PasswordResetDeliveryResult> SendPasswordResetAsync(string toEmail, string resetUrl)
        {
            var host = _config["Smtp:Host"];
            if (string.IsNullOrWhiteSpace(host))
            {
                _logger.LogWarning(
                    "Password reset for {Email}: SMTP is not configured (Smtp:Host missing). Reset URL: {ResetUrl}",
                    toEmail,
                    resetUrl);
                return new PasswordResetDeliveryResult(PasswordResetDeliveryOutcome.NotConfigured);
            }

            try
            {
                var port = int.TryParse(_config["Smtp:Port"], out var p) ? p : 587;
                var from = _config["Smtp:From"] ?? "noreply@skillswap.local";
                var user = _config["Smtp:Username"];
                var pass = _config["Smtp:Password"];
                var enableSsl = !string.Equals(_config["Smtp:EnableSsl"], "false", StringComparison.OrdinalIgnoreCase);

                using var client = new SmtpClient(host, port)
                {
                    EnableSsl = enableSsl,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                };

                if (!string.IsNullOrWhiteSpace(user))
                    client.Credentials = new NetworkCredential(user, pass);

                var message = new MailMessage(from, toEmail)
                {
                    Subject = "Reset your SkillSwap password",
                    Body =
                        "You requested a password reset for SkillSwap.\n\n" +
                        $"Reset your password using this link (valid for a limited time):\n{resetUrl}\n\n" +
                        "If you did not request this, you can ignore this email.",
                    IsBodyHtml = false,
                };

                await client.SendMailAsync(message);

                _logger.LogInformation("Password reset email sent to {Email}", toEmail);
                return new PasswordResetDeliveryResult(PasswordResetDeliveryOutcome.Sent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {Email}", toEmail);
                return new PasswordResetDeliveryResult(
                    PasswordResetDeliveryOutcome.Failed,
                    ex.Message);
            }
        }
    }
}
