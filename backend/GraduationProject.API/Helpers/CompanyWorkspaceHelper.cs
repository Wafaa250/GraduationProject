using System.Threading.Tasks;
using GraduationProject.API.Helpers;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GraduationProject.API.Helpers
{
    public static class CompanyWorkspaceHelper
    {
        public static async Task<CompanyWorkspaceContext?> RequireWorkspaceAsync(
            ICompanyWorkspaceService workspace,
            ClaimsPrincipal user)
        {
            var userId = AuthorizationHelper.GetUserId(user);
            return await workspace.GetWorkspaceAsync(userId);
        }
    }
}
