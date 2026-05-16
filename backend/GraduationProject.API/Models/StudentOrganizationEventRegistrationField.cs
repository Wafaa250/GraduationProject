using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("student_organization_event_registration_fields")]
    public class StudentOrganizationEventRegistrationField
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("form_id")]
        public int FormId { get; set; }

        [Column("label")]
        public string Label { get; set; } = string.Empty;

        [Column("field_type")]
        public string FieldType { get; set; } = string.Empty;

        [Column("placeholder")]
        public string? Placeholder { get; set; }

        [Column("help_text")]
        public string? HelpText { get; set; }

        [Column("is_required")]
        public bool IsRequired { get; set; }

        /// <summary>JSON array of option strings for choice-based field types; null otherwise.</summary>
        [Column("options")]
        public string? Options { get; set; }

        [Column("display_order")]
        public int DisplayOrder { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public StudentOrganizationEventRegistrationForm Form { get; set; } = null!;
    }
}
