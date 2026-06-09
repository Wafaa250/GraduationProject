using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class StudentNotificationPreferencesDto
    {
        public bool TeamInvitations { get; set; } = true;
        public bool NewMessages { get; set; } = true;
        public bool SupervisorUpdates { get; set; } = true;
        public bool ProjectUpdates { get; set; } = true;
        public bool CourseAnnouncements { get; set; } = true;
    }

    public class StudentProfileSettingsDto
    {
        public StudentNotificationPreferencesDto NotificationPreferences { get; set; } = new();
        public List<string> AiProjectInterests { get; set; } = new();
    }

    public class UpdateStudentProfileSettingsDto
    {
        public StudentNotificationPreferencesDto? NotificationPreferences { get; set; }
        public List<string>? AiProjectInterests { get; set; }
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

    public class DoctorProfileSettingsDto
    {
        public DoctorNotificationPreferencesDto NotificationPreferences { get; set; } = new();
        public DoctorSupervisionPreferencesDto SupervisionPreferences { get; set; } = new();
    }

    public class UpdateDoctorProfileSettingsDto
    {
        public DoctorNotificationPreferencesDto? NotificationPreferences { get; set; }
        public DoctorSupervisionPreferencesDto? SupervisionPreferences { get; set; }
    }

    public class CollaborationPreferencesDto
    {
        public string? WorkingStyle { get; set; }
        public string? Teamwork { get; set; }
        public string? Collaboration { get; set; }
    }

    public class OtherLinkDto
    {
        public string Label { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
    }

    public class GraduationProjectDraftDto
    {
        public object? Payload { get; set; }
        public string? UpdatedAt { get; set; }
    }

    public class SaveGraduationProjectDraftDto
    {
        public object Payload { get; set; } = new { };
    }

    public class GraduationProjectAbstractFileDto
    {
        public string FileName { get; set; } = string.Empty;
        public string UploadedAt { get; set; } = string.Empty;
        public string DownloadUrl { get; set; } = string.Empty;
    }

    public class UploadGraduationProjectAbstractFileDto
    {
        public string FileName { get; set; } = string.Empty;
        public string FileBase64 { get; set; } = string.Empty;
    }
}
