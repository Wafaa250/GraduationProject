using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;

namespace GraduationProject.API.Data.Seeding.Phases
{
    internal static class SocialSeedPhase
    {
        public static async Task RunAsync(ApplicationDbContext db, SeedContext ctx)
        {
            await SeedPostsAsync(db, ctx);
            await SeedFeedEngagementAsync(db, ctx);
            await SeedDirectMessagesAsync(db, ctx);
            await SeedNotificationsAsync(db, ctx);
            await SeedSemanticEmbeddingsAsync(db, ctx);
            await SeedPasswordResetsAsync(db, ctx);
            await SeedSupervisorCancellationsAsync(db, ctx);
        }

        private static async Task SeedPasswordResetsAsync(ApplicationDbContext db, SeedContext ctx)
        {
            foreach (var student in ctx.PickMany(ctx.Students, 3))
            {
                db.PasswordResetCodes.Add(new PasswordResetCode
                {
                    UserId = student.UserId,
                    Email = ctx.GetUser(student.UserId).Email,
                    CodeHash = SeedHelpers.HashPassword("847291"),
                    ExpiresAt = ctx.DaysFromNow(1),
                    IsUsed = false,
                    CreatedAt = ctx.HoursAgo(2),
                });
                ctx.Increment("password_reset_codes");
            }

            foreach (var user in ctx.PickMany(ctx.Users.Where(u => u.Role == UserRoles.Company).ToList(), 2))
            {
                db.PasswordResetTokens.Add(new PasswordResetToken
                {
                    UserId = user.Id,
                    TokenHash = SeedHelpers.HashPassword(Guid.NewGuid().ToString()),
                    ExpiresAt = ctx.DaysFromNow(1),
                    CreatedAt = ctx.HoursAgo(1),
                });
                ctx.Increment("password_reset_tokens");
            }

            await db.SaveChangesAsync();
        }

        private static async Task SeedSupervisorCancellationsAsync(ApplicationDbContext db, SeedContext ctx)
        {
            foreach (var project in ctx.GraduationProjects.Where(p => p.SupervisorId != null).Take(3))
            {
                var owner = ctx.Students.First(s => s.Id == project.OwnerId);
                db.SupervisorCancellationRequests.Add(new SupervisorCancellationRequest
                {
                    ProjectId = project.Id,
                    DoctorId = project.SupervisorId!.Value,
                    SenderId = owner.Id,
                    Status = "pending",
                    CreatedAt = ctx.DaysAgo(4),
                });
                ctx.Increment("supervisor_cancellation_requests");
            }

            await db.SaveChangesAsync();
        }

        private static async Task SeedPostsAsync(ApplicationDbContext db, SeedContext ctx)
        {
            foreach (var student in ctx.PickMany(ctx.Students, 30))
            {
                var post = new StudentPost
                {
                    UserId = student.UserId,
                    Content = ctx.Pick(SeedCatalog.StudentPostTemplates),
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(1, 45)),
                    UpdatedAt = ctx.DaysAgo(ctx.Rng.Next(0, 5)),
                };
                db.StudentPosts.Add(post);
                await db.SaveChangesAsync();
                ctx.Increment("student_posts");

                var postKey = FeedPostKeyHelper.Build(FeedPostSourceTypes.StudentPost, post.Id);
                SeedEngagementForPost(db, ctx, postKey, student.UserId);
            }

            foreach (var doctor in ctx.Doctors)
            {
                var post = new DoctorPost
                {
                    UserId = doctor.UserId,
                    Content = ctx.Pick(SeedCatalog.DoctorPostTemplates),
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(1, 60)),
                    UpdatedAt = ctx.DaysAgo(ctx.Rng.Next(0, 10)),
                };
                db.DoctorPosts.Add(post);
                await db.SaveChangesAsync();
                ctx.Increment("doctor_posts");

                var postKey = FeedPostKeyHelper.Build(FeedPostSourceTypes.DoctorPost, post.Id);
                SeedEngagementForPost(db, ctx, postKey, doctor.UserId);
            }

