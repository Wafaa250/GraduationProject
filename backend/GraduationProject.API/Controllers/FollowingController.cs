using System.Linq;
using System.Threading.Tasks;
using GraduationProject.API.Data;
using GraduationProject.API.DTOs;
using GraduationProject.API.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Controllers
{
    [ApiController]
    [Route("api/following")]
    [Authorize(Roles = "student")]
    public class FollowingController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public FollowingController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetFollowing()
        {
            var userId = AuthorizationHelper.GetUserId(User);
            if (userId <= 0)
                return Ok(new FollowingListResponseDto());

            var studentProfileId = await _db.StudentProfiles
                .AsNoTracking()
                .Where(s => s.UserId == userId)
                .Select(s => (int?)s.Id)
                .FirstOrDefaultAsync();

            if (!studentProfileId.HasValue)
                return Ok(new FollowingListResponseDto());

            var companies = await _db.CompanyFollows
                .AsNoTracking()
                .Where(f => f.StudentProfileId == studentProfileId.Value)
                .Join(
                    _db.CompanyProfiles.AsNoTracking(),
                    f => f.CompanyProfileId,
                    c => c.Id,
                    (_, c) => c)
                .OrderBy(c => c.CompanyName)
                .Select(c => new FollowingCompanyDto
                {
                    Id = c.Id,
                    Name = string.IsNullOrWhiteSpace(c.CompanyName) ? "Company" : c.CompanyName.Trim(),
                    LogoUrl = null,
                    Industry = c.Industry,
                })
                .ToListAsync();

            var associations = await _db.OrganizationFollows
                .AsNoTracking()
                .Where(f => f.StudentProfileId == studentProfileId.Value)
                .Join(
                    _db.StudentAssociationProfiles.AsNoTracking(),
                    f => f.OrganizationProfileId,
                    p => p.Id,
                    (_, p) => new FollowingAssociationDto
                    {
                        Id = p.Id,
                        Name = p.AssociationName ?? "Organization",
                        LogoUrl = p.LogoUrl,
                        Category = p.Category,
                    })
                .OrderBy(x => x.Name)
                .ToListAsync();

            return Ok(new FollowingListResponseDto
            {
                Companies = companies,
                Associations = associations,
            });
        }
    }
}
