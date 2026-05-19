using System.Threading;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using GraduationProject.API.Options;

namespace GraduationProject.API.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly SmtpOptions _smtp;
        private readonly ILogger<SmtpEmailService> _logger;

        public SmtpEmailService(IOptions<SmtpOptions> smtp, ILogger<SmtpEmailService> logger)
        {
            _smtp = smtp.Value;
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(
            string toEmail,
            string recipientName,
            string resetLink,
            CancellationToken cancellationToken = default)
        {
            if (!_smtp.IsConfigured)
            {
                _logger.LogWarning(
                    "SMTP is not configured. Password reset email was not sent to {Email}. Reset link: {ResetLink}",
                    toEmail,
                    resetLink);
                return;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromEmail));
            message.To.Add(MailboxAddress.Parse(toEmail));
            message.Subject = "Reset your SkillSwap password";

            var body = $"""
                <p>Hi {System.Net.WebUtility.HtmlEncode(recipientName)},</p>
                <p>We received a request to reset your SkillSwap password. Click the link below to choose a new password. This link expires in one hour and can only be used once.</p>
                <p><a href="{resetLink}">Reset your password</a></p>
                <p>If you did not request this, you can safely ignore this email.</p>
                <p>— SkillSwap</p>
                """;

            message.Body = new TextPart("html") { Text = body };

            using var client = new SmtpClient();
            await client.ConnectAsync(_smtp.Host, _smtp.Port, _smtp.EnableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto, cancellationToken);

            if (!string.IsNullOrWhiteSpace(_smtp.Username))
                await client.AuthenticateAsync(_smtp.Username, _smtp.Password, cancellationToken);

            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("Password reset email sent to {Email}", toEmail);
        }
    }
}
