// Models/Team.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("teams")]
    public class Team
    {
        [Column("id")]            public int    Id            { get; set; }
        [Column("channel_id")]    public int    ChannelId     { get; set; }
        [Column("name")]          public string Name          { get; set; } = string.Empty;
        [Column("project_title")] public string ProjectTitle  { get; set; } = string.Empty;
        [Column("created_at")]    public DateTime CreatedAt   { get; set; } = DateTime.UtcNow;

        public Channel Channel { get; set; } = null!;
        public ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();
    }

    [Table("team_members")]
    public class TeamMember
    {
        [Column("id")]          public int      Id        { get; set; }
        [Column("team_id")]     public int      TeamId    { get; set; }
        [Column("student_id")]  public int      StudentId { get; set; }
        [Column("joined_at")]   public DateTime JoinedAt  { get; set; } = DateTime.UtcNow;

        public Team           Team    { get; set; } = null!;
        public StudentProfile Student { get; set; } = null!;
    }
}
