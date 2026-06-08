using System.Text.Json;
using GraduationProject.API.Data;
using GraduationProject.API.Models;

namespace GraduationProject.API.Data.Seeding.Phases
{
    internal static class OrganizationSeedPhase
    {
        public static async Task RunAsync(ApplicationDbContext db, SeedContext ctx)
        {
            await SeedEventsAsync(db, ctx);
            await SeedRecruitmentAsync(db, ctx);
            await SeedOrgMembersAsync(db, ctx);
        }

        private static async Task SeedEventsAsync(ApplicationDbContext db, SeedContext ctx)
        {
            var eventTemplates = new[]
            {
                ("Intro to Git & GitHub Workshop", "Hands-on workshop covering branching, pull requests, and team workflows.", "Workshop", "Technical", false, "Engineering Building, Room 204", 14, true),
                ("Annual Hackathon 2026", "48-hour campus hackathon with industry mentors and startup prizes.", "Competition", "Technical", false, "Innovation Hub", 45, true),
                ("Cybersecurity Awareness Week", "Daily talks on phishing, password hygiene, and incident reporting.", "Series", "Technical", true, null, 7, true),
                ("Robotics Demo Day", "Showcase of autonomous line-followers and drone prototypes.", "Showcase", "Technical", false, "Main Auditorium", -10, true),
                ("AI Research Reading Group", "Biweekly paper discussions on Arabic NLP and computer vision.", "Meetup", "Technical", true, "Zoom", 21, false),
                ("Entrepreneurship Pitch Night", "Student founders pitch to local angel investors and mentors.", "Networking", "Cultural", false, "Business School Atrium", 30, true),
                ("Women in Tech Mentorship Circle", "Small-group mentorship sessions with alumni engineers.", "Mentorship", "Volunteer", true, "Zoom", -5, true),
                ("Open Source Documentation Sprint", "Contribute to Arabic localization for popular open-source tools.", "Volunteer", "Technical", true, "Discord", 5, false),
            };

            foreach (var org in ctx.Associations)
            {
                foreach (var template in eventTemplates.Take(ctx.Rng.Next(3, 6)))
                {
                    var (title, desc, eventType, category, isOnline, location, daysOffset, published) = template;
                    var eventDate = daysOffset >= 0 ? ctx.DaysFromNow(daysOffset) : ctx.DaysAgo(-daysOffset);
                    var createdAt = ctx.DaysAgo(ctx.Rng.Next(10, 60));

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
                        RegistrationDeadline = eventDate.AddDays(-2),
                        MaxParticipants = ctx.Rng.Next(30, 120),
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
                        Title = "Registration Form",
                        Description = "Please complete the following details to register.",
                        CreatedAt = createdAt,
                    };
                    db.StudentOrganizationEventRegistrationForms.Add(form);
                    await db.SaveChangesAsync();
                    ctx.Increment("student_organization_event_registration_forms");

                    var fields = new[]
                    {
                        ("Full Name", "ShortText", true, 0),
                        ("University Email", "Email", true, 1),
                        ("Dietary Requirements", "Paragraph", false, 2),
                    };
                    var fieldEntities = new List<StudentOrganizationEventRegistrationField>();
                    foreach (var (label, fieldType, required, order) in fields)
                    {
                        var field = new StudentOrganizationEventRegistrationField
                        {
                            FormId = form.Id,
                            Label = label,
                            FieldType = fieldType,
                            IsRequired = required,
                            DisplayOrder = order,
                            CreatedAt = createdAt,
                        };
                        db.StudentOrganizationEventRegistrationFields.Add(field);
                        fieldEntities.Add(field);
                        ctx.Increment("student_organization_event_registration_fields");
                    }
                    await db.SaveChangesAsync();

                    if (published && daysOffset >= -3)
                    {
                        var registrants = ctx.PickMany(ctx.Students, ctx.Rng.Next(5, 12)).ToList();
                        foreach (var student in registrants)
                        {
                            var reg = new StudentOrganizationEventRegistration
                            {
                                EventId = ev.Id,
                                StudentProfileId = student.Id,
                                OrganizationProfileId = org.Id,
                                SubmittedAt = createdAt.AddDays(ctx.Rng.Next(1, 10)),
                            };
                            db.StudentOrganizationEventRegistrations.Add(reg);
                            await db.SaveChangesAsync();
                            ctx.Increment("student_organization_event_registrations");

                            foreach (var field in fieldEntities)
                            {
                                var studentUser = ctx.GetUser(student.UserId);
                                var answer = field.Label switch
                                {
                                    "Full Name" => studentUser.Name,
                                    "University Email" => studentUser.Email,
                                    _ => "None",
                                };
                                db.StudentOrganizationEventRegistrationAnswers.Add(new StudentOrganizationEventRegistrationAnswer
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

        private static async Task SeedRecruitmentAsync(ApplicationDbContext db, SeedContext ctx)
        {
            var campaignTemplates = new[]
            {
                ("Spring 2026 Core Team Recruitment", "Join our organizing committee for workshops, competitions, and outreach.", 30, true),
                ("Media Team Hiring", "Looking for designers and content creators for the semester.", 14, true),
                ("Fall 2025 Alumni Mentorship Program", "Closed recruitment cycle for alumni-student mentorship pairs.", -60, false),
                ("Technical Officers 2026", "Draft campaign for next semester technical leadership roles.", 45, false),
            };

            foreach (var org in ctx.Associations)
            {
                foreach (var (title, desc, deadlineOffset, published) in campaignTemplates.Take(ctx.Rng.Next(2, 4)))
                {
                    var createdAt = ctx.DaysAgo(ctx.Rng.Next(20, 100));
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
                        ("Technical Lead", 1, "Lead workshops and mentor project teams.", "2+ years club experience, strong communication"),
                        ("Events Coordinator", 2, "Plan logistics for campus events and external partnerships.", "Organizational skills, vendor coordination"),
                        ("Media Designer", 2, "Create posters, social content, and recap videos.", "Figma, Adobe Creative Suite"),
                    };

                    var positionEntities = new List<StudentOrganizationRecruitmentPosition>();
                    foreach (var (roleTitle, needed, posDesc, requirements) in positions)
                    {
                        var position = new StudentOrganizationRecruitmentPosition
                        {
                            CampaignId = campaign.Id,
                            RoleTitle = roleTitle,
                            NeededCount = needed,
                            Description = posDesc,
                            Requirements = requirements,
                            RequiredSkills = roleTitle switch
                            {
                                var r when r.Contains("Technical") => "Python,Git,Public Speaking",
                                var r when r.Contains("Media") => "Figma,Canva,Video Editing",
                                _ => "Project Management,Communication",
                            },
                            DisplayOrder = positionEntities.Count,
                        };
                        db.StudentOrganizationRecruitmentPositions.Add(position);
                        await db.SaveChangesAsync();
                        positionEntities.Add(position);
                        ctx.Increment("student_organization_recruitment_positions");
                    }

                    var campaignQuestion = new StudentOrganizationRecruitmentQuestion
                    {
                        CampaignId = campaign.Id,
                        QuestionTitle = "Why do you want to join our organization?",
                        QuestionType = "Paragraph",
                        IsRequired = true,
                        DisplayOrder = 0,
                    };
                    db.StudentOrganizationRecruitmentQuestions.Add(campaignQuestion);
                    await db.SaveChangesAsync();
                    ctx.Increment("student_organization_recruitment_questions");

                    if (published)
                    {
                        var applicants = ctx.PickMany(ctx.Students, ctx.Rng.Next(6, 14)).ToList();
                        for (var i = 0; i < applicants.Count; i++)
                        {
                            var student = applicants[i];
                            var position = positionEntities[i % positionEntities.Count];
                            var status = (i % 4) switch
                            {
                                0 => RecruitmentApplicationStatuses.Accepted,
                                1 => RecruitmentApplicationStatuses.Rejected,
                                2 => RecruitmentApplicationStatuses.Pending,
                                _ => RecruitmentApplicationStatuses.AiSuggested,
                            };

                            var application = new StudentOrganizationRecruitmentApplication
                            {
                                StudentProfileId = student.Id,
                                OrganizationProfileId = org.Id,
                                CampaignId = campaign.Id,
                                PositionId = position.Id,
                                Status = status,
                                SubmittedAt = createdAt.AddDays(ctx.Rng.Next(1, 15)),
                                UpdatedAt = createdAt.AddDays(ctx.Rng.Next(16, 25)),
                                AcceptedAt = status == RecruitmentApplicationStatuses.Accepted
                                    ? createdAt.AddDays(ctx.Rng.Next(20, 28))
                                    : null,
                            };
                            db.StudentOrganizationRecruitmentApplications.Add(application);
                            await db.SaveChangesAsync();
                            ctx.Increment("student_organization_recruitment_applications");

                            db.StudentOrganizationRecruitmentApplicationAnswers.Add(
                                new StudentOrganizationRecruitmentApplicationAnswer
                                {
                                    ApplicationId = application.Id,
                                    QuestionId = campaignQuestion.Id,
                                    AnswerValue = $"I want to contribute my {student.Major} background to {org.AssociationName} and grow through hands-on community work.",
                                });
                            ctx.Increment("student_organization_recruitment_application_answers");

                            if (status == RecruitmentApplicationStatuses.Accepted)
                            {
                                db.StudentOrganizationRecruitmentApplicantAnalyses.Add(
                                    new StudentOrganizationRecruitmentApplicantAnalysis
                                    {
                                        PositionId = position.Id,
                                        TopK = 5,
                                        ResultsJson = JsonSerializer.Serialize(new[]
                                        {
                                            new { studentProfileId = student.Id, score = 88, reason = "Strong portfolio and relevant coursework" },
                                        }),
                                        CreatedAtUtc = application.SubmittedAt,
                                    });
                                ctx.Increment("student_organization_recruitment_applicant_analyses");
                            }
                        }
                    }
                }
            }

            await db.SaveChangesAsync();
        }

        private static async Task SeedOrgMembersAsync(ApplicationDbContext db, SeedContext ctx)
        {
            foreach (var org in ctx.Associations)
            {
                var leadership = ctx.PickMany(ctx.Students, 4).ToList();
                foreach (var (student, idx) in leadership.Select((s, i) => (s, i)))
                {
                    db.StudentOrganizationTeamMembers.Add(new StudentOrganizationTeamMember
                    {
                        OrganizationProfileId = org.Id,
                        StudentProfileId = student.Id,
                        FullName = ctx.GetUser(student.UserId).Name,
                        RoleTitle = idx == 0 ? "President" : idx == 1 ? "Vice President" : idx == 2 ? "Secretary" : "Treasurer",
                        DisplayOrder = idx,
                        Major = student.Major,
                        CreatedAt = ctx.DaysAgo(ctx.Rng.Next(60, 300)),
                    });
                    ctx.Increment("student_organization_team_members");
                }

                var members = ctx.PickMany(ctx.Students, 8).ToList();
                foreach (var student in members)
                {
                    db.StudentOrganizationMembers.Add(new StudentOrganizationMember
                    {
                        OrganizationProfileId = org.Id,
                        StudentProfileId = student.Id,
                        MembershipKind = OrganizationMembershipKinds.Member,
                        RoleTitle = "Active Member",
                        AcceptedAt = ctx.DaysAgo(ctx.Rng.Next(10, 200)),
                    });
                    ctx.Increment("student_organization_members");
                }
            }

            await db.SaveChangesAsync();
        }
    }
}
