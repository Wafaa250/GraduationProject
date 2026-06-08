using System.Text.Json;
using GraduationProject.API.Data;
using GraduationProject.API.Helpers;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Data.Seeding.Phases
{
    internal static class ExpansionUsersPhase
    {
        public static async Task RunAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            await AddStudentsAsync(db, ctx);
            await AddDoctorsAsync(db, ctx);
            await AddCompaniesAsync(db, ctx);
            await AddAssociationsAsync(db, ctx);
            await AddFollowsAsync(db, ctx);
            await AddExpansionMarkerAsync(db, ctx);
        }

        private static async Task AddExpansionMarkerAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            if (ctx.ExistingEmails.Contains(ExpansionContext.ExpansionMarkerEmail))
                return;

            var marker = new User
            {
                Name = "SkillSwap Expansion Seed",
                Email = ExpansionContext.ExpansionMarkerEmail,
                Password = SeedHelpers.HashPassword(SeedContext.DefaultPassword),
                Role = UserRoles.Admin,
                MustChangePassword = false,
                CreatedAt = ctx.DaysAgo(180),
            };
            db.Users.Add(marker);
            ctx.TrackUser(marker);
            ctx.Increment("users");
            await db.SaveChangesAsync();
        }

        private static async Task AddStudentsAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            var toAdd = Math.Max(0, ExpansionCatalog.TargetStudents - ctx.Students.Count);
            if (toAdd == 0) return;

            var startIndex = ctx.Students.Count + 100;
            for (var n = 0; n < toAdd; n++)
            {
                var idx = startIndex + n;
                var majorEntry = SeedCatalog.MajorDistribution[idx % SeedCatalog.MajorDistribution.Length];
                var (major, _, roles, tech, tools) = majorEntry;
                var first = SeedCatalog.FirstNames[idx % SeedCatalog.FirstNames.Length];
                var last = SeedCatalog.LastNames[(idx / 3) % SeedCatalog.LastNames.Length];
                var year = SeedCatalog.AcademicYears[idx % SeedCatalog.AcademicYears.Length];
                var email = ctx.UniqueEmail($"exp.{SeedHelpers.Slugify(first)}.{SeedHelpers.Slugify(last)}{idx}", NajahSeedConstants.StudentDoctorEmailDomain);

                var user = new User
                {
                    Name = $"{first} {last}",
                    Email = email,
                    Password = SeedHelpers.HashPassword(SeedContext.DefaultPassword),
                    Role = UserRoles.Student,
                    MustChangePassword = false,
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(60, 900)),
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
                ctx.TrackUser(user);
                ctx.Increment("users");

                var rolesJson = await SeedHelpers.SkillsToIdsJsonAsync(db, roles.Concat(tech.Take(1)).ToList(), "role");
                var techJson = await SeedHelpers.SkillsToIdsJsonAsync(db, tech.ToList(), "technical");
                var toolsJson = await SeedHelpers.SkillsToIdsJsonAsync(db, tools.ToList(), "tool");

                var profile = new StudentProfile
                {
                    UserId = user.Id,
                    StudentId = $"20{20 + (idx % 6)}{idx:D4}",
                    University = NajahSeedConstants.UniversityName,
                    Faculty = NajahSeedConstants.UniversityFaculty,
                    Major = major,
                    AcademicYear = year,
                    Gpa = Math.Round(2.65m + (decimal)(ctx.Rng.NextDouble() * 1.25), 2),
                    Bio = $"{first} is a {year.ToLower()} {major} student at {NajahSeedConstants.UniversityName} building portfolio projects in Palestinian tech ecosystems.",
                    Availability = ctx.Pick(new[] { "Available 10–15 hours per week", "Available evenings", "Summer internship availability", "Part-time during semester" }),
                    LookingFor = ctx.Pick(new[] { "Graduation project teammates", "Research assistant role", "Industry capstone", "Hackathon team", "Freelance experience" }),
                    Github = $"https://github.com/{SeedHelpers.Slugify(first)}-{SeedHelpers.Slugify(last)}-ps",
                    Linkedin = $"https://linkedin.com/in/{SeedHelpers.Slugify(first)}-{SeedHelpers.Slugify(last)}",
                    Portfolio = idx % 4 == 0 ? $"https://{SeedHelpers.Slugify(first)}{idx}.dev" : null,
                    Languages = JsonSerializer.Serialize(new[] { "English", "Arabic" }),
                    Tools = toolsJson,
                    Roles = rolesJson,
                    TechnicalSkills = techJson,
                };
                db.StudentProfiles.Add(profile);
                await db.SaveChangesAsync();
                ctx.Students.Add(profile);

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
                ctx.Increment("student_profiles");
            }
            await db.SaveChangesAsync();
        }

        private static async Task AddDoctorsAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            var toAdd = Math.Max(0, ExpansionCatalog.TargetDoctors - ctx.Doctors.Count);
            foreach (var def in ExpansionCatalog.AdditionalDoctors.Take(toAdd))
            {
                var (name, specialization, department, research, technical) = def;
                var slug = SeedHelpers.Slugify(name.Replace("Dr. ", ""));
                var email = ctx.UniqueEmail(SeedHelpers.DoctorGmailLocal(slug, expansion: true), NajahSeedConstants.StudentDoctorEmailDomain);

                var user = new User
                {
                    Name = name,
                    Email = email,
                    Password = SeedHelpers.HashPassword(SeedContext.DefaultPassword),
                    Role = UserRoles.Doctor,
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(400, 1200)),
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
                ctx.TrackUser(user);
                ctx.Increment("users");

                var profile = new DoctorProfile
                {
                    UserId = user.Id,
                    Specialization = specialization,
                    Department = department,
                    University = NajahSeedConstants.UniversityName,
                    Faculty = NajahSeedConstants.UniversityFaculty,
                    SupervisionCapacity = ctx.Rng.Next(4, 10),
                    Bio = $"{name} is an {NajahSeedConstants.UniversityName} faculty member supervising capstone teams and research groups in {specialization.ToLower()}.",
                    YearsOfExperience = ctx.Rng.Next(10, 28),
                    Linkedin = $"https://linkedin.com/in/{slug}",
                    OfficeHours = "Sunday & Wednesday 09:00–11:00",
                    TechnicalSkills = SeedHelpers.SkillsToNamesJson(technical),
                    ResearchSkills = SeedHelpers.SkillsToNamesJson(research),
                };
                db.DoctorProfiles.Add(profile);
                await db.SaveChangesAsync();
                ctx.Doctors.Add(profile);
                ctx.Increment("doctor_profiles");
            }
        }

        private static async Task AddCompaniesAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            var existingNames = ctx.Companies
                .Select(c => c.NormalizedCompanyName)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var toAdd = Math.Max(0, ExpansionCatalog.TargetCompanies - ctx.Companies.Count);
            foreach (var def in ExpansionCatalog.AdditionalCompanies.Take(toAdd))
            {
                var normalized = CompanyUniquenessHelper.NormalizeCompanyName(def.Name);
                if (existingNames.Contains(normalized)) continue;
                existingNames.Add(normalized);

                var ownerFirst = ctx.Pick(SeedCatalog.FirstNames);
                var ownerLast = ctx.Pick(SeedCatalog.LastNames);
                var email = ctx.UniqueEmail(def.Email.Split('@')[0], def.Domain);

                var user = new User
                {
                    Name = $"{ownerFirst} {ownerLast}",
                    Email = email,
                    Password = SeedHelpers.HashPassword(SeedContext.DefaultPassword),
                    Role = UserRoles.Company,
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(200, 700)),
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
                ctx.TrackUser(user);
                ctx.Increment("users");

                var profile = new CompanyProfile
                {
                    UserId = user.Id,
                    CompanyName = def.Name,
                    NormalizedCompanyName = normalized,
                    PrimaryEmailDomain = def.Domain,
                    WebsiteDomain = def.Domain,
                    Industry = def.Industry,
                    Description = def.Description,
                    Location = def.Location,
                    HeadquartersLocation = def.Location,
                    WorkingStyle = ctx.Pick(new[] { "Hybrid", "Remote", "On-site", "Hybrid-first" }),
                    AreasOfInterest = SkillHelper.ToJsonOrNull(def.Interests),
                    WebsiteUrl = $"https://www.{def.Domain}",
                    LinkedInUrl = $"https://www.linkedin.com/company/{SeedHelpers.Slugify(def.Name)}",
                    ContactEmail = email,
                };
                db.CompanyProfiles.Add(profile);
                await db.SaveChangesAsync();
                ctx.Companies.Add(profile);
                ctx.Increment("company_profiles");

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

                for (var m = 0; m < ctx.Rng.Next(2, 4); m++)
                {
                    var mf = ctx.Pick(SeedCatalog.FirstNames);
                    var ml = ctx.Pick(SeedCatalog.LastNames);
                    var memberEmail = ctx.UniqueEmail($"exp.{SeedHelpers.Slugify(mf)}.{SeedHelpers.Slugify(ml)}", def.Domain);
                    var memberUser = new User
                    {
                        Name = $"{mf} {ml}",
                        Email = memberEmail,
                        Password = SeedHelpers.HashPassword(SeedContext.DefaultPassword),
                        Role = UserRoles.CompanyMember,
                        MustChangePassword = true,
                        CreatedAt = ctx.DaysAgo(ctx.Rng.Next(30, 200)),
                    };
                    db.Users.Add(memberUser);
                    await db.SaveChangesAsync();
                    ctx.TrackUser(memberUser);
                    ctx.Increment("users");

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
                    ctx.Increment("company_members", 2);
                    ctx.Increment("company_member_notification_preferences");
                }
            }
            await db.SaveChangesAsync();
        }

        private static async Task AddAssociationsAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            var existingUsernames = ctx.Associations.Select(a => a.Username).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var toAdd = Math.Max(0, ExpansionCatalog.TargetAssociations - ctx.Associations.Count);

            foreach (var def in ExpansionCatalog.AdditionalAssociations.Take(toAdd))
            {
                if (existingUsernames.Contains(def.Username)) continue;
                existingUsernames.Add(def.Username);

                var email = ctx.UniqueEmail($"exp.{def.Username}", "orgs.skillswap.ps");
                var user = new User
                {
                    Name = def.Name,
                    Email = email,
                    Password = SeedHelpers.HashPassword(SeedContext.DefaultPassword),
                    Role = UserRoles.StudentAssociation,
                    CreatedAt = ctx.DaysAgo(ctx.Rng.Next(100, 600)),
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
                ctx.TrackUser(user);
                ctx.Increment("users");

                var profile = new StudentAssociationProfile
                {
                    UserId = user.Id,
                    AssociationName = def.Name,
                    Username = def.Username,
                    Email = email,
                    Description = def.Description,
                    Faculty = def.Faculty,
                    Category = def.Category,
                    IsVerified = ctx.Rng.Next(3) != 0,
                    CreatedAt = user.CreatedAt,
                };
                db.StudentAssociationProfiles.Add(profile);
                await db.SaveChangesAsync();
                ctx.Associations.Add(profile);
                ctx.Increment("student_association_profiles");
            }
            await db.SaveChangesAsync();
        }

        private static async Task AddFollowsAsync(ApplicationDbContext db, ExpansionContext ctx)
        {
            var newStudents = ctx.Students.TakeLast(Math.Min(120, ctx.Students.Count)).ToList();
            foreach (var student in newStudents)
            {
                if (ctx.Rng.Next(2) == 0)
                {
                    var org = ctx.Pick(ctx.Associations);
                    if (ctx.ExistingOrgFollows.Add((org.Id, student.Id)))
                    {
                        db.OrganizationFollows.Add(new OrganizationFollow
                        {
                            OrganizationProfileId = org.Id,
                            StudentProfileId = student.Id,
                            FollowedAt = ctx.DaysAgo(ctx.Rng.Next(1, 120)),
                        });
                        ctx.Increment("organization_follows");
                    }
                }
                if (ctx.Rng.Next(2) == 0)
                {
                    var company = ctx.Pick(ctx.Companies);
                    if (ctx.ExistingCompanyFollows.Add((company.Id, student.Id)))
                    {
                        db.CompanyFollows.Add(new CompanyFollow
                        {
                            CompanyProfileId = company.Id,
                            StudentProfileId = student.Id,
                            FollowedAt = ctx.DaysAgo(ctx.Rng.Next(1, 90)),
                        });
                        ctx.Increment("company_follows");
                    }
                }
            }
            await db.SaveChangesAsync();
        }
    }
}
