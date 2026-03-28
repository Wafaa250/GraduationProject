// Data/ApplicationDbContext.cs
// CHANGED: added DbSet<Project>, Project entity config, Team→Project FK
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Models;

namespace GraduationProject.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        // ── DbSets ──────────────────────────────────────────────────────────
        public DbSet<User>               Users               => Set<User>();
        public DbSet<StudentProfile>     StudentProfiles     => Set<StudentProfile>();
        public DbSet<DoctorProfile>      DoctorProfiles      => Set<DoctorProfile>();
        public DbSet<CompanyProfile>     CompanyProfiles     => Set<CompanyProfile>();
        public DbSet<AssociationProfile> AssociationProfiles => Set<AssociationProfile>();
        public DbSet<Skill>              Skills              => Set<Skill>();
        public DbSet<StudentSkill>       StudentSkills       => Set<StudentSkill>();

        // ── Doctor Dashboard ────────────────────────────────────────────────
        public DbSet<Channel>        Channels        => Set<Channel>();
        public DbSet<ChannelStudent> ChannelStudents => Set<ChannelStudent>();
        public DbSet<Project>        Projects        => Set<Project>();   // NEW
        public DbSet<Team>           Teams           => Set<Team>();
        public DbSet<TeamMember>     TeamMembers     => Set<TeamMember>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ── USERS ────────────────────────────────────────────────────────
            modelBuilder.Entity<User>(e =>
            {
                e.ToTable("users");
                e.HasKey(u => u.Id);
                e.HasIndex(u => u.Email).IsUnique();
            });

            // ── STUDENT PROFILE ──────────────────────────────────────────────
            modelBuilder.Entity<StudentProfile>(e =>
            {
                e.ToTable("student_profiles");
                e.HasOne(s => s.User)
                 .WithOne(u => u.StudentProfile)
                 .HasForeignKey<StudentProfile>(s => s.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── DOCTOR PROFILE ───────────────────────────────────────────────
            modelBuilder.Entity<DoctorProfile>(e =>
            {
                e.ToTable("doctor_profiles");
                e.HasOne(d => d.User)
                 .WithOne(u => u.DoctorProfile)
                 .HasForeignKey<DoctorProfile>(d => d.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── COMPANY PROFILE ──────────────────────────────────────────────
            modelBuilder.Entity<CompanyProfile>(e =>
            {
                e.ToTable("company_profiles");
                e.HasOne(c => c.User)
                 .WithOne(u => u.CompanyProfile)
                 .HasForeignKey<CompanyProfile>(c => c.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── ASSOCIATION PROFILE ──────────────────────────────────────────
            modelBuilder.Entity<AssociationProfile>(e =>
            {
                e.ToTable("association_profiles");
                e.HasOne(a => a.User)
                 .WithOne(u => u.AssociationProfile)
                 .HasForeignKey<AssociationProfile>(a => a.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── SKILLS ───────────────────────────────────────────────────────
            modelBuilder.Entity<Skill>(e =>
            {
                e.ToTable("skills");
                e.HasIndex(s => s.Name).IsUnique();
            });

            // ── STUDENT SKILLS ───────────────────────────────────────────────
            modelBuilder.Entity<StudentSkill>(e =>
            {
                e.ToTable("student_skills");
                e.HasIndex(ss => new { ss.StudentId, ss.SkillId }).IsUnique();
                e.HasOne(ss => ss.Student)
                 .WithMany(s => s.StudentSkills)
                 .HasForeignKey(ss => ss.StudentId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(ss => ss.Skill)
                 .WithMany(s => s.StudentSkills)
                 .HasForeignKey(ss => ss.SkillId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // ── CHANNEL ──────────────────────────────────────────────────────
            modelBuilder.Entity<Channel>(e =>
            {
                e.ToTable("channels");
                e.HasIndex(c => c.InviteCode).IsUnique();
                e.HasOne(c => c.Doctor)
                 .WithMany()
                 .HasForeignKey(c => c.DoctorId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── CHANNEL STUDENTS ─────────────────────────────────────────────
            modelBuilder.Entity<ChannelStudent>(e =>
            {
                e.ToTable("channel_students");
                e.HasIndex(cs => new { cs.ChannelId, cs.StudentId }).IsUnique();
                e.HasOne(cs => cs.Channel)
                 .WithMany(c => c.ChannelStudents)
                 .HasForeignKey(cs => cs.ChannelId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(cs => cs.Student)
                 .WithMany()
                 .HasForeignKey(cs => cs.StudentId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── PROJECTS ─────────────────────────────────────────────────────  NEW
            modelBuilder.Entity<Project>(e =>
            {
                e.ToTable("projects");
                e.HasOne(p => p.Channel)
                 .WithMany()                        // Channel doesn't need a Projects nav prop
                 .HasForeignKey(p => p.ChannelId)
                 .OnDelete(DeleteBehavior.Cascade); // حذف القناة → حذف مشاريعها
            });

            // ── TEAMS ─────────────────────────────────────────────────────────
            modelBuilder.Entity<Team>(e =>
            {
                e.ToTable("teams");
                e.HasOne(t => t.Channel)
                 .WithMany(c => c.Teams)
                 .HasForeignKey(t => t.ChannelId)
                 .OnDelete(DeleteBehavior.Cascade);

                // NEW: team → project (nullable FK)
                e.HasOne(t => t.Project)
                 .WithMany(p => p.Teams)
                 .HasForeignKey(t => t.ProjectId)
                 .OnDelete(DeleteBehavior.SetNull)  // حذف المشروع → project_id يصير null
                 .IsRequired(false);
            });

            // ── TEAM MEMBERS ──────────────────────────────────────────────────
            modelBuilder.Entity<TeamMember>(e =>
            {
                e.ToTable("team_members");
                e.HasIndex(tm => new { tm.TeamId, tm.StudentId }).IsUnique();
                e.HasOne(tm => tm.Team)
                 .WithMany(t => t.TeamMembers)
                 .HasForeignKey(tm => tm.TeamId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(tm => tm.Student)
                 .WithMany()
                 .HasForeignKey(tm => tm.StudentId)
                 .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
