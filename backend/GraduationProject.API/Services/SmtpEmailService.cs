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

            var port = _config.GetValue<int>("Email:SmtpPort", 587);
            var useSsl = _config.GetValue<bool>("Email:UseSsl", true);
            var fromAddress = _config["Email:FromAddress"] ?? "noreply@skillswap.local";
            var fromName = _config["Email:FromName"] ?? "SkillSwap";
            var username = _config["Email:Username"];
            var password = _config["Email:Password"];

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromAddress));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = "Reset your SkillSwap password";

            var body = $"""
                <p>Hello,</p>
                <p>We received a request to reset your SkillSwap password.</p>
                <p><a href="{resetUrl}">Reset your password</a></p>
                <p>This link expires in {_config.GetValue<int>("PasswordReset:TokenExpirationMinutes", 60)} minutes.</p>
                <p>If you did not request this, you can ignore this email.</p>
                <p>— SkillSwap</p>
                """;

            message.Body = new TextPart("html") { Text = body };

            using var client = new SmtpClient();
            await client.ConnectAsync(host, port, useSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto);
            if (!string.IsNullOrWhiteSpace(username))
                await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Password reset email sent to {Email}", toEmail);
        }
    }
}
