using System.Text.Json;
using GraduationProject.API.Data;
using GraduationProject.API.Models;

namespace GraduationProject.API.Data.Seeding.Phases
{
    internal static class ExpansionOrganizationPhase
    {
        public static async Task RunAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            await AddEventsAsync(db, ctx);
            await AddRecruitmentAsync(db, ctx);
            await AddOrgMembersAsync(db, ctx);
        }

        private static async Task AddEventsAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            var templates = new[]
            {
                ("Industry Panel: Palestinian Tech Ecosystem", "Founders and engineers discuss hiring trends and capstone partnerships.", "Panel", "Technical", false, "Engineering Auditorium", -120, true),
                ("Intro to Rust for Systems Programming", "Hands-on evening workshop covering ownership, borrowing, and CLI tooling.", "Workshop", "Technical", false, "Lab 3B", 18, true),
                ("Spring Hackathon 2026", "36-hour build sprint with mentorship from local software companies.", "Competition", "Technical", false, "Innovation Center", 35, true),
                ("Volunteer Training: Digital Literacy", "Train volunteers to teach basic computer skills in nearby communities.", "Volunteer", "Volunteer", true, "Zoom", 10, true),
                ("Alumni Networking Night", "Connect current members with graduates working in Ramallah and Nablus tech firms.", "Networking", "Cultural", false, "Student Center", -45, true),
                ("Summer Planning Session (Draft)", "Internal planning event — not yet published.", "Meeting", "Technical", true, "Discord", 60, false),
            };

