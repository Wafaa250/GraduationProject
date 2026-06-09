using Microsoft.EntityFrameworkCore;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;

namespace GraduationProject.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        // ── Core Entities ────────────────────────────────────────────────────
        public DbSet<User> Users => Set<User>();
        public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
        public DbSet<PasswordResetCode> PasswordResetCodes => Set<PasswordResetCode>();
        public DbSet<StudentProfile> StudentProfiles => Set<StudentProfile>();
        public DbSet<DoctorProfile> DoctorProfiles => Set<DoctorProfile>();
        public DbSet<CompanyProfile> CompanyProfiles => Set<CompanyProfile>();
        public DbSet<CompanyMember> CompanyMembers => Set<CompanyMember>();
        public DbSet<CompanySavedStudentRecommendation> CompanySavedStudentRecommendations =>
            Set<CompanySavedStudentRecommendation>();
        public DbSet<CompanySavedTeamRecommendation> CompanySavedTeamRecommendations =>
            Set<CompanySavedTeamRecommendation>();
        public DbSet<CompanyActivityLog> CompanyActivityLogs => Set<CompanyActivityLog>();
        public DbSet<CompanyMemberNotificationPreference> CompanyMemberNotificationPreferences =>
            Set<CompanyMemberNotificationPreference>();
        public DbSet<CompanyTalentRequest> CompanyTalentRequests => Set<CompanyTalentRequest>();
        public DbSet<CompanyRequest> CompanyRequests => Set<CompanyRequest>();
        public DbSet<CompanyRequestRole> CompanyRequestRoles => Set<CompanyRequestRole>();
        public DbSet<CompanyRequestSkill> CompanyRequestSkills => Set<CompanyRequestSkill>();
        public DbSet<CompanyRequestInvitation> CompanyRequestInvitations => Set<CompanyRequestInvitation>();
        public DbSet<CompanyRequestRecommendationRun> CompanyRequestRecommendationRuns => Set<CompanyRequestRecommendationRun>();
        public DbSet<CompanyRequestRecommendation> CompanyRequestRecommendations => Set<CompanyRequestRecommendation>();
        public DbSet<CompanyRequestTeamRecommendationRun> CompanyRequestTeamRecommendationRuns => Set<CompanyRequestTeamRecommendationRun>();
        public DbSet<CompanyRequestTeamRecommendation> CompanyRequestTeamRecommendations => Set<CompanyRequestTeamRecommendation>();
        public DbSet<CompanyRequestTeamRecommendationMember> CompanyRequestTeamRecommendationMembers => Set<CompanyRequestTeamRecommendationMember>();
        public DbSet<RecommendationSemanticEmbedding> RecommendationSemanticEmbeddings => Set<RecommendationSemanticEmbedding>();
        public DbSet<StudentAssociationProfile> StudentAssociationProfiles => Set<StudentAssociationProfile>();
        public DbSet<StudentOrganizationEvent> StudentOrganizationEvents => Set<StudentOrganizationEvent>();
        public DbSet<StudentOrganizationEventRegistrationForm> StudentOrganizationEventRegistrationForms =>
            Set<StudentOrganizationEventRegistrationForm>();
        public DbSet<StudentOrganizationEventRegistrationField> StudentOrganizationEventRegistrationFields =>
            Set<StudentOrganizationEventRegistrationField>();
        public DbSet<StudentOrganizationEventRegistration> StudentOrganizationEventRegistrations =>
            Set<StudentOrganizationEventRegistration>();
        public DbSet<StudentOrganizationEventRegistrationAnswer> StudentOrganizationEventRegistrationAnswers =>
            Set<StudentOrganizationEventRegistrationAnswer>();
        public DbSet<OrganizationFollow> OrganizationFollows => Set<OrganizationFollow>();
        public DbSet<CompanyFollow> CompanyFollows => Set<CompanyFollow>();
        public DbSet<FeedPostEngagement> FeedPostEngagements => Set<FeedPostEngagement>();
        public DbSet<FeedPostComment> FeedPostComments => Set<FeedPostComment>();
        public DbSet<StudentPost> StudentPosts => Set<StudentPost>();
        public DbSet<DoctorPost> DoctorPosts => Set<DoctorPost>();
        public DbSet<StudentOrganizationTeamMember> StudentOrganizationTeamMembers => Set<StudentOrganizationTeamMember>();
        public DbSet<StudentOrganizationRecruitmentCampaign> StudentOrganizationRecruitmentCampaigns =>
            Set<StudentOrganizationRecruitmentCampaign>();
        public DbSet<StudentOrganizationRecruitmentPosition> StudentOrganizationRecruitmentPositions =>
            Set<StudentOrganizationRecruitmentPosition>();
        public DbSet<StudentOrganizationRecruitmentQuestion> StudentOrganizationRecruitmentQuestions =>
            Set<StudentOrganizationRecruitmentQuestion>();
        public DbSet<StudentOrganizationRecruitmentApplication> StudentOrganizationRecruitmentApplications =>
            Set<StudentOrganizationRecruitmentApplication>();
        public DbSet<StudentOrganizationRecruitmentApplicationAnswer> StudentOrganizationRecruitmentApplicationAnswers =>
            Set<StudentOrganizationRecruitmentApplicationAnswer>();
        public DbSet<StudentOrganizationRecruitmentApplicantAnalysis> StudentOrganizationRecruitmentApplicantAnalyses =>
            Set<StudentOrganizationRecruitmentApplicantAnalysis>();
        public DbSet<StudentOrganizationMember> StudentOrganizationMembers => Set<StudentOrganizationMember>();
        public DbSet<Skill> Skills => Set<Skill>();
        public DbSet<StudentSkill> StudentSkills => Set<StudentSkill>();

        // ── Student Graduation Projects ──────────────────────────────────────
        public DbSet<StudentProject> StudentProjects => Set<StudentProject>();
        public DbSet<StudentProjectMember> StudentProjectMembers => Set<StudentProjectMember>();
        public DbSet<ProjectInvitation> ProjectInvitations => Set<ProjectInvitation>();
        public DbSet<SupervisorRequest> SupervisorRequests => Set<SupervisorRequest>();
        public DbSet<SupervisorCancellationRequest> SupervisorCancellationRequests => Set<SupervisorCancellationRequest>();
        public DbSet<GraduationProjectDraft> GraduationProjectDrafts => Set<GraduationProjectDraft>();
        public DbSet<StudentAccountSettings> StudentAccountSettings => Set<StudentAccountSettings>();

        // ── Courses ──────────────────────────────────────────────────────────
        public DbSet<Course> Courses => Set<Course>();
        public DbSet<CourseSection> CourseSections => Set<CourseSection>();
        public DbSet<SectionEnrollment> SectionEnrollments => Set<SectionEnrollment>();
        public DbSet<SectionChatMessage> SectionChatMessages => Set<SectionChatMessage>();
        public DbSet<CourseProject> CourseProjects => Set<CourseProject>();
        public DbSet<CourseProjectSection> CourseProjectSections => Set<CourseProjectSection>();
        public DbSet<CourseTeam> CourseTeams => Set<CourseTeam>();
        public DbSet<CourseTeamMember> CourseTeamMembers => Set<CourseTeamMember>();
        public DbSet<CourseTeamMessage> CourseTeamMessages => Set<CourseTeamMessage>();
        public DbSet<Conversation> Conversations => Set<Conversation>();
        public DbSet<ConversationUser> ConversationUsers => Set<ConversationUser>();
        public DbSet<Message> Messages => Set<Message>();
        public DbSet<UserNotification> UserNotifications => Set<UserNotification>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // ── USERS ────────────────────────────────────────────────────────
            modelBuilder.Entity<User>(e =>
            {
                e.ToTable("users", t => t.HasCheckConstraint(
                    UserRoles.UsersRoleCheckConstraintName,
                    UserRoles.UsersRoleCheckSql));
                e.HasKey(u => u.Id);
                e.HasIndex(u => u.Email).IsUnique();
            });

            modelBuilder.Entity<PasswordResetToken>(e =>
            {
                e.ToTable("password_reset_tokens");
                e.HasKey(t => t.Id);
                e.HasIndex(t => t.TokenHash);
                e.HasIndex(t => new { t.UserId, t.UsedAt, t.ExpiresAt });
                e.HasOne(t => t.User)
                 .WithMany()
                 .HasForeignKey(t => t.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<PasswordResetCode>(e =>
            {
                e.ToTable("password_reset_codes");
                e.HasKey(c => c.Id);
                e.HasIndex(c => c.CodeHash);
                e.HasIndex(c => new { c.Email, c.IsUsed, c.ExpiresAt });
                e.HasIndex(c => new { c.UserId, c.CreatedAt });
                e.HasOne(c => c.User)
                 .WithMany()
                 .HasForeignKey(c => c.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
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
                e.HasIndex(c => c.NormalizedCompanyName).IsUnique();
                e.HasIndex(c => c.PrimaryEmailDomain)
                    .IsUnique()
                    .HasFilter("\"primary_email_domain\" IS NOT NULL");
                e.HasIndex(c => c.WebsiteDomain)
                    .IsUnique()
                    .HasFilter("\"website_domain\" IS NOT NULL");
                e.HasOne(c => c.User)
                 .WithOne(u => u.CompanyProfile)
                 .HasForeignKey<CompanyProfile>(c => c.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasMany(c => c.Members)
                 .WithOne(m => m.CompanyProfile)
                 .HasForeignKey(m => m.CompanyProfileId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CompanyMember>(e =>
            {
                e.ToTable("company_members");
                e.HasIndex(m => m.UserId).IsUnique();
                e.HasIndex(m => new { m.CompanyProfileId, m.UserId }).IsUnique();
                e.HasOne(m => m.User)
                 .WithOne(u => u.CompanyMembership)
                 .HasForeignKey<CompanyMember>(m => m.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CompanyMemberNotificationPreference>(e =>
            {
                e.ToTable("company_member_notification_preferences");
                e.HasIndex(p => new { p.CompanyProfileId, p.UserId }).IsUnique();
                e.HasOne(p => p.CompanyProfile)
                 .WithMany()
                 .HasForeignKey(p => p.CompanyProfileId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(p => p.User)
                 .WithMany()
                 .HasForeignKey(p => p.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CompanySavedStudentRecommendation>(e =>
            {
                e.ToTable("company_saved_student_recommendations");
                e.HasIndex(s => s.CompanyProfileId);
                e.HasIndex(s => new { s.CompanyProfileId, s.CompanyRequestId, s.StudentProfileId }).IsUnique();
                e.HasOne(s => s.CompanyProfile)
                 .WithMany()
                 .HasForeignKey(s => s.CompanyProfileId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(s => s.CompanyRequest)
                 .WithMany()
                 .HasForeignKey(s => s.CompanyRequestId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(s => s.StudentProfile)
                 .WithMany()
                 .HasForeignKey(s => s.StudentProfileId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(s => s.SavedByUser)
                 .WithMany()
                 .HasForeignKey(s => s.SavedByUserId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<CompanySavedTeamRecommendation>(e =>
            {
                e.ToTable("company_saved_team_recommendations");
                e.HasIndex(t => t.CompanyProfileId);
                e.HasIndex(t => new { t.CompanyProfileId, t.CompanyRequestId, t.TeamRecommendationId }).IsUnique();
                e.HasOne(t => t.CompanyProfile)
                 .WithMany()
                 .HasForeignKey(t => t.CompanyProfileId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(t => t.CompanyRequest)
                 .WithMany()
                 .HasForeignKey(t => t.CompanyRequestId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(t => t.TeamRecommendation)
                 .WithMany()
                 .HasForeignKey(t => t.TeamRecommendationId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(t => t.SavedByUser)
                 .WithMany()
                 .HasForeignKey(t => t.SavedByUserId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<CompanyActivityLog>(e =>
            {
                e.ToTable("company_activity_logs");
                e.HasIndex(a => new { a.CompanyProfileId, a.CreatedAt });
                e.HasOne(a => a.CompanyProfile)
                 .WithMany()
                 .HasForeignKey(a => a.CompanyProfileId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(a => a.User)
                 .WithMany()
                 .HasForeignKey(a => a.UserId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<CompanyTalentRequest>(e =>
            {
                e.ToTable("company_talent_requests");
                e.HasIndex(r => r.CompanyProfileId);
                e.HasOne(r => r.CompanyProfile)
                 .WithMany()
                 .HasForeignKey(r => r.CompanyProfileId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── COMPANY PROJECT REQUESTS (wizard) ─────────────────────────────
            modelBuilder.Entity<CompanyRequest>(e =>
            {
                e.ToTable("company_requests");
                e.HasIndex(r => r.CompanyProfileId);
                e.HasIndex(r => new { r.CompanyProfileId, r.Status });
                e.HasIndex(r => r.CompanyProfileId)
                    .HasFilter("\"status\" = 'draft'")
                    .IsUnique();
                e.Property(r => r.DurationUnit)
                    .HasConversion(
                        v => v.HasValue ? v.Value.ToString() : null,
                        v => CompanyRequestEnumConverters.TryParseDurationUnit(v));
                e.Property(r => r.CollaborationFormat)
                    .HasConversion(
                        v => v.HasValue ? CompanyRequestEnumConverters.ToWireValue(v.Value) : null,
                        v => CompanyRequestEnumConverters.TryParseCollaborationFormat(v));
                e.HasOne(r => r.CompanyProfile)
                 .WithMany()
                 .HasForeignKey(r => r.CompanyProfileId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CompanyRequestRole>(e =>
            {
                e.ToTable("company_request_roles");
                e.HasIndex(r => r.CompanyRequestId);
                e.HasOne(r => r.CompanyRequest)
                 .WithMany(req => req.Roles)
                 .HasForeignKey(r => r.CompanyRequestId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CompanyRequestSkill>(e =>
            {
                e.ToTable("company_request_skills");
                e.HasIndex(s => s.CompanyRequestRoleId);
                e.HasOne(s => s.Role)
                 .WithMany(r => r.Skills)
                 .HasForeignKey(s => s.CompanyRequestRoleId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CompanyRequestInvitation>(e =>
            {
                e.ToTable("company_request_invitations");
                e.Property(i => i.Status)
                    .HasMaxLength(24)
                    .HasDefaultValue(CompanyRequestInvitationStatus.Pending)
                    .IsRequired();
                e.Property(i => i.Message).HasMaxLength(2000);
                e.Property(i => i.Source).HasMaxLength(100);
                e.Property(i => i.MatchScore).HasPrecision(5, 2);

                e.HasIndex(i => i.CompanyRequestId);
                e.HasIndex(i => i.CompanyProfileId);
                e.HasIndex(i => i.StudentProfileId);
                e.HasIndex(i => i.InvitedByUserId);
                e.HasIndex(i => new { i.CompanyRequestId, i.StudentProfileId, i.Status });
                e.HasIndex(i => new { i.CompanyRequestId, i.StudentProfileId })
                    .HasFilter("status = 'pending'")
                    .IsUnique();

                e.HasOne(i => i.CompanyRequest)
                    .WithMany(r => r.Invitations)
                    .HasForeignKey(i => i.CompanyRequestId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(i => i.CompanyProfile)
                    .WithMany()
                    .HasForeignKey(i => i.CompanyProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(i => i.StudentProfile)
                    .WithMany()
                    .HasForeignKey(i => i.StudentProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(i => i.InvitedByUser)
                    .WithMany()
                    .HasForeignKey(i => i.InvitedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(i => i.CompanyRequestRole)
                    .WithMany(r => r.Invitations)
                    .HasForeignKey(i => i.CompanyRequestRoleId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<CompanyRequestRecommendationRun>(e =>
            {
                e.ToTable("company_request_recommendation_runs");
                e.Property(r => r.AlgorithmVersion)
                    .HasMaxLength(64)
                    .IsRequired();
                e.Property(r => r.Status)
                    .HasMaxLength(24)
                    .HasDefaultValue(CompanyRequestRecommendationRunStatus.Completed)
                    .IsRequired();
                e.Property(r => r.ErrorMessage).HasMaxLength(2000);

                e.HasIndex(r => r.CompanyRequestId);
                e.HasIndex(r => r.CompanyProfileId);
                e.HasIndex(r => new { r.CompanyRequestId, r.GeneratedAt });

                e.HasOne(r => r.CompanyRequest)
                    .WithMany(req => req.RecommendationRuns)
                    .HasForeignKey(r => r.CompanyRequestId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(r => r.CompanyProfile)
                    .WithMany()
                    .HasForeignKey(r => r.CompanyProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CompanyRequestRecommendation>(e =>
            {
                e.ToTable("company_request_recommendations");
                e.Property(r => r.ReasonSummary)
                    .HasMaxLength(2000)
                    .IsRequired();
                e.Property(r => r.Source)
                    .HasMaxLength(32)
                    .HasDefaultValue("deterministic")
                    .IsRequired();
                e.Property(r => r.ScoreBreakdownJson).HasMaxLength(4000);
                e.Property(r => r.HighlightsJson).HasMaxLength(4000);

                e.HasIndex(r => r.RunId);
                e.HasIndex(r => r.CompanyRequestId);
                e.HasIndex(r => r.StudentProfileId);
                e.HasIndex(r => new { r.RunId, r.Rank }).IsUnique();
                e.HasIndex(r => new { r.CompanyRequestId, r.StudentProfileId });

                e.HasOne(r => r.Run)
                    .WithMany(run => run.Recommendations)
                    .HasForeignKey(r => r.RunId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(r => r.CompanyRequest)
                    .WithMany(req => req.Recommendations)
                    .HasForeignKey(r => r.CompanyRequestId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(r => r.StudentProfile)
                    .WithMany()
                    .HasForeignKey(r => r.StudentProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<RecommendationSemanticEmbedding>(e =>
            {
                e.ToTable("recommendation_semantic_embeddings");
                e.Property(r => r.ScopeType)
                    .HasMaxLength(64)
                    .IsRequired();
                e.Property(r => r.EmbeddingModel)
                    .HasMaxLength(128)
                    .IsRequired();
                e.Property(r => r.ContentHash)
                    .HasMaxLength(128)
                    .IsRequired();
                e.Property(r => r.EmbeddingJson).IsRequired();
                e.HasIndex(r => new { r.ScopeType, r.ScopeId, r.EmbeddingModel }).IsUnique();
                e.HasIndex(r => new { r.ScopeType, r.UpdatedAt });
            });

            modelBuilder.Entity<CompanyRequestTeamRecommendationRun>(e =>
            {
                e.ToTable("company_request_team_recommendation_runs");
                e.Property(r => r.AlgorithmVersion).HasMaxLength(64).IsRequired();
                e.Property(r => r.Status).HasMaxLength(24).HasDefaultValue(CompanyRequestTeamRecommendationRunStatus.Completed).IsRequired();
                e.Property(r => r.ErrorMessage).HasMaxLength(2000);
                e.HasIndex(r => r.CompanyRequestId).HasDatabaseName("IX_crtr_company_request");
                e.HasIndex(r => r.CompanyProfileId).HasDatabaseName("IX_crtr_company_profile");
                e.HasIndex(r => new { r.CompanyRequestId, r.GeneratedAt }).HasDatabaseName("IX_crtr_request_generated_at");
                e.HasOne(r => r.CompanyRequest)
                    .WithMany(req => req.TeamRecommendationRuns)
                    .HasForeignKey(r => r.CompanyRequestId)
                    .HasConstraintName("FK_crtr_company_request")
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(r => r.CompanyProfile)
                    .WithMany()
                    .HasForeignKey(r => r.CompanyProfileId)
                    .HasConstraintName("FK_crtr_company_profile")
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CompanyRequestTeamRecommendation>(e =>
            {
                e.ToTable("company_request_team_recommendations");
                e.Property(t => t.SummaryReason).HasMaxLength(2000).IsRequired();
                e.Property(t => t.StrengthsJson).HasMaxLength(4000);
                e.Property(t => t.RisksJson).HasMaxLength(4000);
                e.HasIndex(t => t.RunId).HasDatabaseName("IX_crtt_run");
                e.HasIndex(t => t.CompanyRequestId).HasDatabaseName("IX_crtt_company_request");
                e.HasIndex(t => new { t.RunId, t.TeamRank }).IsUnique().HasDatabaseName("IX_crtt_run_team_rank");
                e.HasOne(t => t.Run)
                    .WithMany(r => r.Teams)
                    .HasForeignKey(t => t.RunId)
                    .HasConstraintName("FK_crtt_run")
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(t => t.CompanyRequest)
                    .WithMany(r => r.TeamRecommendations)
                    .HasForeignKey(t => t.CompanyRequestId)
                    .HasConstraintName("FK_crtt_company_request")
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CompanyRequestTeamRecommendationMember>(e =>
            {
                e.ToTable("company_request_team_recommendation_members");
                e.Property(m => m.AssignmentReason).HasMaxLength(2000).IsRequired();
                e.Property(m => m.HighlightsJson).HasMaxLength(4000);
                e.HasIndex(m => m.TeamRecommendationId).HasDatabaseName("IX_crtm_team_rec_id");
                e.HasIndex(m => m.CompanyRequestRoleId).HasDatabaseName("IX_crtm_role_id");
                e.HasIndex(m => m.StudentProfileId).HasDatabaseName("IX_crtm_student_id");
                e.HasIndex(m => new { m.TeamRecommendationId, m.CompanyRequestRoleId }).IsUnique().HasDatabaseName("IX_crtm_team_rec_role");
                e.HasOne(m => m.TeamRecommendation)
                    .WithMany(t => t.Members)
                    .HasForeignKey(m => m.TeamRecommendationId)
                    .HasConstraintName("FK_crtm_team_rec")
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(m => m.CompanyRequestRole)
                    .WithMany(r => r.TeamAssignments)
                    .HasForeignKey(m => m.CompanyRequestRoleId)
                    .HasConstraintName("FK_crtm_role")
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(m => m.StudentProfile)
                    .WithMany()
                    .HasForeignKey(m => m.StudentProfileId)
                    .HasConstraintName("FK_crtm_student")
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ── STUDENT ASSOCIATION PROFILE ────────────────────────────────────
            modelBuilder.Entity<StudentAssociationProfile>(e =>
            {
                e.ToTable("student_association_profiles");
                e.HasIndex(a => a.Username).IsUnique();
                e.HasOne(a => a.User)
                 .WithOne(u => u.StudentAssociationProfile)
                 .HasForeignKey<StudentAssociationProfile>(a => a.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<StudentOrganizationEvent>(e =>
            {
                e.ToTable("student_organization_events");
                e.HasOne(ev => ev.OrganizationProfile)
                 .WithMany(p => p.Events)
                 .HasForeignKey(ev => ev.OrganizationProfileId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(ev => ev.OrganizationProfileId);
                e.HasIndex(ev => new { ev.OrganizationProfileId, ev.IsPublished });
            });

            modelBuilder.Entity<StudentOrganizationEventRegistrationForm>(e =>
            {
                e.ToTable("student_organization_event_registration_forms");
                e.HasOne(f => f.Event)
                 .WithOne(ev => ev.RegistrationForm)
                 .HasForeignKey<StudentOrganizationEventRegistrationForm>(f => f.EventId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(f => f.EventId).IsUnique();
            });

            modelBuilder.Entity<StudentOrganizationEventRegistrationField>(e =>
            {
                e.ToTable("student_organization_event_registration_fields");
                e.HasOne(f => f.Form)
                 .WithMany(form => form.Fields)
                 .HasForeignKey(f => f.FormId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(f => f.FormId);
                e.HasIndex(f => new { f.FormId, f.DisplayOrder });
            });

            modelBuilder.Entity<StudentOrganizationEventRegistration>(e =>
            {
                e.ToTable("student_organization_event_registrations");
                e.HasIndex(r => new { r.EventId, r.StudentProfileId }).IsUnique();
                e.HasIndex(r => r.OrganizationProfileId);
                e.HasIndex(r => new { r.EventId, r.SubmittedAt });
                e.HasOne(r => r.Event)
                    .WithMany()
                    .HasForeignKey(r => r.EventId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(r => r.StudentProfile)
                    .WithMany()
                    .HasForeignKey(r => r.StudentProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(r => r.OrganizationProfile)
                    .WithMany()
                    .HasForeignKey(r => r.OrganizationProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<StudentOrganizationEventRegistrationAnswer>(e =>
            {
                e.ToTable("student_organization_event_registration_answers");
                e.HasIndex(a => new { a.RegistrationId, a.FieldId }).IsUnique();
                e.HasOne(a => a.Registration)
                    .WithMany(r => r.Answers)
                    .HasForeignKey(a => a.RegistrationId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(a => a.Field)
                    .WithMany()
                    .HasForeignKey(a => a.FieldId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<StudentOrganizationTeamMember>(e =>
            {
                e.ToTable("student_organization_team_members");
                e.HasOne(m => m.OrganizationProfile)
                 .WithMany(p => p.TeamMembers)
                 .HasForeignKey(m => m.OrganizationProfileId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(m => m.StudentProfile)
                    .WithMany()
                    .HasForeignKey(m => m.StudentProfileId)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasOne(m => m.SourceApplication)
                    .WithMany()
                    .HasForeignKey(m => m.SourceApplicationId)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasIndex(m => m.OrganizationProfileId);
                e.HasIndex(m => new { m.OrganizationProfileId, m.StudentProfileId })
                    .IsUnique()
                    .HasFilter("student_profile_id IS NOT NULL");
            });

            modelBuilder.Entity<StudentOrganizationRecruitmentCampaign>(e =>
            {
                e.ToTable("student_organization_recruitment_campaigns");
                e.HasOne(c => c.OrganizationProfile)
                 .WithMany(p => p.RecruitmentCampaigns)
                 .HasForeignKey(c => c.OrganizationProfileId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(c => c.OrganizationProfileId);
                e.HasIndex(c => new { c.OrganizationProfileId, c.IsPublished });
            });

            modelBuilder.Entity<StudentOrganizationRecruitmentPosition>(e =>
            {
                e.ToTable("student_organization_recruitment_positions");
                e.HasOne(p => p.Campaign)
                 .WithMany(c => c.Positions)
                 .HasForeignKey(p => p.CampaignId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(p => p.CampaignId);
                e.HasIndex(p => new { p.CampaignId, p.DisplayOrder });
            });

            modelBuilder.Entity<StudentOrganizationRecruitmentQuestion>(e =>
            {
                e.ToTable("student_organization_recruitment_questions");
                e.HasOne(q => q.Campaign)
                 .WithMany(c => c.Questions)
                 .HasForeignKey(q => q.CampaignId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(q => q.Position)
                 .WithMany(p => p.Questions)
                 .HasForeignKey(q => q.PositionId)
                 .OnDelete(DeleteBehavior.SetNull);
                e.HasIndex(q => q.CampaignId);
                e.HasIndex(q => q.PositionId);
                e.HasIndex(q => new { q.CampaignId, q.DisplayOrder });
                e.HasIndex(q => new { q.CampaignId, q.PositionId, q.DisplayOrder });
            });

            modelBuilder.Entity<StudentOrganizationRecruitmentApplication>(e =>
            {
                e.ToTable("student_organization_recruitment_applications");
                e.HasIndex(a => new { a.StudentProfileId, a.PositionId }).IsUnique();
                e.HasIndex(a => a.CampaignId);
                e.HasIndex(a => new { a.OrganizationProfileId, a.CampaignId, a.Status });
                e.HasOne(a => a.StudentProfile)
                    .WithMany()
                    .HasForeignKey(a => a.StudentProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(a => a.OrganizationProfile)
                    .WithMany()
                    .HasForeignKey(a => a.OrganizationProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(a => a.Campaign)
                    .WithMany()
                    .HasForeignKey(a => a.CampaignId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(a => a.Position)
                    .WithMany()
                    .HasForeignKey(a => a.PositionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<StudentOrganizationRecruitmentApplicationAnswer>(e =>
            {
                e.ToTable("student_organization_recruitment_application_answers");
                e.HasIndex(a => new { a.ApplicationId, a.QuestionId }).IsUnique();
                e.HasOne(a => a.Application)
                    .WithMany(app => app.Answers)
                    .HasForeignKey(a => a.ApplicationId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(a => a.Question)
                    .WithMany()
                    .HasForeignKey(a => a.QuestionId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<StudentOrganizationRecruitmentApplicantAnalysis>(e =>
            {
                e.ToTable("student_organization_recruitment_applicant_analyses");
                e.HasIndex(a => a.PositionId);
                e.HasIndex(a => new { a.PositionId, a.CreatedAtUtc });
                e.HasOne(a => a.Position)
                    .WithMany()
                    .HasForeignKey(a => a.PositionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<StudentOrganizationMember>(e =>
            {
                e.ToTable("student_organization_members");
                e.HasIndex(m => new { m.OrganizationProfileId, m.StudentProfileId }).IsUnique();
                e.HasIndex(m => m.SourceApplicationId);
                e.HasIndex(m => new { m.OrganizationProfileId, m.MembershipKind });
                e.HasOne(m => m.OrganizationProfile)
                    .WithMany()
                    .HasForeignKey(m => m.OrganizationProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(m => m.StudentProfile)
                    .WithMany()
                    .HasForeignKey(m => m.StudentProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(m => m.SourceApplication)
                    .WithMany()
                    .HasForeignKey(m => m.SourceApplicationId)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasOne(m => m.TeamMember)
                    .WithMany()
                    .HasForeignKey(m => m.TeamMemberId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<OrganizationFollow>(e =>
            {
                e.ToTable("organization_follows");
                e.HasIndex(f => new { f.OrganizationProfileId, f.StudentProfileId }).IsUnique();
                e.HasOne(f => f.OrganizationProfile)
                    .WithMany(p => p.Followers)
                    .HasForeignKey(f => f.OrganizationProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(f => f.StudentProfile)
                    .WithMany(s => s.OrganizationFollows)
                    .HasForeignKey(f => f.StudentProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CompanyFollow>(e =>
            {
                e.ToTable("company_follows");
                e.HasIndex(f => new { f.CompanyProfileId, f.StudentProfileId }).IsUnique();
                e.HasOne(f => f.CompanyProfile)
                    .WithMany()
                    .HasForeignKey(f => f.CompanyProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(f => f.StudentProfile)
                    .WithMany(s => s.CompanyFollows)
                    .HasForeignKey(f => f.StudentProfileId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<FeedPostEngagement>(e =>
            {
                e.ToTable("feed_post_engagements");
                e.HasIndex(x => new { x.UserId, x.PostKey, x.EngagementType }).IsUnique();
                e.HasIndex(x => x.PostKey);
                e.HasOne(x => x.User)
                    .WithMany()
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<FeedPostComment>(e =>
            {
                e.ToTable("feed_post_comments");
                e.HasIndex(x => x.PostKey);
                e.HasOne(x => x.User)
                    .WithMany()
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<StudentPost>(e =>
            {
                e.ToTable("student_posts");
                e.HasIndex(x => x.UserId);
                e.HasIndex(x => x.CreatedAt);
                e.HasOne(x => x.User)
                    .WithMany()
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<DoctorPost>(e =>
            {
                e.ToTable("doctor_posts");
                e.HasIndex(x => x.UserId);
                e.HasIndex(x => x.CreatedAt);
                e.HasOne(x => x.User)
                    .WithMany()
                    .HasForeignKey(x => x.UserId)
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
                e.HasIndex(p => p.OwnerId).IsUnique();
                e.HasOne(p => p.Owner)
                 .WithMany()
                 .HasForeignKey(p => p.OwnerId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(p => p.Supervisor)
                 .WithMany()
                 .HasForeignKey(p => p.SupervisorId)
                 .IsRequired(false)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            // ── STUDENT PROJECT MEMBERS ──────────────────────────────────────
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

            modelBuilder.Entity<GraduationProjectDraft>(e =>
            {
                e.HasKey(d => d.UserId);
                e.ToTable("graduation_project_drafts");
                e.HasOne(d => d.User)
                 .WithMany()
                 .HasForeignKey(d => d.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<StudentAccountSettings>(e =>
            {
                e.HasKey(s => s.UserId);
                e.ToTable("student_account_settings");
                e.HasOne(s => s.User)
                 .WithMany()
                 .HasForeignKey(s => s.UserId)
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

            // ── COURSES ───────────────────────────────────────────────────────
            modelBuilder.Entity<Course>(e =>
            {
                e.ToTable("courses");
                e.HasKey(c => c.Id);
                e.Property(c => c.Name).IsRequired().HasMaxLength(200);
                e.Property(c => c.Code).IsRequired().HasMaxLength(50);
                e.Property(c => c.Semester).HasMaxLength(100);
                e.HasIndex(c => c.DoctorId)
                 .HasDatabaseName("ix_courses_doctor");
                e.HasOne(c => c.Doctor)
                 .WithMany()
                 .HasForeignKey(c => c.DoctorId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── COURSE SECTIONS ───────────────────────────────────────────────
            modelBuilder.Entity<CourseSection>(e =>
            {
                e.ToTable("course_sections");
                e.HasKey(s => s.Id);
                e.Property(s => s.Name).IsRequired().HasMaxLength(200);
                e.Property(s => s.Days).IsRequired().HasDefaultValue("[]");
                e.Property(s => s.TimeFrom).HasMaxLength(5);
                e.Property(s => s.TimeTo).HasMaxLength(5);
                e.HasIndex(s => s.CourseId)
                 .HasDatabaseName("ix_course_sections_course");
                e.HasOne(s => s.Course)
                 .WithMany()
                 .HasForeignKey(s => s.CourseId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── SECTION ENROLLMENTS ───────────────────────────────────────────
            modelBuilder.Entity<SectionEnrollment>(e =>
            {
                e.ToTable("section_enrollments");
                e.HasKey(en => en.Id);

                // A student can only be enrolled once per section
                e.HasIndex(en => new { en.CourseSectionId, en.StudentProfileId })
                 .IsUnique()
                 .HasDatabaseName("ix_section_enrollments_section_student");

                e.HasOne(en => en.Section)
                 .WithMany()
                 .HasForeignKey(en => en.CourseSectionId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(en => en.Student)
                 .WithMany()
                 .HasForeignKey(en => en.StudentProfileId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── COURSE PROJECTS ───────────────────────────────────────────────
            modelBuilder.Entity<CourseProject>(e =>
            {
                e.ToTable("course_projects");
                e.HasKey(p => p.Id);
                e.Property(p => p.Title).IsRequired().HasMaxLength(300);
                e.Property(p => p.Description).HasMaxLength(2000);
                e.Property(p => p.TeamSize).IsRequired().HasDefaultValue(4);
                e.Property(p => p.ApplyToAllSections).IsRequired().HasDefaultValue(false);
                e.Property(p => p.AllowCrossSectionTeams).IsRequired().HasDefaultValue(false);
                e.Property(p => p.AiMode).IsRequired().HasMaxLength(20).HasDefaultValue("doctor");
                e.Property(p => p.CreatedAt).IsRequired();
                e.HasIndex(p => p.CourseId).HasDatabaseName("ix_course_projects_course");
                e.HasOne(p => p.Course)
                 .WithMany()
                 .HasForeignKey(p => p.CourseId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── COURSE PROJECT SECTIONS ───────────────────────────────────────
            modelBuilder.Entity<CourseProjectSection>(e =>
            {
                e.ToTable("course_project_sections");
                e.HasKey(s => s.Id);
                e.HasIndex(s => new { s.CourseProjectId, s.CourseSectionId })
                 .IsUnique()
                 .HasDatabaseName("ix_course_project_sections_project_section");
                e.HasOne(s => s.Project)
                 .WithMany(p => p.Sections)
                 .HasForeignKey(s => s.CourseProjectId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(s => s.Section)
                 .WithMany()
                 .HasForeignKey(s => s.CourseSectionId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── COURSE TEAMS ──────────────────────────────────────────────────────
            modelBuilder.Entity<CourseTeam>(e =>
            {
                e.ToTable("course_teams");
                e.HasKey(t => t.Id);
                e.Property(t => t.CreatedAt).IsRequired();
                e.HasIndex(t => new { t.CourseProjectId, t.TeamIndex })
                 .IsUnique()
                 .HasDatabaseName("ix_course_teams_project_index");
                e.HasOne(t => t.Project)
                 .WithMany()
                 .HasForeignKey(t => t.CourseProjectId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── COURSE TEAM MEMBERS ────────────────────────────────────────────
            modelBuilder.Entity<CourseTeamMember>(e =>
            {
                e.ToTable("course_team_members");
                e.HasKey(m => m.Id);
                e.Property(m => m.UserId).IsRequired();
                e.Property(m => m.MatchScore).IsRequired();
                e.HasIndex(m => new { m.CourseTeamId, m.StudentProfileId })
                 .IsUnique()
                 .HasDatabaseName("ix_course_team_members_team_student");
                e.HasOne(m => m.Team)
                 .WithMany(t => t.Members)
                 .HasForeignKey(m => m.CourseTeamId)
                 .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(m => m.Student)
                 .WithMany()
                 .HasForeignKey(m => m.StudentProfileId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── COURSE TEAM MESSAGES ──────────────────────────────────────────────
            modelBuilder.Entity<CourseTeamMessage>(e =>
            {
                e.ToTable("course_team_messages");
                e.HasKey(m => m.Id);
                e.Property(m => m.Text).IsRequired().HasMaxLength(2000);

                e.HasIndex(m => m.CourseTeamId)
                 .HasDatabaseName("ix_course_team_messages_team");

                e.HasOne(m => m.Team)
                 .WithMany()
                 .HasForeignKey(m => m.CourseTeamId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(m => m.Sender)
                 .WithMany()
                 .HasForeignKey(m => m.SenderUserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── PRIVATE CONVERSATIONS ─────────────────────────────────────────────
            modelBuilder.Entity<Conversation>(e =>
            {
                e.ToTable("conversations");
                e.HasKey(c => c.Id);
                e.Property(c => c.Title).HasMaxLength(256);
                e.Property(c => c.CreatedAt).IsRequired();
                e.HasIndex(c => c.CourseTeamId)
                 .IsUnique()
                 .HasDatabaseName("ix_conversations_course_team")
                 .HasFilter("\"CourseTeamId\" IS NOT NULL");
                e.HasOne(c => c.CourseTeam)
                 .WithMany()
                 .HasForeignKey(c => c.CourseTeamId)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<ConversationUser>(e =>
            {
                e.ToTable("conversation_users");
                e.HasKey(cu => cu.Id);

                e.HasIndex(cu => new { cu.ConversationId, cu.UserId })
                 .IsUnique()
                 .HasDatabaseName("ix_conversation_users_conversation_user");

                e.HasIndex(cu => cu.UserId)
                 .HasDatabaseName("ix_conversation_users_user");

                e.HasOne(cu => cu.Conversation)
                 .WithMany(c => c.ConversationUsers)
                 .HasForeignKey(cu => cu.ConversationId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(cu => cu.User)
                 .WithMany()
                 .HasForeignKey(cu => cu.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Message>(e =>
            {
                e.ToTable("messages");
                e.HasKey(m => m.Id);
                e.Property(m => m.Text).IsRequired().HasMaxLength(2000);
                e.Property(m => m.CreatedAt).IsRequired();
                e.Property(m => m.Edited).HasDefaultValue(false);
                e.Property(m => m.Deleted).HasDefaultValue(false);
                e.Property(m => m.Seen).HasDefaultValue(false);

                e.HasIndex(m => new { m.ConversationId, m.CreatedAt })
                 .HasDatabaseName("ix_messages_conversation_created_at");

                e.HasOne(m => m.Conversation)
                 .WithMany(c => c.Messages)
                 .HasForeignKey(m => m.ConversationId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(m => m.Sender)
                 .WithMany()
                 .HasForeignKey(m => m.SenderId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── SECTION CHAT MESSAGES ─────────────────────────────────────────────
            modelBuilder.Entity<SectionChatMessage>(e =>
            {
                e.ToTable("section_chat_messages");
                e.HasKey(m => m.Id);
                e.Property(m => m.Text).IsRequired().HasMaxLength(2000);

                e.HasIndex(m => m.CourseSectionId)
                 .HasDatabaseName("ix_section_chat_messages_section");

                e.HasOne(m => m.Section)
                 .WithMany()
                 .HasForeignKey(m => m.CourseSectionId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(m => m.Sender)
                 .WithMany()
                 .HasForeignKey(m => m.SenderUserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // ── USER NOTIFICATIONS (graduation project + future categories) ─────
            modelBuilder.Entity<UserNotification>(e =>
            {
                e.ToTable("user_notifications");
                e.Property(n => n.Category)
                 .HasMaxLength(64)
                 .IsRequired();
                e.Property(n => n.EventType)
                 .HasMaxLength(64)
                 .IsRequired();
                e.Property(n => n.Title)
                 .HasMaxLength(256)
                 .IsRequired();
                e.Property(n => n.Body)
                 .HasMaxLength(2000)
                 .IsRequired();
                e.Property(n => n.DedupKey)
                 .HasMaxLength(128);
                e.HasIndex(n => new { n.UserId, n.DedupKey })
                 .IsUnique()
                 .HasDatabaseName("ix_user_notifications_user_dedup")
                 .HasFilter("dedup_key IS NOT NULL");
                e.HasIndex(n => new { n.UserId, n.CreatedAt })
                 .HasDatabaseName("ix_user_notifications_user_created");
                e.HasOne(n => n.User)
                 .WithMany()
                 .HasForeignKey(n => n.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

        }
    }
}