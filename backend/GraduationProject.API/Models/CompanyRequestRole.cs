using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("company_request_roles")]
    public class CompanyRequestRole
    {
        [Column("id")] public int Id { get; set; }
        [Column("company_request_id")] public int CompanyRequestId { get; set; }

        /// <summary>Stable client id from wizard (e.g. role-1739…) for draft round-trips.</summary>
        [Column("client_role_key")] public string? ClientRoleKey { get; set; }

        [Column("sort_order")] public int SortOrder { get; set; }
        [Column("role_name")] public string RoleName { get; set; } = string.Empty;
        [Column("notes")] public string? Notes { get; set; }

        public CompanyRequest CompanyRequest { get; set; } = null!;
        public ICollection<CompanyRequestSkill> Skills { get; set; } = new List<CompanyRequestSkill>();
    }
}
