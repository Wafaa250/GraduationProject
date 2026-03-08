/*using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
	[Table("users")]
	public class User
	{
		[Key]
		[Column("id")]
		public int Id { get; set; }

		[Required]
		[Column("name")]
		public string Name { get; set; }

		[Required]
		[Column("email")]
		public string Email { get; set; }

		[Required]
		[Column("password")]
		public string Password { get; set; }

		[Required]
		[Column("role")]
		public string Role { get; set; }

		[Column("created_at")]
		public DateTime CreatedAt { get; set; }
	}
}*/

using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
	[Table("users")]
	public class User
	{
		[Column("id")] public int Id { get; set; }
		[Column("name")] public string Name { get; set; } = string.Empty;
		[Column("email")] public string Email { get; set; } = string.Empty;
		[Column("password")] public string Password { get; set; } = string.Empty;
		[Column("role")] public string Role { get; set; } = string.Empty;
		[Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

		// Navigation (one per user based on role)
		public StudentProfile? StudentProfile { get; set; }
		public DoctorProfile? DoctorProfile { get; set; }
		public CompanyProfile? CompanyProfile { get; set; }
		public AssociationProfile? AssociationProfile { get; set; }
	}
}
