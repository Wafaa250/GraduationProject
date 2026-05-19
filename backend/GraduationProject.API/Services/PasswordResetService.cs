using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;
using GraduationProject.API.Options;

namespace GraduationProject.API.Services
{
    public interface IPasswordResetService
    {
        Task<MessageResponseDto> RequestResetAsync(ForgotPasswordDto dto, CancellationToken cancellationToken = default);
        Task<(MessageResponseDto? result, string? error)> ResetPasswordAsync(ResetPasswordDto dto, CancellationToken cancellationToken = default);
    }

    public class PasswordResetService : IPasswordResetService
    {
        private const string GenericSuccessMessage =
            "If an account exists for that email, you will receive password reset instructions shortly.";

        private readonly ApplicationDbContext _db;
        private readonly IEmailService _email;
        private readonly PasswordResetOptions _resetOptions;
        private readonly FrontendOptions _frontend;
        private readonly ILogger<PasswordResetService> _logger;

        public PasswordResetService(
            ApplicationDbContext db,
            IEmailService email,
            IOptions<PasswordResetOptions> resetOptions,
            IOptions<FrontendOptions> frontend,
            ILogger<PasswordResetService> logger)
        {
            _db = db;
            _email = email;
            _resetOptions = resetOptions.Value;
            _frontend = frontend.Value;
            _logger = logger;
        }

        public async Task<MessageResponseDto> RequestResetAsync(ForgotPasswordDto dto, CancellationToken cancellationToken = default)
        {
            var email = dto.Email.ToLower().Trim();
            var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

            if (user != null)
            {
                var rawToken = GenerateSecureToken();
                var tokenHash = HashToken(rawToken);
                var now = DateTime.UtcNow;
                var expiresAt = now.AddMinutes(_resetOptions.TokenLifetimeMinutes);

                var activeTokens = await _db.PasswordResetTokens
                    .Where(t => t.UserId == user.Id && t.UsedAt == null && t.ExpiresAt > now)
                    .ToListAsync(cancellationToken);

                foreach (var existing in activeTokens)
                    existing.UsedAt = now;

                _db.PasswordResetTokens.Add(new PasswordResetToken
                {
                    UserId = user.Id,
                    TokenHash = tokenHash,
                    ExpiresAt = expiresAt,
                    CreatedAt = now,
                });

                await _db.SaveChangesAsync(cancellationToken);

                var baseUrl = _frontend.BaseUrl.TrimEnd('/');
                var resetLink = $"{baseUrl}/reset-password?token={Uri.EscapeDataString(rawToken)}";

                try
                {
                    await _email.SendPasswordResetEmailAsync(user.Email, user.Name, resetLink, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send password reset email to {Email}", user.Email);
                }
            }

            return new MessageResponseDto { Message = GenericSuccessMessage };
        }

        public async Task<(MessageResponseDto? result, string? error)> ResetPasswordAsync(ResetPasswordDto dto, CancellationToken cancellationToken = default)
        {
            if (dto.Password != dto.ConfirmPassword)
                return (null, "Passwords do not match.");

            if (string.IsNullOrWhiteSpace(dto.Token))
                return (null, "Invalid or expired reset link.");

            var tokenHash = HashToken(dto.Token.Trim());
            var now = DateTime.UtcNow;

            var resetToken = await _db.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash, cancellationToken);

            if (resetToken == null || resetToken.IsUsed || resetToken.IsExpired(now))
                return (null, "Invalid or expired reset link.");

            resetToken.User.Password = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            resetToken.UsedAt = now;

            var otherActive = await _db.PasswordResetTokens
                .Where(t => t.UserId == resetToken.UserId && t.Id != resetToken.Id && t.UsedAt == null)
                .ToListAsync(cancellationToken);

            foreach (var other in otherActive)
                other.UsedAt = now;

            await _db.SaveChangesAsync(cancellationToken);

            return (new MessageResponseDto { Message = "Your password has been updated. You can sign in with your new password." }, null);
        }

        private static string GenerateSecureToken()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Base64UrlEncode(bytes);
        }

        private static string HashToken(string rawToken)
        {
            var bytes = Encoding.UTF8.GetBytes(rawToken);
            var hash = SHA256.HashData(bytes);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private static string Base64UrlEncode(byte[] data)
        {
            return Convert.ToBase64String(data)
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }
    }
}
