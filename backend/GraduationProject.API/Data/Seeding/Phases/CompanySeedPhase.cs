using GraduationProject.API.Data;
using GraduationProject.API.Models;

namespace GraduationProject.API.Data.Seeding.Phases
{
    internal static class CompanySeedPhase
    {
        public static async Task RunAsync(ApplicationDbContext db, SeedContext ctx)
        {
            await SeedTalentRequestsAsync(db, ctx);
            await SeedCompanyRequestsAsync(db, ctx);
        }

        private static async Task SeedTalentRequestsAsync(ApplicationDbContext db, SeedContext ctx)
        {
            var titles = new[]
            {
                ("Summer Internship — Full-Stack Development", "Join our product squad building bilingual SaaS dashboards for regional clients.", "React,ASP.NET Core,PostgreSQL", "Computer Science", "Internship", "3 months"),
                ("Graduate Trainee — QA Automation", "Rotational program across API, mobile, and regression automation squads.", "Selenium,Postman,CI/CD", "Software Engineering", "Graduate Program", "6 months"),
                ("Part-Time Mobile Developer", "Ship React Native features for our field service product line.", "React Native,TypeScript,Firebase", "Computer Engineering", "Part-Time", "Ongoing"),
            };

            foreach (var company in ctx.Companies)
            {
                foreach (var (title, desc, skills, major, engagement, duration) in titles.Take(ctx.Rng.Next(1, 4)))
                {
                    db.CompanyTalentRequests.Add(new CompanyTalentRequest
                    {
                        CompanyProfileId = company.Id,
                        Title = title,
                        Description = desc,
                        RequiredSkills = skills,
                        PreferredMajor = major,
                        EngagementType = engagement,
                        Duration = duration,
                        CreatedAt = ctx.DaysAgo(ctx.Rng.Next(10, 120)),
                    });
                    ctx.Increment("company_talent_requests");
                }
            }

            await db.SaveChangesAsync();
        }

