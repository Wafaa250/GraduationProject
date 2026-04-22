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
        public DbSet<SupervisorCancellationRequest> SupervisorCancellationRequests => Set<SupervisorCancellationRequest>();

        // ── Course-based Team Formation ──────────────────────────────────────
        public DbSet<Course> Courses => Set<Course>();
        public DbSet<CourseSection> CourseSections => Set<CourseSection>();                   // NEW
        public DbSet<CourseEnrollment> CourseEnrollments => Set<CourseEnrollment>();
        public DbSet<CourseProjectSetting> CourseProjectSettings => Set<CourseProjectSetting>();
        public DbSet<SectionProjectSetting> SectionProjectSettings => Set<SectionProjectSetting>(); // NEW
        public DbSet<CourseTeam> CourseTeams => Set<CourseTeam>();
        public DbSet<CourseTeamMember> CourseTeamMembers => Set<CourseTeamMember>();
        public DbSet<CoursePartnerRequest> CoursePartnerRequests => Set<CoursePartnerRequest>();

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

                e.HasIndex(i => new { i.ProjectId, i.ReceiverId })
                 .HasDatabaseName("ix_project_invitations_project_receiver");

                e.HasOne(i => i.Project)
                 .WithMany(p => p.Invitations)
                 .HasForeignKey(i => i.ProjectId)
                 .OnDelete(DeleteBehavior.Cascade);

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

                e.HasIndex(r => r.ProjectId)
                 .HasDatabaseName("ix_supervisor_requests_project");

                e.HasIndex(r => r.DoctorId)
                 .HasDatabaseName("ix_supervisor_requests_doctor");

                e.HasOne(r => r.Project)
                 .WithMany(p => p.SupervisorRequests)
                 .HasForeignKey(r => r.ProjectId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(r => r.Doctor)
                 .WithMany()
                 .HasForeignKey(r => r.DoctorId)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(r => r.Sender)
                 .WithMany()
                 .HasForeignKey(r => r.SenderId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // ── SUPERVISOR CANCELLATION REQUESTS ──────────────────────────────
            modelBuilder.Entity<SupervisorCancellationRequest>(e =>
            {
                e.ToTable("supervisor_cancellation_requests");

                e.Property(r => r.Status)
                 .HasColumnName("status")
                 .HasMaxLength(20)
                 .HasDefaultValue("pending")
                 .IsRequired();

                e.HasIndex(r => r.ProjectId)
                 .HasDatabaseName("ix_supervisor_cancellation_requests_project");

                e.HasIndex(r => r.DoctorId)
                 .HasDatabaseName("ix_supervisor_cancellation_requests_doctor");

                e.HasOne(r => r.Project)
                 .WithMany(p => p.SupervisorCancellationRequests)
                 .HasForeignKey(r => r.ProjectId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(r => r.Doctor)
                 .WithMany()
                 .HasForeignKey(r => r.DoctorId)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(r => r.Sender)
                 .WithMany()
                 .HasForeignKey(r => r.SenderId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // ══════════════════════════════════════════════════════════════════
            // COURSE-BASED TEAM FORMATION
            // ══════════════════════════════════════════════════════════════════

            // ── COURSE ────────────────────────────────────────────────────────
            modelBuilder.Entity<Course>(e =>
            {
                e.ToTable("courses");

                // Course code is unique per doctor, not globally.
                // A global unique index would be too strict for multi-doctor scenarios.
                e.HasIndex(c => new { c.DoctorId, c.Code })
                 .IsUnique()
                 .HasDatabaseName("ix_courses_doctor_code");

                // Restrict: deleting a doctor does not cascade-delete their courses
                // (preserves academic history).
                e.HasOne(c => c.Doctor)
                 .WithMany()
                 .HasForeignKey(c => c.DoctorId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // ── COURSE SECTION  (NEW) ─────────────────────────────────────────
            modelBuilder.Entity<CourseSection>(e =>
            {
                e.ToTable("course_sections");

                // Section number is unique within a course (no two "section 2"s in course 5).
                e.HasIndex(cs => new { cs.CourseId, cs.SectionNumber })
                 .IsUnique()
                 .HasDatabaseName("ix_course_sections_course_number");

                // Course deleted → cascade delete its sections.
                e.HasOne(cs => cs.Course)
                 .WithMany(c => c.Sections)
                 .HasForeignKey(cs => cs.CourseId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── COURSE ENROLLMENT ─────────────────────────────────────────────
            modelBuilder.Entity<CourseEnrollment>(e =>
            {
                e.ToTable("course_enrollments");

                // A student cannot be enrolled twice in the same course.
                e.HasIndex(ce => new { ce.CourseId, ce.StudentId })
                 .IsUnique()
                 .HasDatabaseName("ix_course_enrollments_course_student");

                // Course deleted → cascade delete its enrollments.
                e.HasOne(ce => ce.Course)
                 .WithMany(c => c.Enrollments)
                 .HasForeignKey(ce => ce.CourseId)
                 .OnDelete(DeleteBehavior.Cascade);

                // Restrict: deleting a student does not cascade-delete enrollment records.
                e.HasOne(ce => ce.Student)
                 .WithMany()
                 .HasForeignKey(ce => ce.StudentId)
                 .OnDelete(DeleteBehavior.Restrict);

                // ── NEW: optional Section FK ──────────────────────────────────
                // Section is optional; if the section row is deleted, null the FK
                // (student remains enrolled in the course but unassigned).
                e.HasOne(ce => ce.Section)
                 .WithMany(cs => cs.Enrollments)
                 .HasForeignKey(ce => ce.CourseSectionId)
                 .IsRequired(false)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            // ── COURSE PROJECT SETTING ────────────────────────────────────────
            modelBuilder.Entity<CourseProjectSetting>(e =>
            {
                e.ToTable("course_project_settings");

                e.HasIndex(cps => cps.CourseId)
                 .HasDatabaseName("ix_course_project_settings_course");

                // Course deleted → cascade delete its project settings.
                e.HasOne(cps => cps.Course)
                 .WithMany(c => c.ProjectSettings)
                 .HasForeignKey(cps => cps.CourseId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── SECTION PROJECT SETTING  (NEW) ────────────────────────────────
            modelBuilder.Entity<SectionProjectSetting>(e =>
            {
                e.ToTable("section_project_settings");

                e.HasIndex(sps => sps.CourseSectionId)
                 .HasDatabaseName("ix_section_project_settings_section");

                // Section deleted → cascade delete its project settings.
                e.HasOne(sps => sps.Section)
                 .WithMany(cs => cs.ProjectSettings)
                 .HasForeignKey(sps => sps.CourseSectionId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── COURSE TEAM ───────────────────────────────────────────────────
            modelBuilder.Entity<CourseTeam>(e =>
            {
                e.ToTable("course_teams");

                e.HasIndex(ct => ct.CourseId)
                 .HasDatabaseName("ix_course_teams_course");

                // Course deleted → cascade delete its teams.
                e.HasOne(ct => ct.Course)
                 .WithMany(c => c.Teams)
                 .HasForeignKey(ct => ct.CourseId)
                 .OnDelete(DeleteBehavior.Cascade);

                // Setting deleted → restrict (do not silently wipe teams).
                e.HasOne(ct => ct.ProjectSetting)
                 .WithMany(cps => cps.Teams)
                 .HasForeignKey(ct => ct.ProjectSettingId)
                 .OnDelete(DeleteBehavior.Restrict);

                // Restrict: deleting a student does not delete the team.
                e.HasOne(ct => ct.Leader)
                 .WithMany()
                 .HasForeignKey(ct => ct.LeaderStudentId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // ── COURSE TEAM MEMBER ────────────────────────────────────────────
            modelBuilder.Entity<CourseTeamMember>(e =>
            {
                e.ToTable("course_team_members");

                // A student cannot appear twice in the same team.
                e.HasIndex(ctm => new { ctm.TeamId, ctm.StudentId })
                 .IsUnique()
                 .HasDatabaseName("ix_course_team_members_team_student");

                // ── ONE-TEAM-PER-PROJECT CONSTRAINT (UPDATED) ─────────────────
                // A student can belong to at most one team within a given
                // PROJECT SETTING (not per course). This allows a student to
                // participate in multiple teams across different projects in
                // the SAME course, while still preventing duplicate membership
                // inside the same project.
                //
                // ProjectSettingId is denormalised from CourseTeam and must
                // always equal Team.ProjectSettingId; it is set by the service
                // layer when adding a member.
                //
                // MIGRATION NOTE (existing DBs):
                //   1. ADD COLUMN project_setting_id INT NOT NULL DEFAULT 0 to
                //      course_team_members.
                //   2. Back-fill:
                //        UPDATE course_team_members m
                //        SET project_setting_id = t.project_setting_id
                //        FROM course_teams t
                //        WHERE m.team_id = t.id;
                //   3. DROP INDEX ix_course_team_members_course_student (old).
                //   4. CREATE UNIQUE INDEX ix_course_team_members_project_student
                //      ON course_team_members(project_setting_id, student_id);
                //   5. Remove the DEFAULT 0 once back-fill completes.
                e.HasIndex(ctm => new { ctm.ProjectSettingId, ctm.StudentId })
                 .IsUnique()
                 .HasDatabaseName("ix_course_team_members_project_student");

                e.Property(ctm => ctm.Role)
                 .HasColumnName("role")
                 .HasMaxLength(20)
                 .HasDefaultValue("member")
                 .IsRequired();

                // Team deleted → cascade delete its member rows.
                e.HasOne(ctm => ctm.Team)
                 .WithMany(ct => ct.Members)
                 .HasForeignKey(ctm => ctm.TeamId)
                 .OnDelete(DeleteBehavior.Cascade);

                // CourseId FK — Restrict to avoid a second cascade path from courses
                // (course → team → member already covers cascade via TeamId above).
                e.HasOne(ctm => ctm.Course)
                 .WithMany()
                 .HasForeignKey(ctm => ctm.CourseId)
                 .OnDelete(DeleteBehavior.Restrict);

                // Restrict: deleting a student does not cascade-delete membership records.
                e.HasOne(ctm => ctm.Student)
                 .WithMany()
                 .HasForeignKey(ctm => ctm.StudentId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // ── COURSE PARTNER REQUEST ────────────────────────────────────────
            modelBuilder.Entity<CoursePartnerRequest>(e =>
            {
                e.ToTable("course_partner_requests");

                e.Property(r => r.Status)
                 .HasColumnName("status")
                 .HasMaxLength(20)
                 .HasDefaultValue("pending")
                 .IsRequired();

                e.HasIndex(r => r.CourseId)
                 .HasDatabaseName("ix_course_partner_requests_course");

                // Course deleted → cascade delete its partner requests.
                e.HasOne(r => r.Course)
                 .WithMany(c => c.PartnerRequests)
                 .HasForeignKey(r => r.CourseId)
                 .OnDelete(DeleteBehavior.Cascade);

                // Restrict both student FKs to avoid multiple cascade paths
                // from student_profiles into course_partner_requests.
                e.HasOne(r => r.Sender)
                 .WithMany()
                 .HasForeignKey(r => r.SenderStudentId)
                 .OnDelete(DeleteBehavior.Restrict);

                e.HasOne(r => r.Receiver)
                 .WithMany()
                 .HasForeignKey(r => r.ReceiverStudentId)
                 .OnDelete(DeleteBehavior.Restrict);

                // TeamId is optional — set after a request is accepted.
                e.HasOne(r => r.Team)
                 .WithMany()
                 .HasForeignKey(r => r.TeamId)
                 .IsRequired(false)
                 .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}