            foreach (var org in ctx.Associations)
            {
                foreach (var t in templates.Take(ctx.Rng.Next(3, 6)))
                {
                    var (title, desc, eventType, category, isOnline, location, daysOffset, published) = t;
                    var eventDate = daysOffset >= 0 ? ctx.DaysFromNow(daysOffset) : ctx.DaysAgo(-daysOffset);
                    var createdAt = ctx.DaysAgo(ctx.Rng.Next(20, 200));

                    var ev = new StudentOrganizationEvent
                    {
                        OrganizationProfileId = org.Id,
                        Title = title,
                        Description = desc,
                        EventType = eventType,
                        Category = category,
                        Location = location,
                        IsOnline = isOnline,
                        EventDate = eventDate,
                        RegistrationDeadline = eventDate.AddDays(-3),
                        MaxParticipants = ctx.Rng.Next(40, 150),
                        IsPublished = published,
                        CreatedAt = createdAt,
                        UpdatedAt = createdAt,
                    };
                    db.StudentOrganizationEvents.Add(ev);
                    await db.SaveChangesAsync();
                    ctx.Events.Add(ev);
                    ctx.Increment("student_organization_events");

                    var form = new StudentOrganizationEventRegistrationForm
                    {
                        EventId = ev.Id,
                        Title = "Event Registration",
                        Description = "Please provide your details to confirm attendance.",
                        CreatedAt = createdAt,
                    };
                    db.StudentOrganizationEventRegistrationForms.Add(form);
                    await db.SaveChangesAsync();
                    ctx.Increment("student_organization_event_registration_forms");

                    var fields = new (string Label, string Type, bool Required)[]
                    {
                        ("Full Name", "ShortText", true),
                        ("University Email", "Email", true),
                        ("Major", "ShortText", true),
                        ("Dietary Requirements", "Paragraph", false),
                    };
                    var fieldEntities = new List<StudentOrganizationEventRegistrationField>();
                    for (var f = 0; f < fields.Length; f++)
                    {
                        var field = new StudentOrganizationEventRegistrationField
                        {
                            FormId = form.Id,
                            Label = fields[f].Label,
                            FieldType = fields[f].Type,
                            IsRequired = fields[f].Required,
                            DisplayOrder = f,
                            CreatedAt = createdAt,
                        };
                        db.StudentOrganizationEventRegistrationFields.Add(field);
                        fieldEntities.Add(field);
                        ctx.Increment("student_organization_event_registration_fields");
                    }
                    await db.SaveChangesAsync();

                    if (published)
                    {
                        var count = daysOffset < 0 ? ctx.Rng.Next(15, 35) : ctx.Rng.Next(8, 20);
                        foreach (var student in ctx.PickMany(ctx.Students, count))
                        {
                            var reg = new StudentOrganizationEventRegistration
                            {
                                EventId = ev.Id,
                                StudentProfileId = student.Id,
                                OrganizationProfileId = org.Id,
                                SubmittedAt = createdAt.AddDays(ctx.Rng.Next(1, 25)),
                            };
                            db.StudentOrganizationEventRegistrations.Add(reg);
                            await db.SaveChangesAsync();
                            ctx.Increment("student_organization_event_registrations");

                            foreach (var field in fieldEntities)
                            {
                                var user = ctx.GetUser(student.UserId);
                                var answer = field.Label switch
                                {
                                    "Full Name" => user.Name,
                                    "University Email" => user.Email,
                                    "Major" => student.Major ?? "Engineering",
                                    _ => "None",
                                };
                                db.StudentOrganizationEventRegistrationAnswers.Add(
                                    new StudentOrganizationEventRegistrationAnswer
                                    {
                                        RegistrationId = reg.Id,
                                        FieldId = field.Id,
                                        AnswerValue = answer,
                                    });
                                ctx.Increment("student_organization_event_registration_answers");
                            }
                        }
                    }
                }
            }
            await db.SaveChangesAsync();
        }

        private static async Task AddRecruitmentAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            var campaigns = new[]
            {
                ("Fall 2026 Leadership Recruitment", "Recruiting committee leads and project coordinators for the next academic year.", 50, true),
                ("Media & Content Team 2026", "Designers, writers, and video editors for semester campaigns.", 25, true),
                ("2025 Alumni Mentorship Program", "Closed cycle pairing alumni mentors with junior members.", -90, false),
                ("Technical Fellows (Draft)", "Draft campaign for advanced technical contributors.", 70, false),
            };

            foreach (var org in ctx.Associations)
            {
                foreach (var (title, desc, deadlineOffset, published) in campaigns.Take(ctx.Rng.Next(2, 4)))
                {
                    var createdAt = ctx.DaysAgo(ctx.Rng.Next(30, 300));
                    var campaign = new StudentOrganizationRecruitmentCampaign
                    {
                        OrganizationProfileId = org.Id,
                        Title = title,
                        Description = desc,
                        ApplicationDeadline = deadlineOffset >= 0 ? ctx.DaysFromNow(deadlineOffset) : ctx.DaysAgo(-deadlineOffset),
                        IsPublished = published,
                        CreatedAt = createdAt,
                        UpdatedAt = createdAt,
                    };
                    db.StudentOrganizationRecruitmentCampaigns.Add(campaign);
                    await db.SaveChangesAsync();
                    ctx.RecruitmentCampaigns.Add(campaign);
                    ctx.Increment("student_organization_recruitment_campaigns");

                    var positions = new[]
                    {
                        ("Technical Lead", 1, "Lead workshops and mentor project teams."),
                        ("Events Lead", 1, "Own logistics for campus and online events."),
                        ("Content Creator", 3, "Produce social posts, reels, and recap articles."),
                    };
                    var positionEntities = new List<StudentOrganizationRecruitmentPosition>();
                    foreach (var (roleTitle, needed, posDesc) in positions)
                    {
                        var position = new StudentOrganizationRecruitmentPosition
                        {
                            CampaignId = campaign.Id,
                            RoleTitle = roleTitle,
                            NeededCount = needed,
                            Description = posDesc,
                            Requirements = "Strong communication and reliable weekly availability.",
                            RequiredSkills = roleTitle.Contains("Technical") ? "Git,Public Speaking" : "Canva,Writing",
                            DisplayOrder = positionEntities.Count,
                        };
                        db.StudentOrganizationRecruitmentPositions.Add(position);
                        await db.SaveChangesAsync();
                        positionEntities.Add(position);
                        ctx.Increment("student_organization_recruitment_positions");
                    }

                    var question = new StudentOrganizationRecruitmentQuestion
                    {
                        CampaignId = campaign.Id,
                        QuestionTitle = "Why are you interested in this role?",
                        QuestionType = "Paragraph",
                        IsRequired = true,
                        DisplayOrder = 0,
                    };
                    db.StudentOrganizationRecruitmentQuestions.Add(question);
                    await db.SaveChangesAsync();
                    ctx.Increment("student_organization_recruitment_questions");

                    if (!published) continue;

                    var applicants = ctx.PickMany(ctx.Students, ctx.Rng.Next(10, 22)).ToList();
                    for (var i = 0; i < applicants.Count; i++)
                    {
                        var student = applicants[i];
                        var position = positionEntities[i % positionEntities.Count];
                        var status = (i % 5) switch
                        {
                            0 => RecruitmentApplicationStatuses.Accepted,
                            1 => RecruitmentApplicationStatuses.Rejected,
                            2 => RecruitmentApplicationStatuses.Pending,
                            3 => RecruitmentApplicationStatuses.AiSuggested,
                            _ => RecruitmentApplicationStatuses.Pending,
                        };

                        var application = new StudentOrganizationRecruitmentApplication
                        {
                            StudentProfileId = student.Id,
                            OrganizationProfileId = org.Id,
                            CampaignId = campaign.Id,
                            PositionId = position.Id,
                            Status = status,
                            SubmittedAt = createdAt.AddDays(ctx.Rng.Next(2, 20)),
                            UpdatedAt = createdAt.AddDays(ctx.Rng.Next(21, 35)),
                            AcceptedAt = status == RecruitmentApplicationStatuses.Accepted
                                ? createdAt.AddDays(ctx.Rng.Next(25, 40))
                                : null,
                        };
                        db.StudentOrganizationRecruitmentApplications.Add(application);
                        await db.SaveChangesAsync();
                        ctx.Increment("student_organization_recruitment_applications");

                        db.StudentOrganizationRecruitmentApplicationAnswers.Add(
                            new StudentOrganizationRecruitmentApplicationAnswer
                            {
                                ApplicationId = application.Id,
                                QuestionId = question.Id,
                                AnswerValue = $"I want to contribute my {student.Major} experience to {org.AssociationName} and grow through hands-on community leadership.",
                            });
                        ctx.Increment("student_organization_recruitment_application_answers");

                        if (status == RecruitmentApplicationStatuses.Accepted)
                        {
                            db.StudentOrganizationRecruitmentApplicantAnalyses.Add(
                                new StudentOrganizationRecruitmentApplicantAnalysis
                                {
                                    PositionId = position.Id,
                                    TopK = 8,
                                    ResultsJson = JsonSerializer.Serialize(new[]
                                    {
                                        new { studentProfileId = student.Id, score = 85 + i % 10, reason = "Strong organizational fit" },
                                    }),
                                    CreatedAtUtc = application.SubmittedAt,
                                });
                            ctx.Increment("student_organization_recruitment_applicant_analyses");
                        }
                    }
                }
            }
            await db.SaveChangesAsync();
        }

        private static async Task AddOrgMembersAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            foreach (var org in ctx.Associations)
            {
                var leadership = ctx.Students
                    .Where(s => !ctx.ExistingTeamMembers.Contains((org.Id, s.Id)))
                    .OrderBy(_ => ctx.Rng.Next())
                    .Take(3)
                    .ToList();
                for (var idx = 0; idx < leadership.Count; idx++)
                {
                    var student = leadership[idx];
                    ctx.ExistingTeamMembers.Add((org.Id, student.Id));
                    db.StudentOrganizationTeamMembers.Add(new StudentOrganizationTeamMember
                    {
                        OrganizationProfileId = org.Id,
                        StudentProfileId = student.Id,
                        FullName = ctx.GetUser(student.UserId).Name,
                        RoleTitle = idx == 0 ? "Vice President" : idx == 1 ? "Programs Director" : "Outreach Lead",
                        DisplayOrder = idx + 4,
                        Major = student.Major,
                        CreatedAt = ctx.DaysAgo(ctx.Rng.Next(90, 400)),
                    });
                    ctx.Increment("student_organization_team_members");
                }

                var candidates = ctx.Students
                    .Where(s => !ctx.ExistingOrgMembers.Contains((org.Id, s.Id)))
                    .OrderBy(_ => ctx.Rng.Next())
                    .Take(12)
                    .ToList();
                foreach (var student in candidates)
                {
                    ctx.ExistingOrgMembers.Add((org.Id, student.Id));
                    db.StudentOrganizationMembers.Add(new StudentOrganizationMember
                    {
                        OrganizationProfileId = org.Id,
                        StudentProfileId = student.Id,
                        MembershipKind = OrganizationMembershipKinds.Member,
                        RoleTitle = "Contributor",
                        AcceptedAt = ctx.DaysAgo(ctx.Rng.Next(15, 300)),
                    });
                    ctx.Increment("student_organization_members");
                }
            }
            await db.SaveChangesAsync();
        }
    }
}