        private static async Task SeedCompanyRequestsAsync(ApplicationDbContext db, SeedContext ctx)
        {
            var requestTemplates = new[]
            {
                (CompanyRequestType.Individual, CompanyRequestStatus.Draft, CompanyRequestLifecycleStatus.Active, "Campus Analytics Portal (Draft)", "Draft engagement for a student analytics portal with role-based dashboards.", "Data Science & Analytics", false, 4, DurationUnit.Months, CollaborationFormat.Hybrid, false),
                (CompanyRequestType.Individual, CompanyRequestStatus.Submitted, CompanyRequestLifecycleStatus.Active, "Predictive Maintenance MVP", "Build vibration analysis pipelines and maintenance supervisor alerts.", "AI & Machine Learning", true, 6, DurationUnit.Months, CollaborationFormat.Hybrid, true),
                (CompanyRequestType.AiBuiltTeam, CompanyRequestStatus.Submitted, CompanyRequestLifecycleStatus.Active, "Customer 360 Platform", "Cross-functional team for ETL, API layer, and executive dashboards.", "Data Science & Analytics", true, 2, DurationUnit.Semesters, CollaborationFormat.Remote, true),
                (CompanyRequestType.Individual, CompanyRequestStatus.Submitted, CompanyRequestLifecycleStatus.Paused, "Mobile Field Service App", "Flutter app for technicians with offline sync and photo capture.", "Web & Mobile Applications", true, 3, DurationUnit.Months, CollaborationFormat.Remote, false),
                (CompanyRequestType.Individual, CompanyRequestStatus.Submitted, CompanyRequestLifecycleStatus.Closed, "Legacy ERP Integration", "Completed SOAP integration between shop-floor terminals and ERP inventory.", "Software & Technology", false, 8, DurationUnit.Weeks, CollaborationFormat.OnSite, false),
            };

            foreach (var company in ctx.Companies)
            {
                var owner = await db.Users.FindAsync(company.UserId);
                if (owner == null) continue;

                CompanyRequest? draftRequest = null;
                for (var i = 0; i < requestTemplates.Length; i++)
                {
                    var t = requestTemplates[i];
                    var created = ctx.DaysAgo(ctx.Rng.Next(30, 200) - i * 10);
                    var isDraft = t.Item2 == CompanyRequestStatus.Draft;
                    if (isDraft)
                    {
                        if (draftRequest != null) continue;
                    }

                    var request = new CompanyRequest
                    {
                        CompanyProfileId = company.Id,
                        RequestType = t.Item1,
                        Status = t.Item2,
                        RequestStatus = t.Item3,
                        WizardStep = isDraft ? 2 : null,
                        Title = t.Item4,
                        Description = t.Item5,
                        Category = t.Item6,
                        CategoryChoice = t.Item6,
                        DurationOngoing = t.Item7,
                        DurationValue = t.Item8,
                        DurationUnit = t.Item9,
                        DurationLabel = t.Item7 ? "Ongoing" : $"{t.Item8} {t.Item9}",
                        CollaborationFormat = t.Item10,
                        ScopeNotes = "Weekly stakeholder demo; NDA available on request.",
                        CreatedAt = created,
                        UpdatedAt = created.AddDays(ctx.Rng.Next(1, 20)),
                        SubmittedAt = isDraft ? null : created.AddDays(1),
                        IsPublishedToHub = t.Item11,
                        PublishedToHubAt = t.Item11 ? created.AddDays(2) : null,
                        CreatedByUserId = owner.Id,
                        UpdatedByUserId = owner.Id,
                    };
                    db.CompanyRequests.Add(request);
                    await db.SaveChangesAsync();
                    if (isDraft) draftRequest = request;

                    var roles = new[]
                    {
                        ("backend", "Backend Developer", "API and data layer"),
                        ("frontend", "Frontend Developer", "Dashboard UI"),
                        ("ml", "ML Engineer", "Model training and evaluation"),
                    };
                    var roleEntities = new List<CompanyRequestRole>();
                    foreach (var (key, roleName, notes) in roles.Take(ctx.Rng.Next(2, 4)))
                    {
                        var role = new CompanyRequestRole
                        {
                            CompanyRequestId = request.Id,
                            ClientRoleKey = key,
                            SortOrder = roleEntities.Count,
                            RoleName = roleName,
                            Notes = notes,
                        };
                        db.CompanyRequestRoles.Add(role);
                        await db.SaveChangesAsync();
                        roleEntities.Add(role);

                        var skillNames = roleName switch
                        {
                            var r when r.Contains("Backend") => new[] { "ASP.NET Core", "PostgreSQL", "REST APIs" },
                            var r when r.Contains("Frontend") => new[] { "React", "TypeScript", "Tailwind CSS" },
                            _ => new[] { "Python", "Machine Learning", "TensorFlow" },
                        };
                        foreach (var (skillName, idx) in skillNames.Select((s, idx) => (s, idx)))
                        {
                            db.CompanyRequestSkills.Add(new CompanyRequestSkill
                            {
                                CompanyRequestRoleId = role.Id,
                                SortOrder = idx,
                                SkillName = skillName,
                            });
                            ctx.Increment("company_request_skills");
                        }
                        ctx.Increment("company_request_roles");
                    }

                    if (request.Status == CompanyRequestStatus.Submitted && request.RequestStatus == CompanyRequestLifecycleStatus.Active)
                    {
                        await SeedRecommendationsAsync(db, ctx, company, request, roleEntities, owner);
                    }

                    db.CompanyActivityLogs.Add(new CompanyActivityLog
                    {
                        CompanyProfileId = company.Id,
                        UserId = owner.Id,
                        ActivityType = isDraft ? CompanyActivityTypes.RequestCreated : CompanyActivityTypes.RequestPublished,
                        Description = isDraft ? $"Draft saved: {request.Title}" : $"Published opportunity: {request.Title}",
                        CreatedAt = request.CreatedAt,
                    });
                    ctx.Increment("company_activity_logs");

                    ctx.CompanyRequests.Add(request);
                    ctx.Increment("company_requests");
                }
            }

            await db.SaveChangesAsync();
        }

