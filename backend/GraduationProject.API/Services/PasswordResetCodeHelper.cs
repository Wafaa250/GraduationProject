using System;
using System.Security.Cryptography;
using System.Text;

namespace GraduationProject.API.Services
{
    public static class PasswordResetCodeHelper
    {
        public static string GenerateCode()
        {
            var value = RandomNumberGenerator.GetInt32(0, 1_000_000);
            return value.ToString("D6");
        }

        public static string HashCode(string code)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(code.Trim()));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }
    }
}
