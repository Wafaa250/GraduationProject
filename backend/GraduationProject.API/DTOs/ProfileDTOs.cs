namespace GraduationProject.API.DTOs
{
    // ── GET /api/me ───────────────────────────────────────────────────────────
    public class StudentProfileResponseDto
    {
        public int UserId { get; set; }
        public int ProfileId { get; set; }
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string Role { get; set; } = "student";

        // Academic Info
        public string? University { get; set; }
        public string? Faculty { get; set; }
        public string? Major { get; set; }
        public string? AcademicYear { get; set; }
        public string? StudentId { get; set; }
        public decimal? Gpa { get; set; }

        // Profile Info
        public string? Bio { get; set; }
        public string? Availability { get; set; }
        public string? LookingFor { get; set; }
        public string? Github { get; set; }
        public string? Linkedin { get; set; }
        public string? Portfolio { get; set; }
        public string? ProfilePictureBase64 { get; set; }

        // Skills & extras
        public List<string> GeneralSkills { get; set; } = new();
        public List<string> MajorSkills { get; set; } = new();
        public List<string> Languages { get; set; } = new();
        public List<string> Tools { get; set; } = new();

        // حقول الـ Step 4 الجديدة
        public List<string> Roles { get; set; } = new();
        public List<string> TechnicalSkills { get; set; } = new();

        public NotificationPreferencesDto NotificationPreferences { get; set; } = new();
        public List<string> AiProjectInterests { get; set; } = new();
    }

    public class NotificationPreferencesDto
    {
        public bool TeamInvitations { get; set; } = true;
        public bool NewMessages { get; set; } = true;
        public bool SupervisorUpdates { get; set; } = true;
        public bool ProjectUpdates { get; set; } = true;
        public bool CourseAnnouncements { get; set; } = true;
    }

    public class UpdateStudentSettingsDto
    {
        public NotificationPreferencesDto? NotificationPreferences { get; set; }
        public List<string>? AiProjectInterests { get; set; }
    }

    // ── PUT /api/profile ──────────────────────────────────────────────────────
    public class UpdateProfileDto
    {
        public string? FullName { get; set; }
        public string? Bio { get; set; }
        public string? Availability { get; set; }
        public string? LookingFor { get; set; }
        public string? Github { get; set; }
        public string? Linkedin { get; set; }
        public string? Portfolio { get; set; }
        public string? ProfilePictureBase64 { get; set; }
        public List<string>? Languages { get; set; }
        public List<string>? Tools { get; set; }
        public List<string>? GeneralSkills { get; set; }
        public List<string>? MajorSkills { get; set; }

        // حقول الـ Step 4 الجديدة
        public List<string>? Roles { get; set; }
        public List<string>? TechnicalSkills { get; set; }
    }

    public class UpdateDoctorProfileDto
    {
        public string? FullName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Department { get; set; }
        public string? Faculty { get; set; }
        public string? Specialization { get; set; }
        public string? University { get; set; }
        public string? AcademicRank { get; set; }

        public int? YearsOfExperience { get; set; }
        public string? Linkedin { get; set; }
        public string? OfficeHours { get; set; }

        public string? Bio { get; set; }
        public string? ProfilePictureBase64 { get; set; }

        public List<string>? TechnicalSkills { get; set; }
        public List<string>? ResearchSkills { get; set; }
        public List<string>? ResearchInterests { get; set; }
        public List<string>? PreferredProjectAreas { get; set; }
    }

    public class DoctorNotificationPreferencesDto
    {
        public bool NewMessages { get; set; } = true;
        public bool SupervisionRequests { get; set; } = true;
        public bool ProjectRequests { get; set; } = true;
        public bool CourseProjectUpdates { get; set; } = true;
        public bool TeamFormationUpdates { get; set; } = true;
    }

    public class DoctorSupervisionPreferencesDto
    {
        public int SupervisionCapacity { get; set; } = 5;
        public bool AvailableForSupervision { get; set; } = true;
    }

    public class UpdateDoctorSettingsDto
    {
        public DoctorNotificationPreferencesDto? NotificationPreferences { get; set; }
        public DoctorSupervisionPreferencesDto? SupervisionPreferences { get; set; }
    }
}
