using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Services
{
    public class CompanyMemberService : ICompanyMemberService
    {
        private readonly ApplicationDbContext _db;
        private readonly ICompanyWorkspaceService _workspace;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;
        private readonly ILogger<CompanyMemberService> _logger;
        private readonly ICompanyActivityService _activity;
        private readonly IGraduationProjectNotificationService _notifications;

        public CompanyMemberService(
            ApplicationDbContext db,
            ICompanyWorkspaceService workspace,
            IEmailService emailService,
            IConfiguration config,
            ILogger<CompanyMemberService> logger,
            ICompanyActivityService activity,
            IGraduationProjectNotificationService notifications)
        {
            _db = db;
            _workspace = workspace;
            _emailService = emailService;
            _config = config;
            _logger = logger;
            _activity = activity;
            _notifications = notifications;
        }

        public async Task<IReadOnlyList<CompanyMemberListItemDto>> ListAsync(int actingUserId)
        {
            var context = await RequireOwnerContextAsync(actingUserId);
            if (context == null)
                return Array.Empty<CompanyMemberListItemDto>();

            var rows = await _db.CompanyMembers
                .AsNoTracking()
                .Include(m => m.User)
                .Where(m => m.CompanyProfileId == context.Profile.Id)
                .OrderByDescending(m => m.Role == CompanyMemberRoles.Owner)
                .ThenBy(m => m.User.Name)
                .ToListAsync();

            return rows.Select(MapToDto).ToList();
        }

        public async Task<(CompanyMemberListItemDto? result, string? error, bool credentialsEmailSent)> AddAsync(
            int actingUserId,
            AddCompanyMemberDto dto)
        {
            var context = await RequireOwnerContextAsync(actingUserId);
            if (context == null)
                return (null, "Only workspace owners can manage members.", false);

            var role = (dto.Role ?? string.Empty).Trim().ToLowerInvariant();
            if (!CompanyMemberRoles.All.Contains(role))
                return (null, "Invalid role. Use owner or member.", false);

            var email = dto.Email.Trim().ToLowerInvariant();
            var fullName = dto.FullName.Trim();
            if (string.IsNullOrWhiteSpace(fullName))
                return (null, "Full name is required.", false);

            var existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
            string? temporaryPassword = null;
            var isNewUser = existingUser == null;

            if (existingUser != null)
            {
                if (!string.Equals(existingUser.Role, "company", StringComparison.OrdinalIgnoreCase))
                    return (null, "This email belongs to a non-company account.", false);

                var existingMembership = await _db.CompanyMembers
                    .FirstOrDefaultAsync(m => m.UserId == existingUser.Id);

                if (existingMembership != null)
                {
                    if (existingMembership.CompanyProfileId == context.Profile.Id)
                        return (null, "This user is already a workspace member.", false);

                    return (null, "This user already belongs to another company workspace.", false);
                }

                var ownsSeparateWorkspace = await _db.CompanyProfiles
                    .AnyAsync(c => c.UserId == existingUser.Id);

                if (ownsSeparateWorkspace)
                    return (null, "This user already owns a separate company workspace.", false);

                existingUser.Name = fullName;
            }
            else
            {
                temporaryPassword = GenerateTemporaryPassword();
                existingUser = new User
                {
                    Name = fullName,
                    Email = email,
                    Password = BCrypt.Net.BCrypt.HashPassword(temporaryPassword),
                    Role = "company",
                    MustChangePassword = true,
                    CreatedAt = DateTime.UtcNow,
                };
                _db.Users.Add(existingUser);
            }

            await using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                var member = new CompanyMember
                {
                    User = existingUser,
                    CompanyProfileId = context.Profile.Id,
                    Role = role,
                    CreatedAt = DateTime.UtcNow,
                };
                _db.CompanyMembers.Add(member);
                await _db.SaveChangesAsync();

                if (isNewUser && temporaryPassword != null)
                {
                    var loginUrl = (_config["App:FrontendLoginUrl"] ?? "http://localhost:5173/login").Trim();
                    try
                    {
                        await _emailService.SendCompanyMemberWelcomeEmailAsync(
                            existingUser.Email,
                            fullName,
                            context.Profile.CompanyName,
                            existingUser.Email,
                            temporaryPassword,
                            loginUrl);
                    }
                    catch (EmailSendException ex)
                    {
                        _logger.LogError(
                            ex,
                            "Failed to send welcome email to {Email} for company {CompanyProfileId}",
                            existingUser.Email,
                            context.Profile.Id);
                        await transaction.RollbackAsync();
                        return (
                            null,
                            "Member account was not created because login credentials could not be emailed. Please verify email settings and try again.",
                            false);
                    }
                }

                await transaction.CommitAsync();
                await _db.Entry(member).Reference(m => m.User).LoadAsync();

                var actor = await _db.Users.AsNoTracking()
                    .Where(u => u.Id == actingUserId)
                    .Select(u => u.Name)
                    .FirstOrDefaultAsync() ?? "A team member";

                await _activity.LogAsync(
                    context.Profile.Id,
                    actingUserId,
                    CompanyActivityTypes.MemberAdded,
                    $"{actor} added a workspace member");

                await _notifications.NotifyCompanyMemberAddedAsync(
                    context.Profile.Id,
                    fullName,
                    actingUserId);

                return (MapToDto(member), null, isNewUser);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to add company member for {Email}", email);
                throw;
            }
        }

        public async Task<(bool success, string? error)> RemoveAsync(int actingUserId, int memberId)
        {
            var context = await RequireOwnerContextAsync(actingUserId);
            if (context == null)
                return (false, "Only workspace owners can manage members.");

            var member = await _db.CompanyMembers
                .Include(m => m.User)
                .FirstOrDefaultAsync(m =>
                    m.Id == memberId &&
                    m.CompanyProfileId == context.Profile.Id);

            if (member == null)
                return (false, "Member not found.");

            if (member.UserId == actingUserId)
                return (false, "You cannot remove yourself from the workspace.");

            if (member.Role == CompanyMemberRoles.Owner)
            {
                var ownerCount = await _db.CompanyMembers.CountAsync(m =>
                    m.CompanyProfileId == context.Profile.Id &&
                    m.Role == CompanyMemberRoles.Owner);

                if (ownerCount <= 1)
                    return (false, "At least one owner must remain in the workspace.");
            }

            var memberName = member.User?.Name ?? "A member";

            _db.CompanyMembers.Remove(member);
            await _db.SaveChangesAsync();

            await _notifications.NotifyCompanyMemberRemovedAsync(
                context.Profile.Id,
                memberName,
                actingUserId);

            return (true, null);
        }

        private async Task<CompanyWorkspaceContext?> RequireOwnerContextAsync(int actingUserId)
        {
            var context = await _workspace.GetWorkspaceAsync(actingUserId);
            if (context == null || !context.IsOwner)
                return null;

            return context;
        }

        private static CompanyMemberListItemDto MapToDto(CompanyMember member) =>
            new()
            {
                Id = member.Id,
                UserId = member.UserId,
                Name = member.User?.Name ?? "Member",
                Email = member.User?.Email ?? string.Empty,
                Role = member.Role,
                CreatedAt = member.CreatedAt,
            };

        private static string GenerateTemporaryPassword()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
            var bytes = RandomNumberGenerator.GetBytes(12);
            var passwordChars = new char[12];
            for (var i = 0; i < passwordChars.Length; i++)
                passwordChars[i] = chars[bytes[i] % chars.Length];

            return new string(passwordChars);
        }
    }
}
