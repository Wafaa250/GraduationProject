using System.Text.Json;
using GraduationProject.API.Data;
using GraduationProject.API.Models;

namespace GraduationProject.API.Data.Seeding.Phases
{
    internal static class AcademicSeedPhase
    {
        public static async Task RunAsync(ApplicationDbContext db, SeedContext ctx)
        {
            await SeedGraduationProjectsAsync(db, ctx);
            await SeedCoursesAsync(db, ctx);
        }

        private static async Task SeedGraduationProjectsAsync(ApplicationDbContext db, SeedContext ctx)
        {
            var owners = ctx.PickMany(ctx.Students, SeedCatalog.ProjectDefs.Length).ToList();
            var doctorPool = ctx.Doctors.ToList();

            for (var i = 0; i < SeedCatalog.ProjectDefs.Length; i++)
            {
                var def = SeedCatalog.ProjectDefs[i];
                var owner = owners[i];
                var createdAt = ctx.DaysAgo(ctx.Rng.Next(20, 180));

                var project = new StudentProject
                {
                    OwnerId = owner.Id,
                    Name = def.Name,
                    Abstract = def.Abstract,
                    ProjectType = def.Type,
                    RequiredSkills = JsonSerializer.Serialize(def.Skills),
                    PartnersCount = def.Partners,
                    CreatedAt = createdAt,
                    UpdatedAt = createdAt,
                };

                db.StudentProjects.Add(project);
                await db.SaveChangesAsync();

                db.StudentProjectMembers.Add(new StudentProjectMember
                {
                    ProjectId = project.Id,
                    StudentId = owner.Id,
                    Role = "leader",
                    JoinedAt = createdAt,
                });
                ctx.Increment("graduation_project_members");

                var isComputerEngineering = string.Equals(owner.Major, "Computer Engineering", StringComparison.Ordinal);
                if (isComputerEngineering)
                    project.PartnersCount = 2;

                var teamSize = isComputerEngineering ? 2 : Math.Min(def.Partners, 4);
                var teammatePool = ctx.Students.Where(s => s.Id != owner.Id).ToList();
                if (isComputerEngineering)
                {
                    var cePool = teammatePool.Where(s => string.Equals(s.Major, "Computer Engineering", StringComparison.Ordinal)).ToList();
                    if (cePool.Count > 0) teammatePool = cePool;
                }
                var teammates = ctx.PickMany(teammatePool, teamSize - 1).ToList();
                foreach (var mate in teammates)
                {
                    db.StudentProjectMembers.Add(new StudentProjectMember
                    {
                        ProjectId = project.Id,
                        StudentId = mate.Id,
                        Role = "member",
                        JoinedAt = createdAt.AddDays(ctx.Rng.Next(1, 14)),
                    });
                    ctx.Increment("graduation_project_members");
                }

                // Supervisor for ~60% of projects
                if (i % 5 != 4 && doctorPool.Count > 0)
                {
                    var doctor = doctorPool[i % doctorPool.Count];
                    if (i % 3 == 0)
                    {
                        project.SupervisorId = doctor.Id;
                        db.SupervisorRequests.Add(new SupervisorRequest
                        {
                            ProjectId = project.Id,
                            DoctorId = doctor.Id,
                            SenderId = owner.Id,
                            Status = "accepted",
                            CreatedAt = createdAt.AddDays(5),
                            RespondedAt = createdAt.AddDays(7),
                        });
                        ctx.Increment("supervisor_requests");
                    }
                    else if (i % 3 == 1)
                    {
                        db.SupervisorRequests.Add(new SupervisorRequest
                        {
                            ProjectId = project.Id,
                            DoctorId = doctor.Id,
                            SenderId = owner.Id,
                            Status = "pending",
                            CreatedAt = ctx.DaysAgo(ctx.Rng.Next(3, 10)),
                        });
                        ctx.Increment("supervisor_requests");
                    }
                    else
                    {
                        db.SupervisorRequests.Add(new SupervisorRequest
                        {
                            ProjectId = project.Id,
                            DoctorId = doctor.Id,
                            SenderId = owner.Id,
                            Status = "rejected",
                            CreatedAt = ctx.DaysAgo(ctx.Rng.Next(20, 40)),
                            RespondedAt = ctx.DaysAgo(ctx.Rng.Next(10, 19)),
                        });
                        ctx.Increment("supervisor_requests");
                    }
                }

                // Invitations: pending, accepted, and rejected across projects
                if (i % 2 == 0)
                {
                    var invitee = ctx.Students.First(s =>
                        s.Id != owner.Id && teammates.All(t => t.Id != s.Id));
                    var status = (i % 6) switch
                    {
                        0 => "pending",
                        2 => "accepted",
                        4 => "rejected",
                        _ => "cancelled",
                    };
                    db.ProjectInvitations.Add(new ProjectInvitation
                    {
                        ProjectId = project.Id,
                        SenderId = owner.Id,
                        ReceiverId = invitee.Id,
                        Status = status,
                        CreatedAt = ctx.DaysAgo(ctx.Rng.Next(2, 15)),
                        RespondedAt = status == "pending" ? null : ctx.DaysAgo(ctx.Rng.Next(1, 5)),
                    });
                    ctx.Increment("project_invitations");
                }

                ctx.GraduationProjects.Add(project);
                ctx.Increment("graduation_projects");
            }

            await db.SaveChangesAsync();
        }

