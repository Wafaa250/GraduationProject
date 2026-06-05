using System;
using System.Collections.Generic;

namespace GraduationProject.API.DTOs
{
    public class StudentPostDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public string? AuthorAvatarBase64 { get; set; }
        public string? AuthorSubtitle { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? AttachmentUrl { get; set; }
        public string? AttachmentType { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class StudentPostFeedDto
    {
        public List<StudentPostDto> Items { get; set; } = new();
    }
}
