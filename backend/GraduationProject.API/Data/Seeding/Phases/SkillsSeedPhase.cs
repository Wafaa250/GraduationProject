using GraduationProject.API.Data;
using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GraduationProject.API.Data.Seeding.Phases
{
    internal static class SkillsSeedPhase
    {
        public static async Task RunAsync(ApplicationDbContext db, SeedContext ctx)
        {
            var existing = await db.Skills.ToDictionaryAsync(s => s.Name, StringComparer.OrdinalIgnoreCase);
            var toolNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Git", "Docker", "Figma", "Jira", "Jupyter", "Postman", "Wireshark", "Keil", "IntelliJ", "VMware",
            };

            foreach (var name in SeedCatalog.AllSkillNames.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                if (existing.ContainsKey(name))
                {
                    ctx.Skills.Add(existing[name]);
                    continue;
                }

                var category = toolNames.Contains(name) ? "tool"
                    : name.Contains("Developer", StringComparison.OrdinalIgnoreCase)
                      || name.Contains("Engineer", StringComparison.OrdinalIgnoreCase)
                      || name.Contains("Designer", StringComparison.OrdinalIgnoreCase)
                      || name.Contains("Analyst", StringComparison.OrdinalIgnoreCase)
                        ? "role"
                        : "technical";

                var skill = new Skill { Name = name, Category = category };
                db.Skills.Add(skill);
                existing[name] = skill;
                ctx.Skills.Add(skill);
                ctx.Increment("skills");
            }

            await db.SaveChangesAsync();
        }
    }
}
