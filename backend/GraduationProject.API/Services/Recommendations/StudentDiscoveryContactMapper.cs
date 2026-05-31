using GraduationProject.API.Models;

namespace GraduationProject.API.Services.Recommendations
{
    internal static class StudentDiscoveryContactMapper
    {
        public static (string? Email, string? Linkedin, string? Github, string? Portfolio) Map(StudentProfile student)
        {
            var email = student.User?.Email;
            if (string.IsNullOrWhiteSpace(email)) email = null;

            return (
                email,
                NullIfWhiteSpace(student.Linkedin),
                NullIfWhiteSpace(student.Github),
                NullIfWhiteSpace(student.Portfolio));
        }

        private static string? NullIfWhiteSpace(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
