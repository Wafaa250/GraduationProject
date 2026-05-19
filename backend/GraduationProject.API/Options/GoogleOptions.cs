namespace GraduationProject.API.Options
{
    /// <summary>
    /// Google OAuth client used to validate ID tokens from the frontend (GIS).
    /// Set via <c>Google__ClientId</c> environment variable or user secrets — not committed.
    /// </summary>
    public class GoogleOptions
    {
        public const string SectionName = "Google";

        public string ClientId { get; set; } = string.Empty;

        public bool IsConfigured => !string.IsNullOrWhiteSpace(ClientId);
    }
}