        private static async Task SeedRecommendationsAsync(
            ApplicationDbContext db,
            SeedContext ctx,
            CompanyProfile company,
            CompanyRequest request,
            List<CompanyRequestRole> roles,
            User owner)
        {
            var students = ctx.PickMany(ctx.Students, 8).ToList();
            var runAt = request.SubmittedAt?.AddHours(6) ?? ctx.DaysAgo(5);

            var studentRun = new CompanyRequestRecommendationRun
            {
                CompanyRequestId = request.Id,
                CompanyProfileId = company.Id,
                AlgorithmVersion = "v1-deterministic",
                Status = CompanyRequestRecommendationRunStatus.Completed,
                GeneratedAt = runAt,
                CompletedAt = runAt.AddMinutes(12),
            };
            db.CompanyRequestRecommendationRuns.Add(studentRun);
            await db.SaveChangesAsync();
            ctx.Increment("company_request_recommendation_runs");

            for (var rank = 0; rank < students.Count; rank++)
            {
                var student = students[rank];
                var score = 92 - rank * 4;
                db.CompanyRequestRecommendations.Add(new CompanyRequestRecommendation
                {
                    RunId = studentRun.Id,
                    CompanyRequestId = request.Id,
                    StudentProfileId = student.Id,
                    Rank = rank + 1,
                    Score = score,
                    ReasonSummary = $"Strong alignment with {request.Category} requirements and portfolio evidence in {student.Major}.",
                    ScoreBreakdownJson = SeedHelpers.ScoreBreakdownJson(score - 5, score - 8, score - 3),
                    HighlightsJson = SeedHelpers.HighlightsJson(
                        $"Proficient in {student.Major} coursework",
                        "Active graduation project contributor",
                        "Available for hybrid collaboration"),
                    Source = "deterministic",
                    CreatedAt = runAt,
                });
                ctx.Increment("company_request_recommendations");

                if (rank == 0)
                {
                    db.CompanySavedStudentRecommendations.Add(new CompanySavedStudentRecommendation
                    {
                        CompanyProfileId = company.Id,
                        CompanyRequestId = request.Id,
                        StudentProfileId = student.Id,
                        SavedByUserId = owner.Id,
                        Note = "Top candidate for backend role — schedule technical interview.",
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
                    GeneratedAt = runAt.AddHours(1),
                    CompletedAt = runAt.AddHours(1).AddMinutes(18),
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
                    TotalScore = 88,
                    RoleCoverageScore = 95,
                    CompatibilityScore = 82,
                    SummaryReason = "Balanced team covering backend, frontend, and ML with complementary academic schedules.",
                    StrengthsJson = SeedHelpers.HighlightsJson("Complementary skill coverage", "Prior capstone collaboration"),
                    RisksJson = SeedHelpers.HighlightsJson("Two members have overlapping exam weeks in May"),
                    CreatedAt = runAt.AddHours(1),
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
                        RoleScore = 85 + i,
                        SemanticSimilarity = 0.78 + i * 0.03,
                        AssignmentReason = $"Best semantic fit for {roles[i].RoleName} based on skills and project history.",
                        HighlightsJson = SeedHelpers.HighlightsJson($"Strong {roles[i].RoleName} portfolio"),
                    });
                    ctx.Increment("company_request_team_recommendation_members");
                }

                db.CompanySavedTeamRecommendations.Add(new CompanySavedTeamRecommendation
                {
                    CompanyProfileId = company.Id,
                    CompanyRequestId = request.Id,
                    TeamRecommendationId = teamRec.Id,
                    SavedByUserId = owner.Id,
                    Note = "Preferred team composition for Q3 kickoff.",
                    CreatedAt = runAt.AddDays(2),
                });
                ctx.Increment("company_saved_team_recommendations");
            }
        }
    }
}
