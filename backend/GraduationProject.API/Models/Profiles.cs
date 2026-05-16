using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace GraduationProject.API.Models
{
    // ===========================
    // STUDENT PROFILE
    // ===========================
    [Table("student_profiles")]
    public class StudentProfile
    {
        [Column("id")]            public int Id { get; set; }
        [Column("user_id")]       public int UserId { get; set; }
        [Column("major")]         public string? Major { get; set; }
        [Column("bio")]           public string? Bio { get; set; }
        [Column("student_id")]    public string? StudentId { get; set; }
        [Column("university")]    public string? University { get; set; }
        [Column("faculty")]       public string? Faculty { get; set; }
        [Column("academic_year")] public string? AcademicYear { get; set; }
        [Column("gpa")]           public decimal? Gpa { get; set; }

        // ── حقول الـ profile ─────────────────────────────────────────────────
        [Column("availability")]           public string? Availability { get; set; }
        [Column("looking_for")]            public string? LookingFor { get; set; }
        [Column("github")]                 public string? Github { get; set; }
        [Column("linkedin")]               public string? Linkedin { get; set; }
        [Column("portfolio")]              public string? Portfolio { get; set; }
        [Column("profile_picture_base64")] public string? ProfilePictureBase64 { get; set; }

        [Column("languages")]         public string? Languages { get; set; }         // JSON array as string
        [Column("tools")]             public string? Tools { get; set; }              // JSON array as string
        [Column("roles")]             public string? Roles { get; set; }              // JSON array: ["Frontend Developer", ...]
        [Column("technical_skills")]  public string? TechnicalSkills { get; set; }   // JSON array: ["Web Development", ...]

        public User User { get; set; } = null!;
        public ICollection<StudentSkill> StudentSkills { get; set; } = new List<StudentSkill>();
        public ICollection<OrganizationFollow> OrganizationFollows { get; set; } = new List<OrganizationFollow>();
    }

    // ===========================
    // DOCTOR PROFILE
    // ===========================
    [Table("doctor_profiles")]
    public class DoctorProfile
    {
        [Column("id")]                    public int Id { get; set; }
        [Column("user_id")]               public int UserId { get; set; }
        [Column("specialization")]        public string? Specialization { get; set; }
        [Column("supervision_capacity")]  public int SupervisionCapacity { get; set; } = 0;
        [Column("bio")]                   public string? Bio { get; set; }

        [Column("university")]             public string? University { get; set; }
        [Column("faculty")]                public string? Faculty { get; set; }
        [Column("department")]             public string Department { get; set; } = string.Empty;
        [Column("profile_picture_base64")] public string? ProfilePictureBase64 { get; set; }

       
        [Column("years_of_experience")]
        public int? YearsOfExperience { get; set; }

        [Column("linkedin")]
        public string? Linkedin { get; set; }

        [Column("office_hours")]
        public string? OfficeHours { get; set; }

        [Column("technical_skills")]
        public string? TechnicalSkills { get; set; }

        [Column("research_skills")]
        public string? ResearchSkills { get; set; }

        public User User { get; set; } = null!;
    }

    // ===========================
    // COMPANY PROFILE
    // ===========================
    [Table("company_profiles")]
    public class CompanyProfile
    {
        [Column("id")]           public int Id { get; set; }
        [Column("user_id")]      public int UserId { get; set; }
        [Column("company_name")] public string CompanyName { get; set; } = string.Empty;
        [Column("industry")]     public string? Industry { get; set; }
        [Column("description")]  public string? Description { get; set; }

        public User User { get; set; } = null!;
    }

    // ===========================
    // STUDENT ASSOCIATION PROFILE
    // ===========================
    [Table("student_association_profiles")]
    public class StudentAssociationProfile
    {
        [Column("id")]                public int Id { get; set; }
        [Column("user_id")]           public int UserId { get; set; }
        [Column("association_name")]  public string AssociationName { get; set; } = string.Empty;
        [Column("username")]          public string Username { get; set; } = string.Empty;
        [Column("email")]              public string Email { get; set; } = string.Empty;
        [Column("description")]       public string? Description { get; set; }
        [Column("faculty")]           public string? Faculty { get; set; }
        [Column("category")]          public string? Category { get; set; }
        [Column("logo_url")]          public string? LogoUrl { get; set; }
        [Column("instagram_url")]     public string? InstagramUrl { get; set; }
        [Column("facebook_url")]      public string? FacebookUrl { get; set; }
        [Column("linkedin_url")]      public string? LinkedInUrl { get; set; }
        [Column("is_verified")]       public bool IsVerified { get; set; }
        [Column("created_at")]        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
        public ICollection<StudentOrganizationEvent> Events { get; set; } = new List<StudentOrganizationEvent>();
        public ICollection<OrganizationFollow> Followers { get; set; } = new List<OrganizationFollow>();
        public ICollection<StudentOrganizationTeamMember> TeamMembers { get; set; } = new List<StudentOrganizationTeamMember>();
        public ICollection<StudentOrganizationRecruitmentCampaign> RecruitmentCampaigns { get; set; } =
            new List<StudentOrganizationRecruitmentCampaign>();
    }

    // ===========================
    // SKILL
    // ===========================
    [Table("skills")]
    public class Skill
    {
        [Column("id")]       public int Id { get; set; }
        [Column("name")]     public string Name { get; set; } = string.Empty;
        [Column("category")] public string? Category { get; set; }

        public ICollection<StudentSkill> StudentSkills { get; set; } = new List<StudentSkill>();
    }

    // ===========================
    // STUDENT SKILL
    // ===========================
    [Table("student_skills")]
    public class StudentSkill
    {
        [Column("id")]         public int Id { get; set; }
        [Column("student_id")] public int StudentId { get; set; }
        [Column("skill_id")]   public int SkillId { get; set; }
        [Column("level")]      public int Level { get; set; } = 1;

        public StudentProfile Student { get; set; } = null!;
        public Skill Skill { get; set; } = null!;
    }
}
