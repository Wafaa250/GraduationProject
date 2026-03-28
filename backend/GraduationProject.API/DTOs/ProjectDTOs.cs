// DTOs/ProjectDTOs.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace GraduationProject.API.DTOs
{
    // ── Create ────────────────────────────────────────────────────────────────
    public class CreateProjectDto
    {
        [Required(ErrorMessage = "Project name is required")]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        // "students" | "doctor"
        public string FormationMode { get; set; } = "students";

        public DateTime? PublishDate { get; set; }
        public DateTime? DueDate     { get; set; }

        [Range(0, 100, ErrorMessage = "Weight must be between 0 and 100")]
        public int? Weight { get; set; }

        [Range(1, 20, ErrorMessage = "Max team size must be between 1 and 20")]
        public int? MaxTeamSize { get; set; }

        // List of skill name strings from frontend
        public List<string> RequiredSkills { get; set; } = new();

        // Base64 file content — optional, handled separately if too large
        public string? FileBase64 { get; set; }

        // Original file name for display
        public string? FileName { get; set; }
    }

    // ── Update ────────────────────────────────────────────────────────────────
    public class UpdateProjectDto
    {
        public string? Name          { get; set; }
        public string? Description   { get; set; }
        public string? FormationMode { get; set; }
        public DateTime? PublishDate { get; set; }
        public DateTime? DueDate     { get; set; }
        public int?    Weight        { get; set; }
        public int?    MaxTeamSize   { get; set; }
        public List<string>? RequiredSkills { get; set; }
    }

    // ── Response ──────────────────────────────────────────────────────────────
    public class ProjectResponseDto
    {
        public int     Id            { get; set; }
        public int     ChannelId     { get; set; }
        public string  Name          { get; set; } = string.Empty;
        public string? Description   { get; set; }
        public string  FormationMode { get; set; } = "students";
        public DateTime? PublishDate { get; set; }
        public DateTime? DueDate     { get; set; }
        public int?    Weight        { get; set; }
        public int?    MaxTeamSize   { get; set; }
        public List<string> RequiredSkills { get; set; } = new();
        public bool    HasFile       { get; set; }
        public string? FilePath      { get; set; }
        public int     TeamCount     { get; set; }
        public DateTime CreatedAt    { get; set; }
    }
}
