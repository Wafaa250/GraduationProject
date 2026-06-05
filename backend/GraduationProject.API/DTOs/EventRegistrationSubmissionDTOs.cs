using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    public class EventRegistrationAnswerInputDto
    {
        [Required]
        public int FieldId { get; set; }

        /// <summary>Single-value answers (text, choice, file URL, etc.).</summary>
        public string? Value { get; set; }

        /// <summary>Checkbox-list selections.</summary>
        public List<string>? Values { get; set; }
    }

    public class SubmitEventRegistrationDto
    {
        [Required]
        [MinLength(1, ErrorMessage = "At least one answer is required.")]
        public List<EventRegistrationAnswerInputDto> Answers { get; set; } = new();
    }

    public class StudentEventRegistrationStatusDto
    {
        public bool HasSubmitted { get; set; }
        public int? RegistrationId { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public int OrganizationId { get; set; }
        public string OrganizationName { get; set; } = string.Empty;
        public int EventId { get; set; }
        public string EventTitle { get; set; } = string.Empty;
    }

    public class EventRegistrationSubmitResponseDto
    {
        public int RegistrationId { get; set; }
        public DateTime SubmittedAt { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class EventRegistrationAnswerResponseDto
    {
        public int FieldId { get; set; }
        public string FieldLabel { get; set; } = string.Empty;
        public string FieldType { get; set; } = string.Empty;
        public string AnswerValue { get; set; } = string.Empty;
        public List<string>? SelectedValues { get; set; }
    }

    public class EventRegistrationListItemDto
    {
        public int Id { get; set; }
        public int StudentProfileId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string? StudentEmail { get; set; }
        public string? StudentMajor { get; set; }
        public DateTime SubmittedAt { get; set; }
        public string PreviewAnswer { get; set; } = string.Empty;
    }

    public class EventRegistrationDetailDto
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public int EventId { get; set; }
        public string EventTitle { get; set; } = string.Empty;
        public int StudentProfileId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string? StudentEmail { get; set; }
        public string? StudentMajor { get; set; }
        public string? StudentAcademicYear { get; set; }
        public DateTime SubmittedAt { get; set; }
        public List<EventRegistrationAnswerResponseDto> Answers { get; set; } = new();
    }
}
