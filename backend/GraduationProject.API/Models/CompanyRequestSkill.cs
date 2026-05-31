using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("company_request_skills")]
    public class CompanyRequestSkill
    {
        [Column("id")] public int Id { get; set; }
        [Column("company_request_role_id")] public int CompanyRequestRoleId { get; set; }

        [Column("sort_order")] public int SortOrder { get; set; }
        [Column("skill_name")] public string SkillName { get; set; } = string.Empty;

        public CompanyRequestRole Role { get; set; } = null!;
    }
}
