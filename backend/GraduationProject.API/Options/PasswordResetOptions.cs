namespace GraduationProject.API.Options
{
    public class PasswordResetOptions
    {
        public const string SectionName = "PasswordReset";

        public int TokenLifetimeMinutes { get; set; } = 60;
    }
}
