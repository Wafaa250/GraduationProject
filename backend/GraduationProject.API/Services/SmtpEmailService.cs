using System;
using System.Threading.Tasks;
using GraduationProject.API.Services.Email;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using MimeKit.Utils;

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

        public async Task SendPasswordResetOtpEmailAsync(
            string toEmail,
            string verificationCode,
            string? recipientName = null)
        {
            var enabled = _config.GetValue<bool>("Email:Enabled");

            if (!enabled)
            {
                _logger.LogWarning(
                    "Email send failed: Email:Enabled is false. Password reset OTP for {Email} was not sent.",
                    toEmail);
                return;
            }

            var host = _config["Email:SmtpHost"];
            if (string.IsNullOrWhiteSpace(host))
            {
                _logger.LogWarning(
                    "Email send failed: Email:SmtpHost is not configured. Password reset OTP for {Email} was not sent.",
                    toEmail);
                return;
            }

            var expirationMinutes = _config.GetValue<int>("PasswordReset:CodeExpirationMinutes", 2);
            var (html, plainText) = SkillSwapEmailTemplates.BuildPasswordResetOtpEmail(
                new SkillSwapEmailTemplates.PasswordResetOtpEmailContent
                {
                    VerificationCode = verificationCode,
                    ExpirationMinutes = expirationMinutes,
                    SupportEmail = GetSupportEmail(),
                });

            _logger.LogInformation(
                "SMTP password reset delivery: host={Host}, port={Port}, to={Email}",
                host,
                _config.GetValue<int>("Email:SmtpPort", 587),
                toEmail);

            try
            {
                await SendEmailCoreAsync(
                    toEmail,
                    SkillSwapEmailTemplates.SubjectPasswordResetOtp,
                    html,
                    plainText);
                _logger.LogInformation("Email send succeeded via SMTP to {Email}", toEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Email send failed via SMTP to {Email}", toEmail);
                throw;
            }
        }

        public async Task SendCompanyMemberWelcomeEmailAsync(
            string toEmail,
            string fullName,
            string companyName,
            string loginEmail,
            string temporaryPassword,
            string loginUrl)
        {
            var publicLoginUrl = EmailUrlHelper.ResolveLoginUrl(_config, loginUrl);
            var displayName = string.IsNullOrWhiteSpace(fullName) ? "there" : fullName.Trim();
            var displayCompany = string.IsNullOrWhiteSpace(companyName) ? "your organization" : companyName.Trim();

            var (html, plainText) = SkillSwapEmailTemplates.BuildWelcomeEmail(
                new SkillSwapEmailTemplates.WelcomeEmailContent
                {
                    RecipientName = displayName,
                    CompanyName = displayCompany,
                    LoginEmail = loginEmail,
                    SignInValue = temporaryPassword,
                    LoginUrl = publicLoginUrl,
                    SupportEmail = GetSupportEmail(),
                });

            await SendRequiredEmailAsync(
                toEmail,
                SkillSwapEmailTemplates.SubjectWelcome,
                html,
                plainText);
        }

        private string GetSupportEmail() =>
            (_config["Email:ReplyToAddress"] ?? _config["Email:FromAddress"] ?? "skillswap742@gmail.com").Trim();

        private async Task SendOptionalEmailAsync(
            string toEmail,
            string subject,
            string htmlBody,
            string plainTextBody)
        {
            try
            {
                await SendEmailCoreAsync(toEmail, subject, htmlBody, plainTextBody);
                _logger.LogInformation("Email sent to {Email} with subject {Subject}", toEmail, subject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Optional email delivery failed for {Email} ({Subject})", toEmail, subject);
            }
        }

        private async Task SendRequiredEmailAsync(
            string toEmail,
            string subject,
            string htmlBody,
            string plainTextBody)
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
                await SendEmailCoreAsync(toEmail, subject, htmlBody, plainTextBody);
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

        private async Task SendEmailCoreAsync(
            string toEmail,
            string subject,
            string htmlBody,
            string plainTextBody)
        {
            var host = _config["Email:SmtpHost"];
            if (string.IsNullOrWhiteSpace(host))
                throw new EmailSendException("Email:SmtpHost is not configured.");

            var port = _config.GetValue<int>("Email:SmtpPort", 587);
            var useSsl = _config.GetValue<bool>("Email:UseSsl", true);
            var fromAddress = (_config["Email:FromAddress"] ?? "skillswap742@gmail.com").Trim();
            var fromName = (_config["Email:FromName"] ?? "SkillSwap Support").Trim();
            var replyToAddress = (_config["Email:ReplyToAddress"] ?? fromAddress).Trim();
            var replyToName = (_config["Email:ReplyToName"] ?? fromName).Trim();
            var username = _config["Email:Username"]?.Trim();
            var password = _config["Email:Password"];

            if (!string.IsNullOrWhiteSpace(username)
                && !string.Equals(username, fromAddress, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning(
                    "Email:FromAddress ({From}) does not match Email:Username ({User}). Align them for SPF/DKIM alignment and fewer spam filters.",
                    fromAddress,
                    username);
            }

            var message = BuildMimeMessage(
                toEmail,
                subject,
                htmlBody,
                plainTextBody,
                fromName,
                fromAddress,
                replyToName,
                replyToAddress);

            using var client = new SmtpClient();
            _logger.LogDebug("SMTP connecting to {Host}:{Port}", host, port);
            await client.ConnectAsync(host, port, useSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto);
            if (!string.IsNullOrWhiteSpace(username))
            {
                _logger.LogDebug("SMTP authenticating as {Username}", username);
                await client.AuthenticateAsync(username, password);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            _logger.LogDebug("SMTP disconnected after send to {Email}", toEmail);
        }

        private static MimeMessage BuildMimeMessage(
            string toEmail,
            string subject,
            string htmlBody,
            string plainTextBody,
            string fromName,
            string fromAddress,
            string replyToName,
            string replyToAddress)
        {
            var fromMailbox = new MailboxAddress(fromName, fromAddress);
            var replyMailbox = new MailboxAddress(replyToName, replyToAddress);
            var messageDomain = fromAddress.Contains('@', StringComparison.Ordinal)
                ? fromAddress.Split('@')[1]
                : "skillswap.app";

            var message = new MimeMessage
            {
                Date = DateTimeOffset.UtcNow,
                Subject = subject,
                MessageId = MimeUtils.GenerateMessageId(messageDomain),
            };

            message.From.Add(fromMailbox);
            message.Sender = fromMailbox;
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.ReplyTo.Add(replyMailbox);

            message.Headers.Add(HeaderId.Organization, "SkillSwap");
            message.Headers.Add("Auto-Submitted", "auto-generated");
            message.Headers.Add("X-Auto-Response-Suppress", "OOF, AutoReply");

            var bodyBuilder = new BodyBuilder
            {
                TextBody = plainTextBody,
                HtmlBody = htmlBody,
            };
            message.Body = bodyBuilder.ToMessageBody();

            return message;
        }
    }
}
