using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    public class SendCourseTeamInvitationsDto
    {
        [Required]
        [MinLength(1)]
        public List<int> ReceiverIds { get; set; } = new();
    }
}
