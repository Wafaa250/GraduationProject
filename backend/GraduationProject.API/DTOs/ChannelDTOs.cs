// DTOs/ChannelDTOs.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GraduationProject.API.DTOs
{
    // ── Create ────────────────────────────────────────────────────────────────
    public class CreateChannelDto
    {
        [Required(ErrorMessage = "Channel name is required")]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Course code is required")]
        [MaxLength(50)]
        public string CourseCode { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Section { get; set; } = "Section A";

        public string Color { get; set; } = "#6366f1";
    }

    // ── Update ────────────────────────────────────────────────────────────────
    public class UpdateChannelDto
    {
        public string? Name       { get; set; }
        public string? CourseCode { get; set; }
        public string? Section    { get; set; }
        public string? Color      { get; set; }
    }

    // ── Response ──────────────────────────────────────────────────────────────
    public class ChannelResponseDto
    {
        public int    Id            { get; set; }
        public string Name          { get; set; } = string.Empty;
        public string CourseCode    { get; set; } = string.Empty;
        public string Section       { get; set; } = string.Empty;
        public string InviteCode    { get; set; } = string.Empty;
        public string Color         { get; set; } = string.Empty;
        public int    StudentsCount { get; set; }
        public int    TeamsCount    { get; set; }
        public DateTime CreatedAt  { get; set; }
    }

    // ── Channel Detail (مع الطلاب والفرق) ────────────────────────────────────
    public class ChannelDetailDto : ChannelResponseDto
    {
        public List<ChannelStudentDto> Students { get; set; } = new();
        public List<TeamDto>           Teams    { get; set; } = new();
    }

    public class ChannelStudentDto
    {
        public int    Id        { get; set; }
        public string Name      { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
        public string Email     { get; set; } = string.Empty;
        public bool   InTeam    { get; set; }
    }

    public class TeamDto
    {
        public int    Id           { get; set; }
        public string Name         { get; set; } = string.Empty;
        public string ProjectTitle { get; set; } = string.Empty;
        public List<TeamMemberDto> Members { get; set; } = new();
    }

    public class TeamMemberDto
    {
        public int    Id        { get; set; }
        public string Name      { get; set; } = string.Empty;
        public string StudentId { get; set; } = string.Empty;
    }
}
