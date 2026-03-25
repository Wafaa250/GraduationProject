// Models/Channel.cs
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace GraduationProject.API.Models
{
    [Table("channels")]
    public class Channel
    {
        [Column("id")]          public int    Id         { get; set; }
        [Column("doctor_id")]   public int    DoctorId   { get; set; }
        [Column("name")]        public string Name       { get; set; } = string.Empty;
        [Column("course_code")] public string CourseCode { get; set; } = string.Empty;
        [Column("section")]     public string Section    { get; set; } = string.Empty;
        [Column("invite_code")] public string InviteCode { get; set; } = string.Empty;
        [Column("color")]       public string Color      { get; set; } = "#6366f1";
        [Column("created_at")] public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public DoctorProfile Doctor { get; set; } = null!;
        public ICollection<ChannelStudent> ChannelStudents { get; set; } = new List<ChannelStudent>();
        public ICollection<Team> Teams { get; set; } = new List<Team>();
    }

    // ── طالب داخل قناة ─────────────────────────────────────────────────────
    [Table("channel_students")]
    public class ChannelStudent
    {
        [Column("id")]          public int      Id         { get; set; }
        [Column("channel_id")]  public int      ChannelId  { get; set; }
        [Column("student_id")]  public int      StudentId  { get; set; }
        [Column("joined_at")]   public DateTime JoinedAt   { get; set; } = DateTime.UtcNow;

        public Channel        Channel { get; set; } = null!;
        public StudentProfile Student { get; set; } = null!;
    }
}
