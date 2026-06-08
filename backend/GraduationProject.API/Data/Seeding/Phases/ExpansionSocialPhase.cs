using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;

namespace GraduationProject.API.Data.Seeding.Phases
{
    internal static class ExpansionSocialPhase
    {
        public static async Task RunAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            await AddPostsAsync(db, ctx);
            await AddDirectMessagesAsync(db, ctx);
            await AddNotificationsAsync(db, ctx);
            await AddPasswordResetsAsync(db, ctx);
        }

        private static async Task AddPostsAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            var studentTarget = ExpansionCatalog.TargetStudentPosts;
            var doctorTarget = ExpansionCatalog.TargetDoctorPosts;

            var studentTemplates = SeedCatalog.StudentPostTemplates
                .Concat(ExpansionCatalog.ExtraStudentPostTemplates).ToArray();
            var doctorTemplates = SeedCatalog.DoctorPostTemplates
                .Concat(ExpansionCatalog.ExtraDoctorPostTemplates).ToArray();

            for (var i = 0; i < studentTarget; i++)
            {
                var student = ctx.Students[i % ctx.Students.Count];
                var post = new StudentPost
                {
                    UserId = student.UserId,
                    Content = studentTemplates[i % studentTemplates.Length],
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(1, 400)),
                    UpdatedAt = ctx.DaysAgo(ctx.Rng.Next(0, 30)),
                };
                db.StudentPosts.Add(post);
                await db.SaveChangesAsync();
                ctx.Increment("student_posts");

