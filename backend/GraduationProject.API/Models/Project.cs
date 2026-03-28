// Models/Project.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("projects")]
    public class Project
    {
        [Column("id")]             public int      Id            { get; set; }
        [Column("channel_id")]     public int      ChannelId     { get; set; }
        [Column("name")]           public string   Name          { get; set; } = string.Empty;
        [Column("description")]    public string?  Description   { get; set; }

        // Formation mode: "students" | "doctor"
        [Column("formation_mode")] public string   FormationMode { get; set; } = "students";

        [Column("publish_date")]   public DateTime? PublishDate  { get; set; }
        [Column("due_date")]       public DateTime? DueDate      { get; set; }

        // % of final grade, nullable
        [Column("weight")]         public int?     Weight        { get; set; }

        // Max students per team
        [Column("max_team_size")]  public int?     MaxTeamSize   { get; set; }

        // Required skills — stored as JSON array of strings e.g. ["React","Node.js"]
        [Column("required_skills")] public string? RequiredSkills { get; set; }

        // File attachment — stored as relative path or base64 depending on strategy
        [Column("file_path")]      public string?  FilePath      { get; set; }

        [Column("created_at")]     public DateTime CreatedAt     { get; set; } = DateTime.UtcNow;

        // Navigation
        public Channel             Channel { get; set; } = null!;
        public ICollection<Team>   Teams   { get; set; } = new List<Team>();
    }
}
