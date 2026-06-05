using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("student_organization_event_registrations")]
    public class StudentOrganizationEventRegistration
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("event_id")]
        public int EventId { get; set; }

        [Column("student_profile_id")]
        public int StudentProfileId { get; set; }

        [Column("organization_profile_id")]
        public int OrganizationProfileId { get; set; }

        [Column("submitted_at")]
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        public StudentOrganizationEvent Event { get; set; } = null!;
        public StudentProfile StudentProfile { get; set; } = null!;
        public StudentAssociationProfile OrganizationProfile { get; set; } = null!;
        public ICollection<StudentOrganizationEventRegistrationAnswer> Answers { get; set; } =
            new List<StudentOrganizationEventRegistrationAnswer>();
    }

    [Table("student_organization_event_registration_answers")]
    public class StudentOrganizationEventRegistrationAnswer
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("registration_id")]
        public int RegistrationId { get; set; }

        [Column("field_id")]
        public int FieldId { get; set; }

        /// <summary>Plain text or JSON array string for multi-select answers.</summary>
        [Column("answer_value")]
        public string AnswerValue { get; set; } = string.Empty;

        public StudentOrganizationEventRegistration Registration { get; set; } = null!;
        public StudentOrganizationEventRegistrationField Field { get; set; } = null!;
    }
}
