// Data/ApplicationDbContext.cs
using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Models;

namespace GraduationProject.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        // ── Core Entities ────────────────────────────────────────────────────
        public DbSet<User> Users => Set<User>();
        public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
        public DbSet<DoctorProfile> DoctorProfiles => Set<DoctorProfile>();
        public DbSet<CompanyProfile> CompanyProfiles => Set<CompanyProfile>();
        public DbSet<AssociationProfile> AssociationProfiles => Set<AssociationProfile>();
        public DbSet<Skill> Skills => Set<Skill>();
        public DbSet<StudentSkill> StudentSkills => Set<StudentSkill>();

        // ── Student Graduation Projects ──────────────────────────────────────
        public DbSet<StudentProject> StudentProjects => Set<StudentProject>();
        public DbSet<StudentProjectMember> StudentProjectMembers => Set<StudentProjectMember>();
        public DbSet<ProjectInvitation> ProjectInvitations => Set<ProjectInvitation>();
        public DbSet<SupervisorRequest> SupervisorRequests => Set<SupervisorRequest>();

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

            // ── STUDENT GRADUATION PROJECTS ───────────────────────────────────
            modelBuilder.Entity<StudentProject>(e =>
            {
                e.ToTable("graduation_projects");

                // كل طالب ما عنده غير مشروع تخرج واحد كـ owner
                e.HasIndex(p => p.OwnerId).IsUnique();

                e.HasOne(p => p.Owner)
                 .WithMany()
                 .HasForeignKey(p => p.OwnerId)
                 .OnDelete(DeleteBehavior.Cascade);

                // Supervisor is optional — set when doctor accepts a request
                // Restrict: deleting a doctor does not delete the project
                e.HasOne(p => p.Supervisor)
                 .WithMany()
                 .HasForeignKey(p => p.SupervisorId)
                 .IsRequired(false)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // ── STUDENT GRADUATION PROJECT MEMBERS ───────────────────────────
            modelBuilder.Entity<StudentProjectMember>(e =>
            {
                e.ToTable("graduation_project_members");

                e.HasIndex(m => new { m.ProjectId, m.StudentId })
                 .IsUnique()
                 .HasDatabaseName("ix_graduation_project_members_project_student");

                e.Property(m => m.Role)
                 .HasColumnName("role")
                 .HasMaxLength(20)
                 .HasDefaultValue("member")
                 .IsRequired();

                e.HasOne(m => m.Project)
                 .WithMany(p => p.Members)
                 .HasForeignKey(m => m.ProjectId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(m => m.Student)
                 .WithMany()
                 .HasForeignKey(m => m.StudentId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── PROJECT INVITATIONS ───────────────────────────────────────────
            modelBuilder.Entity<ProjectInvitation>(e =>
            {
                e.ToTable("project_invitations");

                e.Property(i => i.Status)
                 .HasColumnName("status")
                 .HasMaxLength(20)
                 .HasDefaultValue("pending")
                 .IsRequired();

                // Index for query performance (project inbox, receiver inbox)
                // NOT unique — same (project, receiver) pair can have multiple rows
                // over time (e.g. rejected → new invite later is valid)
                // Duplicate pending invites are prevented in application logic.
                e.HasIndex(i => new { i.ProjectId, i.ReceiverId })
                 .HasDatabaseName("ix_project_invitations_project_receiver");

                // Project deleted → cascade delete its invitations
                e.HasOne(i => i.Project)
                 .WithMany(p => p.Invitations)
                 .HasForeignKey(i => i.ProjectId)
                 .OnDelete(DeleteBehavior.Cascade);

                // Restrict to avoid multiple cascade paths from student_profiles
                e.HasOne(i => i.Sender)
                 .WithMany()
                 .HasForeignKey(i => i.SenderId)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(i => i.Receiver)
                 .WithMany()
                 .HasForeignKey(i => i.ReceiverId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // ── SUPERVISOR REQUESTS ───────────────────────────────────────────
            modelBuilder.Entity<SupervisorRequest>(e =>
            {
                e.ToTable("supervisor_requests");

                e.Property(r => r.Status)
                 .HasColumnName("status")
                 .HasMaxLength(20)
                 .HasDefaultValue("pending")
                 .IsRequired();

                // Index for quick lookup: all requests for a project or a doctor
                e.HasIndex(r => r.ProjectId)
                 .HasDatabaseName("ix_supervisor_requests_project");

                e.HasIndex(r => r.DoctorId)
                 .HasDatabaseName("ix_supervisor_requests_doctor");

                // Project deleted → cascade delete its supervisor requests
                e.HasOne(r => r.Project)
                 .WithMany(p => p.SupervisorRequests)
                 .HasForeignKey(r => r.ProjectId)
                 .OnDelete(DeleteBehavior.Cascade);

                // Restrict: deleting a doctor does not delete the request history
                e.HasOne(r => r.Doctor)
                 .WithMany()
                 .HasForeignKey(r => r.DoctorId)
                 .OnDelete(DeleteBehavior.Restrict);

                // Restrict: deleting a student does not delete the request history
                e.HasOne(r => r.Sender)
                 .WithMany()
                 .HasForeignKey(r => r.SenderId)
                 .OnDelete(DeleteBehavior.Restrict);
            });
        }
    }
}