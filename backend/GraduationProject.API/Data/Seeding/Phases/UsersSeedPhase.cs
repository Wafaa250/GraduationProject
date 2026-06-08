using System.Text.Json;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Data.Seeding.Phases
{
    internal static class UsersSeedPhase
    {
        public static async Task RunAsync(ApplicationDbContext db, SeedContext ctx)
        {
            await SeedMarkerAsync(db, ctx);
            await SeedStudentsAsync(db, ctx);
            await SeedDoctorsAsync(db, ctx);
            await SeedCompaniesAsync(db, ctx);
            await SeedAssociationsAsync(db, ctx);
            await SeedFollowsAsync(db, ctx);
        }

        private static async Task SeedMarkerAsync(ApplicationDbContext db, SeedContext ctx)
        {
            var marker = new User
            {
                Name = "SkillSwap Platform Seed",
                Email = SeedContext.SeedMarkerEmail,
                Password = SeedHelpers.HashPassword(SeedContext.DefaultPassword),
                Role = UserRoles.Admin,
                MustChangePassword = false,
                CreatedAt = ctx.DaysAgo(365),
            };
            db.Users.Add(marker);
            ctx.Users.Add(marker);
            ctx.TrackUser(marker);
            ctx.Increment("users");
            await db.SaveChangesAsync();
        }

        private static async Task SeedStudentsAsync(ApplicationDbContext db, SeedContext ctx)
        {
            var studentIndex = 0;
            var usedEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var (major, count, roles, tech, tools) in SeedCatalog.MajorDistribution)
            {
                for (var i = 0; i < count; i++)
                {
                    var first = SeedCatalog.FirstNames[studentIndex % SeedCatalog.FirstNames.Length];
                    var last = SeedCatalog.LastNames[(studentIndex / SeedCatalog.FirstNames.Length) % SeedCatalog.LastNames.Length];
                    var year = SeedCatalog.AcademicYears[Math.Min(studentIndex % 5, 4)];

                    var email = SeedHelpers.ToGmailAddress(SeedHelpers.StudentGmailLocal(first, last, studentIndex + 1));
                    while (!usedEmails.Add(email))
                    {
                        studentIndex++;
                        email = SeedHelpers.ToGmailAddress(SeedHelpers.StudentGmailLocal(first, last, studentIndex + 1));
                    }

                    var gpa = 2.8m + (decimal)(ctx.Rng.NextDouble() * 1.1);
                    var createdAt = ctx.DaysAgo(ctx.Rng.Next(30, 300));

                    var user = new User
                    {
                        Name = $"{first} {last}",
                        Email = email,
                        Password = SeedHelpers.HashPassword(SeedContext.DefaultPassword),
                        Role = UserRoles.Student,
                        MustChangePassword = false,
                        CreatedAt = createdAt,
                    };
                    db.Users.Add(user);
                    await db.SaveChangesAsync();
                    ctx.TrackUser(user);
                    ctx.Increment("users");

                    var rolesJson = await SeedHelpers.SkillsToIdsJsonAsync(db, roles, "role");
                    var techJson = await SeedHelpers.SkillsToIdsJsonAsync(db, tech, "technical");
                    var toolsJson = await SeedHelpers.SkillsToIdsJsonAsync(db, tools, "tool");

                    var profile = new StudentProfile
                    {
                        UserId = user.Id,
                        StudentId = $"20{22 + (studentIndex % 4)}{studentIndex:D4}",
                        University = NajahSeedConstants.UniversityName,
                        Faculty = NajahSeedConstants.UniversityFaculty,
                        Major = major,
                        AcademicYear = year,
                        Gpa = Math.Round(gpa, 2),
                        Bio = BuildStudentBio(first, major, year),
                        Availability = ctx.Rng.Next(3) switch
                        {
                            0 => "Available 15–20 hours per week",
                            1 => "Available evenings and weekends",
                            _ => "Available full-time during summer 2026",
                        },
                        LookingFor = ctx.Rng.Next(4) switch
                        {
                            0 => "Graduation project teammates",
                            1 => "Internship or capstone collaboration",
                            2 => "Research assistant opportunity",
                            _ => "Freelance project experience",
                        },
                        Github = $"https://github.com/{SeedHelpers.Slugify(first)}-{SeedHelpers.Slugify(last)}",
                        Linkedin = $"https://linkedin.com/in/{SeedHelpers.Slugify(first)}-{SeedHelpers.Slugify(last)}",
                        Portfolio = studentIndex % 3 == 0 ? $"https://{SeedHelpers.Slugify(first)}{SeedHelpers.Slugify(last)}.dev" : null,
                        Languages = JsonSerializer.Serialize(new[] { "English", "Arabic" }),
                        Tools = toolsJson,
                        Roles = rolesJson,
                        TechnicalSkills = techJson,
                    };
                    db.StudentProfiles.Add(profile);
                    await db.SaveChangesAsync();

                    foreach (var skillName in tech.Concat(tools).Distinct())
                    {
                        var skill = await db.Skills.FirstAsync(s => s.Name == skillName);
                        db.StudentSkills.Add(new StudentSkill
                        {
                            StudentId = profile.Id,
                            SkillId = skill.Id,
                            Level = ctx.Rng.Next(2, 5),
                        });
                        ctx.Increment("student_skills");
                    }

                    ctx.Users.Add(user);
                    ctx.Students.Add(profile);
                    ctx.Increment("student_profiles");
                    studentIndex++;
                }
            }

            await db.SaveChangesAsync();
        }

        private static string BuildStudentBio(string first, string major, string year) =>
            $"{first} is a {year.ToLower()} {major} student at {NajahSeedConstants.UniversityName}, actively building portfolio projects and seeking meaningful collaboration with peers, faculty, and industry partners.";

        private static async Task SeedDoctorsAsync(ApplicationDbContext db, SeedContext ctx)
        {
            var usedDoctorEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var (name, specialization, department, research, technical) in SeedCatalog.DoctorDefs)
            {
                var slug = SeedHelpers.Slugify(name.Replace("Dr. ", ""));
                var email = SeedHelpers.ToGmailAddress(SeedHelpers.DoctorGmailLocal(slug));
                while (!usedDoctorEmails.Add(email))
                    email = SeedHelpers.ToGmailAddress($"{SeedHelpers.DoctorGmailLocal(slug)}-{usedDoctorEmails.Count}");

                var user = new User
                {
                    Name = name,
                    Email = email,
                    Password = SeedHelpers.HashPassword(SeedContext.DefaultPassword),
                    Role = UserRoles.Doctor,
                    MustChangePassword = false,
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(200, 800)),
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
                ctx.TrackUser(user);

                var profile = new DoctorProfile
                {
                    UserId = user.Id,
                    Specialization = specialization,
                    Department = department,
                    University = NajahSeedConstants.UniversityName,
                    Faculty = NajahSeedConstants.UniversityFaculty,
                    SupervisionCapacity = ctx.Rng.Next(3, 8),
                    Bio = $"{name} is an {NajahSeedConstants.UniversityName} faculty member supervising graduation projects in {specialization.ToLower()} and mentoring student research teams.",
                    YearsOfExperience = ctx.Rng.Next(8, 22),
                    Linkedin = $"https://linkedin.com/in/{slug}",
                    OfficeHours = "Sunday & Tuesday 10:00–12:00, Wednesday 14:00–16:00",
                    TechnicalSkills = SeedHelpers.SkillsToNamesJson(technical),
                    ResearchSkills = SeedHelpers.SkillsToNamesJson(research),
                };
                db.DoctorProfiles.Add(profile);
                await db.SaveChangesAsync();

                ctx.Users.Add(user);
                ctx.Doctors.Add(profile);
                ctx.Increment("users");
                ctx.Increment("doctor_profiles");
            }
        }

        private static async Task SeedCompaniesAsync(ApplicationDbContext db, SeedContext ctx)
        {
            foreach (var (name, email, domain, industry, location, description, interests) in SeedCatalog.CompanyDefs)
            {
                var ownerName = name.Split(' ')[0] switch
                {
                    "ASAL" => "Nadine Khoury",
                    "EXALT" => "Rami Saleh",
                    "Foothill" => "Lina Odeh",
                    "Dimensions" => "Karim Nassar",
                    "Unit" => "Samer Awad",
                    "iConnect" => "Hiba Mansour",
                    "Bisan" => "Yazan Hamad",
                    "ProGineer" => "Tamer Qasem",
                    "MobiTech" => "Dalia Saca",
                    "DataBridge" => "Omar Farah",
                    "SecurePath" => "Nabil Hijazi",
                    "CloudNine" => "Maya Darwish",
                    "GreenCode" => "Fadi Barakat",
                    "PITA" when name.Contains("CodeCraft") => "Suhad Najjar",
                    _ => "Hala Sabbagh",
                };

                var user = new User
                {
                    Name = ownerName,
                    Email = email.ToLower(),
                    Password = SeedHelpers.HashPassword(SeedContext.DefaultPassword),
                    Role = UserRoles.Company,
                    MustChangePassword = false,
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(100, 500)),
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
                ctx.TrackUser(user);

                var profile = new CompanyProfile
                {
                    UserId = user.Id,
                    CompanyName = name,
                    NormalizedCompanyName = CompanyUniquenessHelper.NormalizeCompanyName(name),
                    PrimaryEmailDomain = domain,
                    WebsiteDomain = domain,
                    Industry = industry,
                    Description = description,
                    Location = location,
                    HeadquartersLocation = location,
                    WorkingStyle = ctx.Pick(new[] { "Remote", "Hybrid", "On-site", "Hybrid-first" }),
                    AreasOfInterest = SkillHelper.ToJsonOrNull(interests),
                    WebsiteUrl = $"https://www.{domain}",
                    LinkedInUrl = $"https://www.linkedin.com/company/{SeedHelpers.Slugify(name)}",
                    ContactEmail = email,
                    OptionalContactLink = $"mailto:{email}",
                };
                db.CompanyProfiles.Add(profile);
                await db.SaveChangesAsync();

                db.CompanyMembers.Add(new CompanyMember
                {
                    UserId = user.Id,
                    CompanyProfileId = profile.Id,
                    Role = CompanyMemberRoles.Owner,
                    CreatedAt = user.CreatedAt,
                });
                db.CompanyMemberNotificationPreferences.Add(new CompanyMemberNotificationPreference
                {
                    CompanyProfileId = profile.Id,
                    UserId = user.Id,
                    UpdatedAt = ctx.Now,
                });
                ctx.Increment("company_members");
                ctx.Increment("company_member_notification_preferences");

                // Add one workspace member per company
                var memberFirst = ctx.Pick(SeedCatalog.FirstNames);
                var memberLast = ctx.Pick(SeedCatalog.LastNames);
                var memberEmail = $"{memberFirst.ToLower()}.{memberLast.ToLower()}@{domain}";
                var memberUser = new User
                {
                    Name = $"{memberFirst} {memberLast}",
                    Email = memberEmail,
                    Password = SeedHelpers.HashPassword(SeedContext.DefaultPassword),
                    Role = UserRoles.CompanyMember,
                    MustChangePassword = true,
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(30, 120)),
                };
                db.Users.Add(memberUser);
                await db.SaveChangesAsync();
                ctx.TrackUser(memberUser);

                db.CompanyMembers.Add(new CompanyMember
                {
                    UserId = memberUser.Id,
                    CompanyProfileId = profile.Id,
                    Role = CompanyMemberRoles.Member,
                    CreatedAt = memberUser.CreatedAt,
                });
                db.CompanyMemberNotificationPreferences.Add(new CompanyMemberNotificationPreference
                {
                    CompanyProfileId = profile.Id,
                    UserId = memberUser.Id,
                    UpdatedAt = ctx.Now,
                });
                ctx.Increment("users", 2);
                ctx.Increment("company_profiles");
                ctx.Increment("company_members", 2);
                ctx.Increment("company_member_notification_preferences", 2);

                ctx.Users.Add(user);
                ctx.Users.Add(memberUser);
                ctx.Companies.Add(profile);
            }

            await db.SaveChangesAsync();
        }

        private static async Task SeedAssociationsAsync(ApplicationDbContext db, SeedContext ctx)
        {
            foreach (var (name, username, category, faculty, description) in SeedCatalog.AssociationDefs)
            {
                var email = $"{username}@orgs.skillswap.ps";
                var user = new User
                {
                    Name = name,
                    Email = email,
                    Password = SeedHelpers.HashPassword(SeedContext.DefaultPassword),
                    Role = UserRoles.StudentAssociation,
                    MustChangePassword = false,
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(60, 400)),
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
                ctx.TrackUser(user);

                var profile = new StudentAssociationProfile
                {
                    UserId = user.Id,
                    AssociationName = name,
                    Username = username,
                    Email = email,
                    Description = description,
                    Faculty = faculty,
                    Category = category,
                    LogoUrl = null,
                    InstagramUrl = $"https://instagram.com/{username}",
                    FacebookUrl = $"https://facebook.com/{username}",
                    LinkedInUrl = $"https://linkedin.com/company/{username}",
                    IsVerified = ctx.Rng.Next(3) != 0,
                    CreatedAt = user.CreatedAt,
                };
                db.StudentAssociationProfiles.Add(profile);
                await db.SaveChangesAsync();

                ctx.Users.Add(user);
                ctx.Associations.Add(profile);
                ctx.Increment("users");
                ctx.Increment("student_association_profiles");
            }

            await db.SaveChangesAsync();
        }

        private static async Task SeedFollowsAsync(ApplicationDbContext db, SeedContext ctx)
        {
            foreach (var student in ctx.PickMany(ctx.Students, 40))
            {
                var org = ctx.Pick(ctx.Associations);
                db.OrganizationFollows.Add(new OrganizationFollow
                {
                    OrganizationProfileId = org.Id,
                    StudentProfileId = student.Id,
                    FollowedAt = ctx.DaysAgo(ctx.Rng.Next(1, 90)),
                });
                ctx.Increment("organization_follows");
            }

            foreach (var student in ctx.PickMany(ctx.Students, 35))
            {
                var company = ctx.Pick(ctx.Companies);
                db.CompanyFollows.Add(new CompanyFollow
                {
                    CompanyProfileId = company.Id,
                    StudentProfileId = student.Id,
                    FollowedAt = ctx.DaysAgo(ctx.Rng.Next(1, 60)),
                });
                ctx.Increment("company_follows");
            }

            await db.SaveChangesAsync();
        }
    }
}
