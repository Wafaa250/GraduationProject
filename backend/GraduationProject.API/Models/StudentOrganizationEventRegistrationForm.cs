using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("student_organization_event_registration_forms")]
    public class StudentOrganizationEventRegistrationForm
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("event_id")]
        public int EventId { get; set; }

        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        public StudentOrganizationEvent Event { get; set; } = null!;
        public ICollection<StudentOrganizationEventRegistrationField> Fields { get; set; } =
            new List<StudentOrganizationEventRegistrationField>();
    }
}
