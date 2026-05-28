using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    public class ProjectMilestoneResponseDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? DueDate { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; }
    }

    public class CreateProjectMilestoneDto
    {
        [Required]
        [StringLength(200, MinimumLength = 1)]
        public string Title { get; set; } = string.Empty;

        [StringLength(2000)]
        public string? Description { get; set; }

        public DateTime? DueDate { get; set; }
    }

    public class UpdateProjectMilestoneStatusDto
    {
        [Required]
        [RegularExpression("^(Pending|In Progress|Completed)$")]
        public string Status { get; set; } = "Pending";
    }
}
