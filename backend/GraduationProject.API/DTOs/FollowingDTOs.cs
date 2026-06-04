using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class FollowingListResponseDto
    {
        public List<FollowingCompanyDto> Companies { get; set; } = new();
        public List<FollowingAssociationDto> Associations { get; set; } = new();
    }

    public class FollowingCompanyDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? Industry { get; set; }
    }

    public class FollowingAssociationDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string? Category { get; set; }
    }
}