            foreach (var request in ctx.CompanyRequests.Where(r => r.IsPublishedToHub).Take(20))
            {
                var postKey = FeedPostKeyHelper.Build(FeedPostSourceTypes.CompanyOpportunity, request.Id);
                var company = ctx.Companies.First(c => c.Id == request.CompanyProfileId);
                SeedEngagementForPost(db, ctx, postKey, company.UserId);
            }

            foreach (var ev in ctx.Events.Where(e => e.IsPublished).Take(25))
            {
                var postKey = FeedPostKeyHelper.Build(FeedPostSourceTypes.AssociationEvent, ev.Id);
                var org = ctx.Associations.First(a => a.Id == ev.OrganizationProfileId);
                SeedEngagementForPost(db, ctx, postKey, org.UserId);
            }

            await db.SaveChangesAsync();
        }

        private static void SeedEngagementForPost(ApplicationDbContext db, SeedContext ctx, string postKey, int authorUserId)
        {
            var reactors = ctx.PickMany(ctx.Users.Where(u => u.Id != authorUserId).ToList(), ctx.Rng.Next(3, 8)).ToList();
            foreach (var user in reactors)
            {
                db.FeedPostEngagements.Add(new FeedPostEngagement
                {
                    UserId = user.Id,
                    PostKey = postKey,
                    EngagementType = FeedEngagementTypes.Like,
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(0, 20)),
                });
                ctx.Increment("feed_post_engagements");

                if (ctx.Rng.Next(3) == 0)
                {
                    db.FeedPostEngagements.Add(new FeedPostEngagement
                    {
                        UserId = user.Id,
                        PostKey = postKey,
                        EngagementType = FeedEngagementTypes.Save,
                        CreatedAt = ctx.DaysAgo(ctx.Rng.Next(0, 15)),
                    });
                    ctx.Increment("feed_post_engagements");
                }

                if (ctx.Rng.Next(2) == 0)
                {
                    db.FeedPostComments.Add(new FeedPostComment
                    {
                        UserId = user.Id,
                        PostKey = postKey,
                        Content = ctx.Pick(new[]
                        {
                            "This looks like a great opportunity — thanks for sharing.",
                            "Interested! Will reach out this week.",
                            "Exactly what our team was looking for.",
                            "Appreciate the detailed description.",
                        }),
                        CreatedAt = ctx.DaysAgo(ctx.Rng.Next(0, 10)),
                    });
                    ctx.Increment("feed_post_comments");
                }
            }
        }

        private static async Task SeedFeedEngagementAsync(ApplicationDbContext db, SeedContext ctx)
        {
            await db.SaveChangesAsync();
        }

        private static async Task SeedDirectMessagesAsync(ApplicationDbContext db, SeedContext ctx)
        {
            var studentUsers = ctx.Students.Select(s => ctx.GetUser(s.UserId)).ToList();
            var doctorUsers = ctx.Doctors.Select(d => ctx.GetUser(d.UserId)).ToList();
            var companyUsers = ctx.Companies.Select(c => ctx.GetUser(c.UserId)).ToList();
            var associationUsers = ctx.Associations.Select(a => ctx.GetUser(a.UserId)).ToList();

            var pairs = new List<(User A, User B, string Title)>();
            for (var i = 0; i < 15; i++)
                pairs.Add((ctx.Pick(studentUsers), ctx.Pick(studentUsers), "Project collaboration"));
            for (var i = 0; i < 10; i++)
                pairs.Add((ctx.Pick(studentUsers), ctx.Pick(doctorUsers), "Supervision discussion"));
            for (var i = 0; i < 8; i++)
                pairs.Add((ctx.Pick(studentUsers), ctx.Pick(companyUsers), "Opportunity inquiry"));
            for (var i = 0; i < 8; i++)
                pairs.Add((ctx.Pick(studentUsers), ctx.Pick(associationUsers), "Association membership"));

            foreach (var (a, b, title) in pairs.Where(p => p.A.Id != p.B.Id).DistinctBy(p => p.A.Id < p.B.Id ? (p.A.Id, p.B.Id) : (p.B.Id, p.A.Id)))
            {
                var conversation = new Conversation
                {
                    Title = title,
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(5, 60)),
                };
                db.Conversations.Add(conversation);
                await db.SaveChangesAsync();
                ctx.Conversations.Add(conversation);
                ctx.Increment("conversations");

                db.ConversationUsers.Add(new ConversationUser { ConversationId = conversation.Id, UserId = a.Id });
                db.ConversationUsers.Add(new ConversationUser { ConversationId = conversation.Id, UserId = b.Id });
                ctx.Increment("conversation_users", 2);

                for (var m = 0; m < ctx.Rng.Next(4, 10); m++)
                {
                    var sender = m % 2 == 0 ? a : b;
                    db.Messages.Add(new Message
                    {
                        ConversationId = conversation.Id,
                        SenderId = sender.Id,
                        Text = ctx.Pick(SeedCatalog.MessageTemplates),
                        CreatedAt = conversation.CreatedAt.AddHours(m * 8 + ctx.Rng.Next(1, 4)),
                        Seen = m < 5,
                    });
                    ctx.Increment("messages");
                }
            }

            await db.SaveChangesAsync();
        }

        private static async Task SeedNotificationsAsync(ApplicationDbContext db, SeedContext ctx)
        {
            foreach (var project in ctx.GraduationProjects.Take(15))
            {
                var owner = ctx.Students.First(s => s.Id == project.OwnerId);
                db.UserNotifications.Add(new UserNotification
                {
                    UserId = owner.UserId,
                    Category = "graduation_project",
                    EventType = "project_updated",
                    ProjectId = project.Id,
                    Title = "Project updated",
                    Body = $"Your project \"{project.Name}\" was updated with new team details.",
                    DedupKey = $"gp:update:{project.Id}:{owner.UserId}",
                    CreatedAt = project.UpdatedAt,
                });
                ctx.Increment("user_notifications");
            }

            foreach (var request in ctx.CompanyRequests.Where(r => r.Status == CompanyRequestStatus.Submitted).Take(10))
            {
                var company = ctx.Companies.First(c => c.Id == request.CompanyProfileId);
                db.UserNotifications.Add(new UserNotification
                {
                    UserId = company.UserId,
                    Category = "company",
                    EventType = "company_ai_recommendations_ready",
                    Title = "AI recommendations ready",
                    Body = $"New student recommendations are available for \"{request.Title}\".",
                    DedupKey = $"company:recs:{request.Id}",
                    CreatedAt = request.SubmittedAt ?? ctx.DaysAgo(3),
                });
                ctx.Increment("user_notifications");
            }

            foreach (var student in ctx.PickMany(ctx.Students, 20))
            {
                db.UserNotifications.Add(new UserNotification
                {
                    UserId = student.UserId,
                    Category = "chat",
                    EventType = "direct_message",
                    Title = "New message",
                    Body = "You have a new direct message waiting in your inbox.",
                    DedupKey = $"chat:dm:{student.UserId}:{ctx.Rng.Next(1000, 9999)}",
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(0, 14)),
                    ReadAt = ctx.Rng.Next(2) == 0 ? ctx.DaysAgo(ctx.Rng.Next(0, 3)) : null,
                });
                ctx.Increment("user_notifications");
            }

            await db.SaveChangesAsync();
        }

        private static async Task SeedSemanticEmbeddingsAsync(ApplicationDbContext db, SeedContext ctx)
        {
            foreach (var request in ctx.CompanyRequests.Where(r => r.Status == CompanyRequestStatus.Submitted).Take(10))
            {
                db.RecommendationSemanticEmbeddings.Add(new RecommendationSemanticEmbedding
                {
                    ScopeType = "company_request",
                    ScopeId = request.Id,
                    EmbeddingModel = "text-embedding-3-small",
                    ContentHash = $"seed-{request.Id}",
                    EmbeddingJson = "[0.12,0.08,0.31,0.44,0.19]",
                    UpdatedAt = request.UpdatedAt,
                });
                ctx.Increment("recommendation_semantic_embeddings");
            }

            await db.SaveChangesAsync();
        }
    }
}
