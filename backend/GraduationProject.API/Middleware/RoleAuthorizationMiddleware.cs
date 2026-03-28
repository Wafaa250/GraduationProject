using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace GraduationProject.API.Middleware
{
    /// <summary>
    /// بدل ما يرجع 403 فارغ، يرجع رسالة واضحة
    /// </summary>
    public class RoleAuthorizationMiddleware
    {
        private readonly RequestDelegate _next;

        public RoleAuthorizationMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            await _next(context);

            // 401 = مش logged in
            if (context.Response.StatusCode == (int)HttpStatusCode.Unauthorized
                && !context.Response.HasStarted)
            {
                context.Response.ContentType = "application/json";
                var response = new { message = "You must be logged in to access this resource." };
                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            }

            // 403 = logged in بس الـ role مش مسموح
            if (context.Response.StatusCode == (int)HttpStatusCode.Forbidden
                && !context.Response.HasStarted)
            {
                context.Response.ContentType = "application/json";
                var response = new { message = "You do not have permission to access this resource." };
                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            }
        }
    }
}
