using Microsoft.Extensions.Configuration;

namespace GraduationProject.API.Services
{
    internal static class EmailConfiguration
    {
        public static bool IsEnabled(IConfiguration configuration)
        {
            var raw = configuration["Email:Enabled"];
            if (string.IsNullOrWhiteSpace(raw))
                return false;

            return bool.TryParse(raw, out var enabled) && enabled;
        }
    }
}
