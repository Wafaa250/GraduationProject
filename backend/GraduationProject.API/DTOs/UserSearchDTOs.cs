namespace GraduationProject.API.DTOs
{
    public class UserSearchResultDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Major { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
    }
}
