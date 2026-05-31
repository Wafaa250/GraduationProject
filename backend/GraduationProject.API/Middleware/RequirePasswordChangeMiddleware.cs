using System.Net;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace GraduationProject.API.Middleware
{
    /// <summary>
    /// Blocks authenticated API access until a mandatory password change is completed.
    /// </summary>
    public class RequirePasswordChangeMiddleware
    {
        public const string MustChangePasswordClaim = "must_change_password";
        public const string ErrorCode = "PASSWORD_CHANGE_REQUIRED";

        private static readonly PathString ChangePasswordPath = new("/api/auth/change-password");

        private readonly RequestDelegate _next;

        public RequirePasswordChangeMiddleware(RequestDelegate next) => _next = next;

        public async Task InvokeAsync(HttpContext context)
        {
            if (context.User?.Identity?.IsAuthenticated == true &&
                context.User.HasClaim(MustChangePasswordClaim, "true") &&
                !IsAllowedPath(context.Request.Path))
            {
                context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync(JsonSerializer.Serialize(new
                {
                    message = "You must set a new password before accessing the workspace.",
                    code = ErrorCode,
                }));
                return;
            }

            await _next(context);
        }

        private static bool IsAllowedPath(PathString path) =>
            path.StartsWithSegments(ChangePasswordPath);
    }
}
