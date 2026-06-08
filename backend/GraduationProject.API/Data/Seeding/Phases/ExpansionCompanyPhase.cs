using GraduationProject.API.Data;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Data.Seeding.Phases
{
    internal static class ExpansionCompanyPhase
    {
        public static async Task RunAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            await AddTalentRequestsAsync(db, ctx);
            await AddCompanyRequestsAsync(db, ctx);
        }

        private static async Task AddTalentRequestsAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            var templates = new[]
            {
                ("Research Collaboration — NLP", "Support Arabic corpus labeling and model evaluation with faculty oversight.", "Python,NLP,Machine Learning", "Computer Science", "Research", "1 semester"),
                ("Winter Internship — DevOps", "Assist platform team with CI/CD hardening and observability dashboards.", "Docker,Kubernetes,CI/CD", "Software Engineering", "Internship", "4 months"),
                ("Capstone Partnership — Mobile", "Co-design a bilingual mobile product with mentorship from senior engineers.", "React Native,TypeScript,UX Design", "Computer Engineering", "Capstone", "6 months"),
            };

            foreach (var company in ctx.Companies)
            {
                foreach (var t in templates.Take(ctx.Rng.Next(2, 4)))
                {
                    db.CompanyTalentRequests.Add(new CompanyTalentRequest
                    {
                        CompanyProfileId = company.Id,
                        Title = t.Item1,
                        Description = t.Item2,
                        RequiredSkills = t.Item3,
                        PreferredMajor = t.Item4,
                        EngagementType = t.Item5,
                        Duration = t.Item6,
                        CreatedAt = ctx.DaysAgo(ctx.Rng.Next(20, 400)),
                    });
                    ctx.Increment("company_talent_requests");
                }
            }
            await db.SaveChangesAsync();
        }

        private static async Task AddCompanyRequestsAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            var templates = new[]
            {
                (CompanyRequestType.Individual, CompanyRequestStatus.Submitted, CompanyRequestLifecycleStatus.Active, "Supply Chain Visibility Dashboard", "Track inbound shipments and warehouse KPIs for regional distributors.", "Data Science & Analytics", false, 5, DurationUnit.Months, CollaborationFormat.Hybrid, true),
                (CompanyRequestType.AiBuiltTeam, CompanyRequestStatus.Submitted, CompanyRequestLifecycleStatus.Active, "Bilingual Customer Portal", "Team delivery of self-service portal with Arabic/English content workflows.", "Web & Mobile Applications", false, 2, DurationUnit.Semesters, CollaborationFormat.Remote, true),
                (CompanyRequestType.Individual, CompanyRequestStatus.Submitted, CompanyRequestLifecycleStatus.Paused, "IoT Cold Chain Monitor", "Sensor integration for refrigerated transport compliance reporting.", "Software & Technology", false, 4, DurationUnit.Months, CollaborationFormat.OnSite, false),
                (CompanyRequestType.Individual, CompanyRequestStatus.Submitted, CompanyRequestLifecycleStatus.Closed, "POS Integration Module", "Completed retail POS connector with inventory sync and receipt printing.", "Software & Technology", false, 10, DurationUnit.Weeks, CollaborationFormat.Hybrid, false),
                (CompanyRequestType.Individual, CompanyRequestStatus.Archived, CompanyRequestLifecycleStatus.Active, "HR Policy Chatbot Pilot", "Archived internal HR Q&A assistant using retrieval-augmented generation.", "AI & Machine Learning", true, (int?)null, (DurationUnit?)null, CollaborationFormat.Flexible, false),
            };

            foreach (var company in ctx.Companies)
            {
                var owner = ctx.GetUser(company.UserId);
                var addedDraft = false;

                foreach (var t in templates)
                {
                    var isDraft = t.Item2 == CompanyRequestStatus.Draft;
                    if (isDraft)
                    {
                        if (ctx.CompaniesWithDraft.Contains(company.Id) || addedDraft) continue;
                    }

                    var created = ctx.DaysAgo(ctx.Rng.Next(40, 500));
                    var request = new CompanyRequest
                    {
                        CompanyProfileId = company.Id,
                        RequestType = t.Item1,
                        Status = t.Item2,
                        RequestStatus = t.Item3,
                        Title = $"{t.Item4} — {company.CompanyName.Split(' ')[0]}",
                        Description = t.Item5,
                        Category = t.Item6,
                        CategoryChoice = t.Item6,
                        DurationOngoing = t.Item7,
                        DurationValue = t.Item8,
                        DurationUnit = t.Item9,
                        DurationLabel = t.Item7 ? "Ongoing" : t.Item8.HasValue ? $"{t.Item8} {t.Item9}" : "Ongoing",
                        CollaborationFormat = t.Item10,
                        ScopeNotes = "Expansion cohort engagement with weekly review cadence.",
                        CreatedAt = created,
                        UpdatedAt = created.AddDays(ctx.Rng.Next(3, 30)),
                        SubmittedAt = t.Item2 == CompanyRequestStatus.Draft ? null : created.AddDays(2),
                        IsPublishedToHub = t.Item11,
                        PublishedToHubAt = t.Item11 ? created.AddDays(4) : null,
                        CreatedByUserId = owner.Id,
                        UpdatedByUserId = owner.Id,
                    };
                    db.CompanyRequests.Add(request);
                    await db.SaveChangesAsync();
                    ctx.CompanyRequests.Add(request);
                    ctx.Increment("company_requests");

                    if (isDraft)
                    {
                        ctx.CompaniesWithDraft.Add(company.Id);
                        addedDraft = true;
                    }

                    var roles = new[] { ("backend", "Backend Engineer"), ("frontend", "Frontend Engineer"), ("qa", "QA Engineer") };
                    var roleEntities = new List<CompanyRequestRole>();
                    foreach (var (key, roleName) in roles.Take(ctx.Rng.Next(2, 4)))
                    {
                        var role = new CompanyRequestRole
                        {
                            CompanyRequestId = request.Id,
                            ClientRoleKey = key,
                            SortOrder = roleEntities.Count,
                            RoleName = roleName,
                            Notes = $"Expansion role for {roleName.ToLower()}.",
                        };
                        db.CompanyRequestRoles.Add(role);
                        await db.SaveChangesAsync();
                        roleEntities.Add(role);
                        ctx.Increment("company_request_roles");

                        var skills = roleName.Contains("Backend")
                            ? new[] { "ASP.NET Core", "PostgreSQL" }
                            : roleName.Contains("Frontend")
                                ? new[] { "React", "TypeScript" }
                                : new[] { "Selenium", "CI/CD" };
                        foreach (var (skill, idx) in skills.Select((s, i) => (s, i)))
                        {
                            db.CompanyRequestSkills.Add(new CompanyRequestSkill
                            {
                                CompanyRequestRoleId = role.Id,
                                SortOrder = idx,
                                SkillName = skill,
                            });
                            ctx.Increment("company_request_skills");
                        }
                    }

                    if (request.Status == CompanyRequestStatus.Submitted &&
                        request.RequestStatus == CompanyRequestLifecycleStatus.Active)
                    {
                        await AddRecommendationsAsync(db, ctx, company, request, roleEntities, owner);
                    }

                    db.CompanyActivityLogs.Add(new CompanyActivityLog
                    {
                        CompanyProfileId = company.Id,
                        UserId = owner.Id,
                        ActivityType = request.IsPublishedToHub
                            ? CompanyActivityTypes.RequestPublished
                            : CompanyActivityTypes.RequestCreated,
                        Description = $"Expansion opportunity: {request.Title}",
                        CreatedAt = request.CreatedAt,
                    });
                    ctx.Increment("company_activity_logs");
                }
            }
            await db.SaveChangesAsync();
        }

        private static async Task AddRecommendationsAsync(
            ApplicationDbContext db,
            ExpansionContext ctx,
            CompanyProfile company,
            CompanyRequest request,
            List<CompanyRequestRole> roles,
            User owner)
        {
            var students = ctx.PickMany(ctx.Students, 10).ToList();
            var runAt = request.SubmittedAt?.AddHours(12) ?? ctx.DaysAgo(10);

            var run = new CompanyRequestRecommendationRun
            {
                CompanyRequestId = request.Id,
                CompanyProfileId = company.Id,
                AlgorithmVersion = "v1-deterministic",
                Status = CompanyRequestRecommendationRunStatus.Completed,
                GeneratedAt = runAt,
                CompletedAt = runAt.AddMinutes(15),
            };
            db.CompanyRequestRecommendationRuns.Add(run);
            await db.SaveChangesAsync();
            ctx.Increment("company_request_recommendation_runs");

            for (var rank = 0; rank < students.Count; rank++)
            {
                var student = students[rank];
                var score = 90 - rank * 3;
                db.CompanyRequestRecommendations.Add(new CompanyRequestRecommendation
                {
                    RunId = run.Id,
                    CompanyRequestId = request.Id,
                    StudentProfileId = student.Id,
                    Rank = rank + 1,
                    Score = score,
                    ReasonSummary = $"Strong {student.Major} background with relevant tooling for {request.Category}.",
                    ScoreBreakdownJson = SeedHelpers.ScoreBreakdownJson(score - 4, score - 7, score - 2),
                    HighlightsJson = SeedHelpers.HighlightsJson("Consistent academic performance", "Portfolio project evidence"),
                    Source = "deterministic",
                    CreatedAt = runAt,
                });
                ctx.Increment("company_request_recommendations");

                if (rank < 4)
                {
                    db.CompanyRequestInvitations.Add(new CompanyRequestInvitation
                    {
                        CompanyRequestId = request.Id,
                        CompanyProfileId = company.Id,
                        StudentProfileId = student.Id,
                        InvitedByUserId = owner.Id,
                        CompanyRequestRoleId = roles[rank % roles.Count].Id,
                        Message = $"We would like to discuss the {roles[rank % roles.Count].RoleName} role on {request.Title}.",
                        Status = rank switch { 0 => CompanyRequestInvitationStatus.Accepted, 1 => CompanyRequestInvitationStatus.Pending, 2 => CompanyRequestInvitationStatus.Rejected, _ => CompanyRequestInvitationStatus.Cancelled },
                        MatchScore = score,
                        Source = "recommendation",
                        CreatedAt = runAt.AddDays(rank + 1),
                        RespondedAt = rank == 1 ? null : runAt.AddDays(rank + 2),
                    });
                    ctx.Increment("company_request_invitations");
                }

                if (rank == 0)
                {
                    db.CompanySavedStudentRecommendations.Add(new CompanySavedStudentRecommendation
                    {
                        CompanyProfileId = company.Id,
                        CompanyRequestId = request.Id,
                        StudentProfileId = student.Id,
                        SavedByUserId = owner.Id,
                        Note = "Priority candidate from expansion recommendation run.",
                        CreatedAt = runAt.AddDays(1),
                    });
                    ctx.Increment("company_saved_student_recommendations");
                }
            }

            if (request.RequestType == CompanyRequestType.AiBuiltTeam && roles.Count >= 2)
            {
                var teamRun = new CompanyRequestTeamRecommendationRun
                {
                    CompanyRequestId = request.Id,
                    CompanyProfileId = company.Id,
                    AlgorithmVersion = "v1-team-deterministic-semantic",
                    Status = CompanyRequestTeamRecommendationRunStatus.Completed,
                    GeneratedAt = runAt.AddHours(2),
                    CompletedAt = runAt.AddHours(2).AddMinutes(20),
                };
                db.CompanyRequestTeamRecommendationRuns.Add(teamRun);
                await db.SaveChangesAsync();
                ctx.Increment("company_request_team_recommendation_runs");

                var teamStudents = ctx.PickMany(ctx.Students, Math.Min(roles.Count, 4)).ToList();
                var teamRec = new CompanyRequestTeamRecommendation
                {
                    RunId = teamRun.Id,
                    CompanyRequestId = request.Id,
                    TeamRank = 1,
                    TotalScore = 86,
                    RoleCoverageScore = 92,
                    CompatibilityScore = 80,
                    SummaryReason = "Expansion cohort team with complementary skills and aligned availability.",
                    StrengthsJson = SeedHelpers.HighlightsJson("Cross-functional coverage", "Prior collaboration history"),
                    RisksJson = SeedHelpers.HighlightsJson("Exam period overlap in late May"),
                    CreatedAt = runAt.AddHours(2),
                };
                db.CompanyRequestTeamRecommendations.Add(teamRec);
                await db.SaveChangesAsync();
                ctx.Increment("company_request_team_recommendations");

                for (var i = 0; i < teamStudents.Count && i < roles.Count; i++)
                {
                    db.CompanyRequestTeamRecommendationMembers.Add(new CompanyRequestTeamRecommendationMember
                    {
                        TeamRecommendationId = teamRec.Id,
                        CompanyRequestRoleId = roles[i].Id,
                        StudentProfileId = teamStudents[i].Id,
                        RoleScore = 84 + i,
                        SemanticSimilarity = 0.75 + i * 0.04,
                        AssignmentReason = $"Best fit for {roles[i].RoleName} in expansion team ranking.",
                        HighlightsJson = SeedHelpers.HighlightsJson($"Relevant {teamStudents[i].Major} coursework"),
                    });
                    ctx.Increment("company_request_team_recommendation_members");
                }

                db.CompanySavedTeamRecommendations.Add(new CompanySavedTeamRecommendation
                {
                    CompanyProfileId = company.Id,
                    CompanyRequestId = request.Id,
                    TeamRecommendationId = teamRec.Id,
                    SavedByUserId = owner.Id,
                    Note = "Saved expansion team recommendation.",
                    CreatedAt = runAt.AddDays(3),
                });
                ctx.Increment("company_saved_team_recommendations");
            }

            db.RecommendationSemanticEmbeddings.Add(new RecommendationSemanticEmbedding
            {
                ScopeType = "company_request",
                ScopeId = request.Id,
                EmbeddingModel = "text-embedding-3-small",
                ContentHash = $"expansion-{request.Id}-{run.Id}",
                EmbeddingJson = "[0.09,0.14,0.28,0.41,0.22]",
                UpdatedAt = runAt,
            });
            ctx.Increment("recommendation_semantic_embeddings");
        }
    }
}
