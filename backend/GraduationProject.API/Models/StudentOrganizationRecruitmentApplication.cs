using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    public static class RecruitmentApplicationStatuses
    {
        public const string Pending = "Pending";
        public const string Accepted = "Accepted";
        public const string Rejected = "Rejected";

        public static readonly HashSet<string> All = new(StringComparer.Ordinal)
        {
            Pending, Accepted, Rejected,
        };
    }

    [Table("student_organization_recruitment_applications")]
    public class StudentOrganizationRecruitmentApplication
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("student_profile_id")]
        public int StudentProfileId { get; set; }

        [Column("organization_profile_id")]
        public int OrganizationProfileId { get; set; }

        [Column("campaign_id")]
        public int CampaignId { get; set; }

        [Column("position_id")]
        public int PositionId { get; set; }

        [Column("status")]
        public string Status { get; set; } = RecruitmentApplicationStatuses.Pending;

        [Column("submitted_at")]
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        public StudentProfile StudentProfile { get; set; } = null!;
        public StudentAssociationProfile OrganizationProfile { get; set; } = null!;
        public StudentOrganizationRecruitmentCampaign Campaign { get; set; } = null!;
        public StudentOrganizationRecruitmentPosition Position { get; set; } = null!;
        public ICollection<StudentOrganizationRecruitmentApplicationAnswer> Answers { get; set; } =
            new List<StudentOrganizationRecruitmentApplicationAnswer>();
    }

    [Table("student_organization_recruitment_application_answers")]
    public class StudentOrganizationRecruitmentApplicationAnswer
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("application_id")]
        public int ApplicationId { get; set; }

        [Column("question_id")]
        public int QuestionId { get; set; }

        /// <summary>Plain text or JSON array string for multi-select answers.</summary>
        [Column("answer_value")]
        public string AnswerValue { get; set; } = string.Empty;

        public StudentOrganizationRecruitmentApplication Application { get; set; } = null!;
        public StudentOrganizationRecruitmentQuestion Question { get; set; } = null!;
    }
}
