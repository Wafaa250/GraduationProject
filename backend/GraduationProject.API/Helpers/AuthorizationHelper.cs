using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace GraduationProject.API.Helpers
{
    /// <summary>
    /// Helper يستخدمه كل Controller عشان يجيب معلومات المستخدم من الـ Token
    /// </summary>
    public static class AuthorizationHelper
    {
        // جيب الـ UserId من الـ Token
        public static int GetUserId(ClaimsPrincipal user)
        {
            var claim = user.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out int id) ? id : 0;
        }

        // جيب الـ Role من الـ Token
        public static string GetRole(ClaimsPrincipal user)
        {
            return user.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        }

        // جيب الـ Email من الـ Token
        public static string GetEmail(ClaimsPrincipal user)
        {
            return user.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
        }

        // جيب الـ Name من الـ Token
        public static string GetName(ClaimsPrincipal user)
        {
            return user.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
        }
    }
}
