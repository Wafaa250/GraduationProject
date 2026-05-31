using System;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace GraduationProject.API.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<SmtpEmailService> _logger;

        public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string resetUrl)
        {
            var enabled = _config.GetValue<bool>("Email:Enabled");
            if (!enabled)
            {
                _logger.LogWarning(
                    "Email is disabled. Password reset link for {Email}: {ResetUrl}",
                    toEmail,
                    resetUrl);
                return;
            }

            var host = _config["Email:SmtpHost"];
            if (string.IsNullOrWhiteSpace(host))
            {
                _logger.LogWarning(
                    "Email:SmtpHost is not configured. Password reset link for {Email}: {ResetUrl}",
                    toEmail,
                    resetUrl);
                return;
            }

            var body = $"""
                <p>Hello,</p>
                <p>We received a request to reset your SkillSwap password.</p>
                <p><a href="{resetUrl}">Reset your password</a></p>
                <p>This link expires in {_config.GetValue<int>("PasswordReset:TokenExpirationMinutes", 60)} minutes.</p>
                <p>If you did not request this, you can ignore this email.</p>
                <p>— SkillSwap</p>
                """;

            await SendOptionalEmailAsync(toEmail, "Reset your SkillSwap password", body);
        }

        public async Task SendCompanyMemberWelcomeEmailAsync(
            string toEmail,
            string fullName,
            string companyName,
            string loginEmail,
            string temporaryPassword,
            string loginUrl)
        {
            var safeName = System.Net.WebUtility.HtmlEncode(fullName);
            var safeCompany = System.Net.WebUtility.HtmlEncode(
                string.IsNullOrWhiteSpace(companyName) ? "your company" : companyName);
            var safeEmail = System.Net.WebUtility.HtmlEncode(loginEmail);
            var safePassword = System.Net.WebUtility.HtmlEncode(temporaryPassword);
            var safeLoginUrl = System.Net.WebUtility.HtmlEncode(loginUrl);

            var body = $"""
                <p>Hello {safeName},</p>
                <p>You have been added to the <strong>{safeCompany}</strong> workspace on SkillSwap.</p>
                <p><strong>Email:</strong><br />{safeEmail}</p>
                <p><strong>Temporary Password:</strong><br />{safePassword}</p>
                <p>For security reasons, you will be required to change this password immediately after your first login.</p>
                <p><strong>Login URL:</strong><br /><a href="{safeLoginUrl}">{safeLoginUrl}</a></p>
                <p>Thank you,<br />SkillSwap</p>
                """;

            await SendRequiredEmailAsync(toEmail, "Welcome to SkillSwap", body);
        }

        private async Task SendOptionalEmailAsync(string toEmail, string subject, string htmlBody)
        {
            try
            {
                await SendEmailCoreAsync(toEmail, subject, htmlBody);
                _logger.LogInformation("Email sent to {Email} with subject {Subject}", toEmail, subject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Optional email delivery failed for {Email} ({Subject})", toEmail, subject);
            }
        }

        private async Task SendRequiredEmailAsync(string toEmail, string subject, string htmlBody)
        {
            if (!_config.GetValue<bool>("Email:Enabled"))
            {
                throw new EmailSendException(
                    "Email delivery is disabled. Enable Email:Enabled and configure SMTP settings.");
            }

            var host = _config["Email:SmtpHost"];
            if (string.IsNullOrWhiteSpace(host))
            {
                throw new EmailSendException("Email:SmtpHost is not configured.");
            }

            try
            {
                await SendEmailCoreAsync(toEmail, subject, htmlBody);
                _logger.LogInformation("Email sent to {Email} with subject {Subject}", toEmail, subject);
            }
            catch (EmailSendException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Required email delivery failed for {Email} ({Subject})", toEmail, subject);
                throw new EmailSendException("Failed to send email. Please try again later.", ex);
            }
        }

        private async Task SendEmailCoreAsync(string toEmail, string subject, string htmlBody)
        {
            var host = _config["Email:SmtpHost"];
            if (string.IsNullOrWhiteSpace(host))
                throw new EmailSendException("Email:SmtpHost is not configured.");

            var port = _config.GetValue<int>("Email:SmtpPort", 587);
            var useSsl = _config.GetValue<bool>("Email:UseSsl", true);
            var fromAddress = _config["Email:FromAddress"] ?? "noreply@skillswap.local";
            var fromName = _config["Email:FromName"] ?? "SkillSwap";
            var username = _config["Email:Username"];
            var password = _config["Email:Password"];

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromAddress));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = htmlBody };

            using var client = new SmtpClient();
            await client.ConnectAsync(host, port, useSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto);
            if (!string.IsNullOrWhiteSpace(username))
                await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }
    }
}
