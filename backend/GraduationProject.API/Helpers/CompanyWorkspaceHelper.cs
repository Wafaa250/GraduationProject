using System.Threading.Tasks;
using GraduationProject.API.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GraduationProject.API.Helpers
{
    public static class CompanyWorkspaceHelper
    {
        public static Task<CompanyWorkspaceResolveResult> ResolveAsync(
            ICompanyWorkspaceService workspace,
            ClaimsPrincipal user,
            HttpContext? httpContext = null)
        {
            var userId = AuthorizationHelper.GetUserId(user);
            var endpoint = httpContext?.Request.Method != null && httpContext.Request.Path.HasValue
                ? $"{httpContext.Request.Method} {httpContext.Request.Path}"
                : null;
            return workspace.ResolveWorkspaceAsync(userId, endpoint);
        }

        public static IActionResult NotFound(CompanyWorkspaceResolveResult result) =>
            new NotFoundObjectResult(new
            {
                message = result.UserFacingMessage,
                code = result.FailureCode,
            });

        public static async Task<(CompanyWorkspaceContext? Context, IActionResult? Error)> TryResolveAsync(
            ICompanyWorkspaceService workspace,
            ClaimsPrincipal user,
            HttpContext? httpContext = null)
        {
            var resolved = await ResolveAsync(workspace, user, httpContext);
            if (!resolved.Success)
                return (null, NotFound(resolved));

            return (resolved.Context, null);
        }

        /// <summary>Legacy helper — prefer <see cref="TryResolveAsync"/> for actionable errors.</summary>
        public static async Task<CompanyWorkspaceContext?> RequireWorkspaceAsync(
            ICompanyWorkspaceService workspace,
            ClaimsPrincipal user)
        {
            var resolved = await ResolveAsync(workspace, user);
            return resolved.Context;
        }
    }
}
