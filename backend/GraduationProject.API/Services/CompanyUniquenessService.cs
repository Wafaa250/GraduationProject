using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Services
{
    public interface ICompanyUniquenessService
    {
        Task<(bool isAllowed, string? error)> ValidateNewCompanyAsync(
            string companyName,
            string email,
            string? websiteUrl);

        Task<(bool isAllowed, string? error)> ValidateCompanyNameChangeAsync(
            int companyProfileId,
            string companyName);

        Task<(bool isAllowed, string? error)> ValidateWebsiteDomainChangeAsync(
            int companyProfileId,
            string? websiteUrl);
    }

    public class CompanyUniquenessService : ICompanyUniquenessService
    {
        private readonly ApplicationDbContext _db;

        public CompanyUniquenessService(ApplicationDbContext db) => _db = db;

        public async Task<(bool isAllowed, string? error)> ValidateNewCompanyAsync(
            string companyName,
            string email,
            string? websiteUrl)
        {
            var normalizedName = CompanyUniquenessHelper.NormalizeCompanyName(companyName);
            if (string.IsNullOrWhiteSpace(normalizedName))
                return (false, "Company name is required.");

            var nameTaken = await _db.CompanyProfiles
                .AsNoTracking()
                .AnyAsync(c => c.NormalizedCompanyName == normalizedName);

            if (nameTaken)
            {
                return (false,
                    $"A company workspace named \"{companyName.Trim()}\" already exists. " +
                    "Ask your company owner to add you from Company Members instead of creating a new workspace.");
            }

            var emailDomain = CompanyUniquenessHelper.ResolvePrimaryEmailDomain(email);
            if (emailDomain != null)
            {
                var emailDomainTaken = await _db.CompanyProfiles
                    .AsNoTracking()
                    .AnyAsync(c => c.PrimaryEmailDomain == emailDomain);

                if (emailDomainTaken)
                {
                    return (false,
                        $"A company workspace is already registered with the email domain \"{emailDomain}\". " +
                        "Contact your company owner to be added to the existing workspace.");
                }
            }

            var websiteDomain = CompanyUniquenessHelper.ExtractWebsiteDomain(websiteUrl);
            if (websiteDomain != null)
            {
                var websiteDomainTaken = await _db.CompanyProfiles
                    .AsNoTracking()
                    .AnyAsync(c => c.WebsiteDomain == websiteDomain);

                if (websiteDomainTaken)
                {
                    return (false,
                        $"A company workspace is already registered for \"{websiteDomain}\". " +
                        "Contact your company owner to be added to the existing workspace.");
                }
            }

            return (true, null);
        }

        public async Task<(bool isAllowed, string? error)> ValidateCompanyNameChangeAsync(
            int companyProfileId,
            string companyName)
        {
            var normalizedName = CompanyUniquenessHelper.NormalizeCompanyName(companyName);
            if (string.IsNullOrWhiteSpace(normalizedName))
                return (false, "Company name is required.");

            var current = await _db.CompanyProfiles
                .AsNoTracking()
                .Where(c => c.Id == companyProfileId)
                .Select(c => new { c.CompanyName })
                .FirstOrDefaultAsync();

            if (current != null)
            {
                var currentDisplayNormalized =
                    CompanyUniquenessHelper.NormalizeCompanyName(current.CompanyName);
                if (currentDisplayNormalized == normalizedName)
                    return (true, null);
            }

            var otherProfiles = await _db.CompanyProfiles
                .AsNoTracking()
                .Where(c => c.Id != companyProfileId)
                .Select(c => new { c.NormalizedCompanyName, c.CompanyName })
                .ToListAsync();

            var nameTaken = otherProfiles.Any(c =>
                c.NormalizedCompanyName == normalizedName
                || CompanyUniquenessHelper.NormalizeCompanyName(c.CompanyName) == normalizedName);

            if (nameTaken)
            {
                return (false,
                    $"Another company workspace is already named \"{companyName.Trim()}\". " +
                    "Choose a distinct name for your organization.");
            }

            return (true, null);
        }

        public async Task<(bool isAllowed, string? error)> ValidateWebsiteDomainChangeAsync(
            int companyProfileId,
            string? websiteUrl)
        {
            var websiteDomain = CompanyUniquenessHelper.ExtractWebsiteDomain(websiteUrl);
            if (websiteDomain == null)
                return (true, null);

            var current = await _db.CompanyProfiles
                .AsNoTracking()
                .Where(c => c.Id == companyProfileId)
                .Select(c => new { c.WebsiteUrl, c.WebsiteDomain })
                .FirstOrDefaultAsync();

            if (current != null)
            {
                var currentDomain = current.WebsiteDomain
                    ?? CompanyUniquenessHelper.ExtractWebsiteDomain(current.WebsiteUrl);
                if (currentDomain == websiteDomain)
                    return (true, null);
            }

            var taken = await _db.CompanyProfiles
                .AsNoTracking()
                .AnyAsync(c =>
                    c.Id != companyProfileId &&
                    c.WebsiteDomain == websiteDomain);

            if (taken)
            {
                return (false,
                    $"Another company workspace is already registered for \"{websiteDomain}\".");
            }

            return (true, null);
        }
    }
}