                var postKey = FeedPostKeyHelper.Build(FeedPostSourceTypes.StudentPost, post.Id);
                AddEngagement(db, ctx, postKey, student.UserId);
            }

            for (var i = 0; i < doctorTarget; i++)
            {
                var doctor = ctx.Doctors[i % ctx.Doctors.Count];
                var post = new DoctorPost
                {
                    UserId = doctor.UserId,
                    Content = doctorTemplates[i % doctorTemplates.Length],
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(1, 500)),
                    UpdatedAt = ctx.DaysAgo(ctx.Rng.Next(0, 40)),
                };
                db.DoctorPosts.Add(post);
                await db.SaveChangesAsync();
                ctx.Increment("doctor_posts");

                var postKey = FeedPostKeyHelper.Build(FeedPostSourceTypes.DoctorPost, post.Id);
                AddEngagement(db, ctx, postKey, doctor.UserId);
            }

            foreach (var request in ctx.CompanyRequests.Where(r => r.IsPublishedToHub).Take(40))
            {
                var postKey = FeedPostKeyHelper.Build(FeedPostSourceTypes.CompanyOpportunity, request.Id);
                var company = ctx.Companies.First(c => c.Id == request.CompanyProfileId);
                AddEngagement(db, ctx, postKey, company.UserId);
            }

            foreach (var ev in ctx.Events.Where(e => e.IsPublished).Take(60))
            {
                var postKey = FeedPostKeyHelper.Build(FeedPostSourceTypes.AssociationEvent, ev.Id);
                var org = ctx.Associations.First(a => a.Id == ev.OrganizationProfileId);
                AddEngagement(db, ctx, postKey, org.UserId);
            }

            await db.SaveChangesAsync();
        }

        private static void AddEngagement(ApplicationDbContext db, ExpansionContext ctx, string postKey, int authorUserId)
        {
            foreach (var user in ctx.PickMany(ctx.UserById.Values.Where(u => u.Id != authorUserId).ToList(), ctx.Rng.Next(2, 6)))
            {
                if (ctx.ExistingFeedEngagements.Add((user.Id, postKey, FeedEngagementTypes.Like)))
                {
                    db.FeedPostEngagements.Add(new FeedPostEngagement
                    {
                        UserId = user.Id,
                        PostKey = postKey,
                        EngagementType = FeedEngagementTypes.Like,
                        CreatedAt = ctx.DaysAgo(ctx.Rng.Next(0, 60)),
                    });
                    ctx.Increment("feed_post_engagements");
                }

                if (ctx.Rng.Next(3) == 0 && ctx.ExistingFeedEngagements.Add((user.Id, postKey, FeedEngagementTypes.Save)))
                {
                    db.FeedPostEngagements.Add(new FeedPostEngagement
                    {
                        UserId = user.Id,
                        PostKey = postKey,
                        EngagementType = FeedEngagementTypes.Save,
                        CreatedAt = ctx.DaysAgo(ctx.Rng.Next(0, 45)),
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
                            "Great update — this is exactly the kind of collaboration we need on campus.",
                            "Thanks for sharing, I sent this to my project team.",
                            "Interested to learn more about the tech stack you used here.",
                            "Appreciate the transparency on progress and next milestones.",
                        }),
                        CreatedAt = ctx.DaysAgo(ctx.Rng.Next(0, 30)),
                    });
                    ctx.Increment("feed_post_comments");
                }
            }
        }

        private static async Task AddDirectMessagesAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            var studentUsers = ctx.Students.Select(s => ctx.GetUser(s.UserId)).ToList();
            var doctorUsers = ctx.Doctors.Select(d => ctx.GetUser(d.UserId)).ToList();
            var companyUsers = ctx.Companies.Select(c => ctx.GetUser(c.UserId)).ToList();
            var associationUsers = ctx.Associations.Select(a => ctx.GetUser(a.UserId)).ToList();
            var templates = ExpansionCatalog.ExtraMessageTemplates
                .Concat(SeedCatalog.MessageTemplates).ToArray();

            var pairs = new List<(User A, User B)>();
            for (var i = 0; i < ExpansionCatalog.TargetConversations / 4; i++)
                pairs.Add((ctx.Pick(studentUsers), ctx.Pick(studentUsers)));
            for (var i = 0; i < ExpansionCatalog.TargetConversations / 4; i++)
                pairs.Add((ctx.Pick(studentUsers), ctx.Pick(doctorUsers)));
            for (var i = 0; i < ExpansionCatalog.TargetConversations / 4; i++)
                pairs.Add((ctx.Pick(studentUsers), ctx.Pick(companyUsers)));
            for (var i = 0; i < ExpansionCatalog.TargetConversations / 4; i++)
                pairs.Add((ctx.Pick(studentUsers), ctx.Pick(associationUsers)));

            var messagesPerConvo = ExpansionCatalog.TargetMessages / Math.Max(1, pairs.Count);
            var seen = new HashSet<(int, int)>();

            foreach (var (a, b) in pairs)
            {
                if (a.Id == b.Id) continue;
                var key = a.Id < b.Id ? (a.Id, b.Id) : (b.Id, a.Id);
                if (!seen.Add(key)) continue;

                var conversation = new Conversation
                {
                    Title = null,
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(10, 400)),
                };
                db.Conversations.Add(conversation);
                await db.SaveChangesAsync();
                ctx.Increment("conversations");

                db.ConversationUsers.Add(new ConversationUser { ConversationId = conversation.Id, UserId = a.Id });
                db.ConversationUsers.Add(new ConversationUser { ConversationId = conversation.Id, UserId = b.Id });
                ctx.Increment("conversation_users", 2);

                for (var m = 0; m < messagesPerConvo; m++)
                {
                    var sender = m % 2 == 0 ? a : b;
                    db.Messages.Add(new Message
                    {
                        ConversationId = conversation.Id,
                        SenderId = sender.Id,
                        Text = templates[(m + a.Id) % templates.Length],
                        CreatedAt = conversation.CreatedAt.AddHours(m * 4 + ctx.Rng.Next(0, 3)),
                        Seen = m < messagesPerConvo - 2,
                    });
                    ctx.Increment("messages");
                }
            }
            await db.SaveChangesAsync();
        }

        private static async Task AddNotificationsAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            for (var i = 0; i < 120; i++)
            {
                var student = ctx.Students[i % ctx.Students.Count];
                db.UserNotifications.Add(new UserNotification
                {
                    UserId = student.UserId,
                    Category = (i % 3) switch
                    {
                        0 => "graduation_project",
                        1 => "chat",
                        _ => "organization_recruitment",
                    },
                    EventType = (i % 3) switch
                    {
                        0 => "invitation_received",
                        1 => "direct_message",
                        _ => "recruitment_application_accepted",
                    },
                    Title = "Platform activity update",
                    Body = "You have a new update relevant to your SkillSwap workspace.",
                    DedupKey = $"expansion:notify:{student.UserId}:{i}",
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(0, 200)),
                    ReadAt = i % 3 == 0 ? ctx.DaysAgo(ctx.Rng.Next(0, 10)) : null,
                });
                ctx.Increment("user_notifications");
            }

            foreach (var company in ctx.Companies.Take(20))
            {
                db.UserNotifications.Add(new UserNotification
                {
                    UserId = company.UserId,
                    Category = "company",
                    EventType = "company_ai_recommendations_ready",
                    Title = "New recommendations available",
                    Body = "Fresh student and team recommendations were generated for your active opportunities.",
                    DedupKey = $"expansion:company:recs:{company.Id}:{ctx.Rng.Next(1000, 9999)}",
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(0, 60)),
                });
                ctx.Increment("user_notifications");
            }

            await db.SaveChangesAsync();
        }

        private static async Task AddPasswordResetsAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            foreach (var student in ctx.PickMany(ctx.Students, 8))
            {
                db.PasswordResetCodes.Add(new PasswordResetCode
                {
                    UserId = student.UserId,
                    Email = ctx.GetUser(student.UserId).Email,
                    CodeHash = SeedHelpers.HashPassword($"exp{student.Id}"),
                    ExpiresAt = ctx.DaysFromNow(1),
                    IsUsed = ctx.Rng.Next(3) == 0,
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(1, 30)),
                });
                ctx.Increment("password_reset_codes");
            }

            foreach (var user in ctx.PickMany(ctx.UserById.Values.Where(u => u.Role == UserRoles.Company).ToList(), 5))
            {
                db.PasswordResetTokens.Add(new PasswordResetToken
                {
                    UserId = user.Id,
                    TokenHash = SeedHelpers.HashPassword($"token-exp-{user.Id}"),
                    ExpiresAt = ctx.DaysFromNow(2),
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(1, 20)),
                });
                ctx.Increment("password_reset_tokens");
            }

            await db.SaveChangesAsync();
        }
    }
}