        private static async Task SeedCoursesAsync(ApplicationDbContext db, SeedContext ctx)
        {
            for (var i = 0; i < SeedCatalog.CourseDefs.Length; i++)
            {
                var def = SeedCatalog.CourseDefs[i];
                var doctor = ctx.Doctors[i % ctx.Doctors.Count];

                var course = new Course
                {
                    Name = def.Name,
                    Code = def.Code,
                    Semester = def.Semester,
                    DoctorId = doctor.Id,
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(60, 200)),
                };
                db.Courses.Add(course);
                await db.SaveChangesAsync();
                ctx.Courses.Add(course);
                ctx.Increment("courses");

                var sections = new List<CourseSection>();
                for (var s = 0; s < 2; s++)
                {
                    var section = new CourseSection
                    {
                        CourseId = course.Id,
                        Name = $"Section {(char)('A' + s)}",
                        Days = JsonSerializer.Serialize(s == 0 ? new[] { "Sunday", "Tuesday" } : new[] { "Monday", "Wednesday" }),
                        TimeFrom = s == 0 ? "10:00" : "12:00",
                        TimeTo = s == 0 ? "11:30" : "13:30",
                        Capacity = 35,
                    };
                    db.CourseSections.Add(section);
                    sections.Add(section);
                    ctx.Increment("course_sections");
                }
                await db.SaveChangesAsync();
                ctx.CourseSections.AddRange(sections);

                var enrolled = ctx.PickMany(ctx.Students, ctx.Rng.Next(12, 20)).ToList();
                foreach (var student in enrolled)
                {
                    var section = sections[student.Id % sections.Count];
                    db.SectionEnrollments.Add(new SectionEnrollment
                    {
                        CourseSectionId = section.Id,
                        StudentProfileId = student.Id,
                    });
                    ctx.Increment("section_enrollments");

                    if (ctx.Rng.Next(3) == 0)
                    {
                        db.SectionChatMessages.Add(new SectionChatMessage
                        {
                            CourseSectionId = section.Id,
                            SenderUserId = student.UserId,
                            Text = ctx.Pick(SeedCatalog.MessageTemplates),
                            SentAt = ctx.DaysAgo(ctx.Rng.Next(1, 20)),
                        });
                        ctx.Increment("section_chat_messages");
                    }
                }

                var project = new CourseProject
                {
                    CourseId = course.Id,
                    Title = $"{def.Name} Capstone Assignment",
                    Description = $"Team-based deliverable for {def.Name} covering design, implementation, and presentation.",
                    TeamSize = 4,
                    ApplyToAllSections = true,
                    AllowCrossSectionTeams = i % 2 == 0,
                    AiMode = i % 3 == 0 ? "student" : "doctor",
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(30, 90)),
                };
                db.CourseProjects.Add(project);
                await db.SaveChangesAsync();
                ctx.CourseProjects.Add(project);
                ctx.Increment("course_projects");

                for (var t = 0; t < 3; t++)
                {
                    var team = new CourseTeam
                    {
                        CourseProjectId = project.Id,
                        TeamIndex = t,
                        CreatedAt = project.CreatedAt.AddDays(t + 1),
                    };
                    db.CourseTeams.Add(team);
                    await db.SaveChangesAsync();
                    ctx.CourseTeams.Add(team);
                    ctx.Increment("course_teams");

                    var members = ctx.PickMany(enrolled, 4).ToList();
                    foreach (var member in members)
                    {
                        db.CourseTeamMembers.Add(new CourseTeamMember
                        {
                            CourseTeamId = team.Id,
                            StudentProfileId = member.Id,
                            UserId = member.UserId,
                            MatchScore = 70 + ctx.Rng.Next(0, 28),
                        });
                        ctx.Increment("course_team_members");
                    }

                    var conversation = new Conversation
                    {
                        Title = $"{def.Code} Team {t + 1}",
                        CourseTeamId = team.Id,
                        CreatedAt = team.CreatedAt,
                    };
                    db.Conversations.Add(conversation);
                    await db.SaveChangesAsync();
                    ctx.Conversations.Add(conversation);
                    ctx.Increment("conversations");

                    foreach (var member in members)
                    {
                        db.ConversationUsers.Add(new ConversationUser
                        {
                            ConversationId = conversation.Id,
                            UserId = member.UserId,
                        });
                        ctx.Increment("conversation_users");
                    }

                    for (var m = 0; m < 5; m++)
                    {
                        var sender = members[m % members.Count];
                        db.CourseTeamMessages.Add(new CourseTeamMessage
                        {
                            CourseTeamId = team.Id,
                            SenderUserId = sender.UserId,
                            Text = ctx.Pick(SeedCatalog.MessageTemplates),
                            SentAt = team.CreatedAt.AddHours(m * 6 + ctx.Rng.Next(1, 5)),
                        });
                        ctx.Increment("course_team_messages");

                        db.Messages.Add(new Message
                        {
                            ConversationId = conversation.Id,
                            SenderId = sender.UserId,
                            Text = ctx.Pick(SeedCatalog.MessageTemplates),
                            CreatedAt = team.CreatedAt.AddHours(m * 6 + ctx.Rng.Next(1, 5)),
                            Seen = m < 4,
                        });
                        ctx.Increment("messages");
                    }
                }
            }

            await db.SaveChangesAsync();
        }
    }
}
