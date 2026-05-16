using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    public static class EventRegistrationFieldTypes
    {
        public const string ShortText = "ShortText";
        public const string Paragraph = "Paragraph";
        public const string MultipleChoice = "MultipleChoice";
        public const string CheckboxList = "CheckboxList";
        public const string Dropdown = "Dropdown";
        public const string Number = "Number";
        public const string Email = "Email";
        public const string Phone = "Phone";
        public const string Url = "Url";
        public const string Link = "Link";
        public const string Date = "Date";
        public const string YesNo = "YesNo";
        public const string FileUploadPlaceholder = "FileUploadPlaceholder";

        public static readonly HashSet<string> All = new(StringComparer.Ordinal)
        {
            ShortText, Paragraph, MultipleChoice, CheckboxList, Dropdown,
            Number, Email, Phone, Url, Link, Date, YesNo, FileUploadPlaceholder,
        };

        public static bool UsesOptions(string fieldType) =>
            fieldType is MultipleChoice or CheckboxList or Dropdown;
    }

    public class CreateEventRegistrationFormDto
    {
        [Required(ErrorMessage = "Form title is required.")]
        [MaxLength(300)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(4000)]
        public string? Description { get; set; }
    }

    public class UpdateEventRegistrationFormDto
    {
        [MaxLength(300)]
        public string? Title { get; set; }

        [MaxLength(4000)]
        public string? Description { get; set; }
    }

    public class EventRegistrationFormResponseDto
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<EventRegistrationFieldResponseDto> Fields { get; set; } = new();
    }

    public class CreateEventRegistrationFieldDto
    {
        [Required(ErrorMessage = "Field label is required.")]
        [MaxLength(500)]
        public string Label { get; set; } = string.Empty;

        [Required(ErrorMessage = "Field type is required.")]
        [MaxLength(64)]
        public string FieldType { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Placeholder { get; set; }

        [MaxLength(2000)]
        public string? HelpText { get; set; }

        public bool IsRequired { get; set; }

        public List<string>? Options { get; set; }

        public int DisplayOrder { get; set; }
    }

    public class UpdateEventRegistrationFieldDto
    {
        [MaxLength(500)]
        public string? Label { get; set; }

        [MaxLength(64)]
        public string? FieldType { get; set; }

        [MaxLength(500)]
        public string? Placeholder { get; set; }

        [MaxLength(2000)]
        public string? HelpText { get; set; }

        public bool? IsRequired { get; set; }

        public List<string>? Options { get; set; }

        public int? DisplayOrder { get; set; }
    }

    public class EventRegistrationFieldResponseDto
    {
        public int Id { get; set; }
        public int FormId { get; set; }
        public string Label { get; set; } = string.Empty;
        public string FieldType { get; set; } = string.Empty;
        public string? Placeholder { get; set; }
        public string? HelpText { get; set; }
        public bool IsRequired { get; set; }
        public List<string>? Options { get; set; }
        public int DisplayOrder { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
