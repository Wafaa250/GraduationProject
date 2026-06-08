using GraduationProject.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GraduationProject.API.Data.Seeding
{
    public sealed class ComputerEngineeringTeamSizeFixResult
    {
        public bool Success { get; set; }
        public string? Error { get; init; }
        public TimeSpan Duration { get; set; }
        public int ProjectsUpdated { get; set; }
        public List<string> ResizedProjects { get; } = new();
        public Dictionary<int, int> TeamSizeDistribution { get; } = new();
    }

    /// <summary>Data-only fix: CE graduation projects must have exactly 2 student members.</summary>
    public sealed class ComputerEngineeringTeamSizeFix
    {
        public const string TargetMajor = "Computer Engineering";
        public const int TargetTeamSize = 2;

        private readonly ApplicationDbContext _db;
        private readonly ILogger<ComputerEngineeringTeamSizeFix> _logger;

        public ComputerEngineeringTeamSizeFix(ApplicationDbContext db, ILogger<ComputerEngineeringTeamSizeFix> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<ComputerEngineeringTeamSizeFixResult> FixAsync(CancellationToken cancellationToken = default)
        {
            var started = DateTime.UtcNow;
            var result = new ComputerEngineeringTeamSizeFixResult();
            await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                var ceStudentIds = (await _db.StudentProfiles.AsNoTracking()
                    .Where(s => s.Major == TargetMajor)
                    .Select(s => s.Id)
                    .ToListAsync(cancellationToken))
                    .ToHashSet();

                var ceProjects = await _db.StudentProjects
                    .Include(p => p.Members)
                    .Where(p => ceStudentIds.Contains(p.OwnerId))
                    .OrderBy(p => p.Id)
                    .ToListAsync(cancellationToken);

                var membershipRows = await _db.StudentProjectMembers.ToListAsync(cancellationToken);
                var membersByProject = membershipRows.GroupBy(m => m.ProjectId).ToDictionary(g => g.Key, g => g.ToList());
                var projectsByStudent = membershipRows.GroupBy(m => m.StudentId)
                    .ToDictionary(g => g.Key, g => g.Select(m => m.ProjectId).ToHashSet());

                bool IsMember(int projectId, int studentId) =>
                    membersByProject.TryGetValue(projectId, out var list) &&
                    list.Any(m => m.StudentId == studentId);

                var surplusPool = new Queue<int>();

                var initialCounts = ceProjects.ToDictionary(p => p.Id, p => membersByProject.GetValueOrDefault(p.Id)?.Count ?? 0);

                foreach (var project in ceProjects)
                {
                    if (!membersByProject.TryGetValue(project.Id, out var members))
                    {
                        members = new List<StudentProjectMember>();
                        membersByProject[project.Id] = members;
                    }

                    var count = members.Count;
                    if (count == TargetTeamSize) continue;

                    if (count > TargetTeamSize)
                    {
                        var leader = members.FirstOrDefault(m => m.Role == "leader") ??
                                     members.First(m => m.StudentId == project.OwnerId);
                        var keeper = members
                            .Where(m => m.StudentId != leader.StudentId)
                            .OrderByDescending(m => ceStudentIds.Contains(m.StudentId))
                            .ThenBy(m => m.JoinedAt)
                            .FirstOrDefault();

                        var toRemove = members
                            .Where(m => m.StudentId != leader.StudentId &&
                                        (keeper == null || m.StudentId != keeper.StudentId))
                            .ToList();

                        foreach (var row in toRemove)
                        {
                            _db.StudentProjectMembers.Remove(row);
                            members.Remove(row);
                            if (projectsByStudent.TryGetValue(row.StudentId, out var set))
                                set.Remove(project.Id);
                            if (ceStudentIds.Contains(row.StudentId))
                                surplusPool.Enqueue(row.StudentId);
                        }

                    }
                }

                foreach (var project in ceProjects)
                {
                    var members = membersByProject[project.Id];
                    var before = initialCounts[project.Id];
                    while (members.Count < TargetTeamSize)
                    {
                        int? candidate = null;

                        while (surplusPool.Count > 0 && candidate == null)
                        {
                            var next = surplusPool.Dequeue();
                            if (next == project.OwnerId || IsMember(project.Id, next)) continue;
                            candidate = next;
                        }

                        if (candidate == null)
                        {
                            candidate = ceStudentIds
                                .Where(id => id != project.OwnerId && !IsMember(project.Id, id))
                                .OrderBy(id => projectsByStudent.TryGetValue(id, out var set) ? set.Count : 0)
                                .ThenBy(id => id)
                                .FirstOrDefault();
                        }

                        if (candidate == null || candidate == 0)
                            break;

                        var member = new StudentProjectMember
                        {
                            ProjectId = project.Id,
                            StudentId = candidate.Value,
                            Role = "member",
                            JoinedAt = project.CreatedAt.AddDays(3),
                        };
                        _db.StudentProjectMembers.Add(member);
                        members.Add(member);
                        if (!projectsByStudent.TryGetValue(candidate.Value, out var studentProjects))
                        {
                            studentProjects = new HashSet<int>();
                            projectsByStudent[candidate.Value] = studentProjects;
                        }
                        studentProjects.Add(project.Id);

                    }

                    if (before != members.Count)
                    {
                        result.ProjectsUpdated++;
                        result.ResizedProjects.Add(
                            $"{project.Name} (id {project.Id}): {before} -> {members.Count} members");
                    }

                    if (members.Count != TargetTeamSize)
                    {
                        throw new InvalidOperationException(
                            $"Could not resize CE project {project.Id} ({project.Name}) to {TargetTeamSize} members (has {members.Count}).");
                    }

                    if (before != members.Count || project.PartnersCount != TargetTeamSize)
                    {
                        project.PartnersCount = TargetTeamSize;
                        project.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await _db.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);

                foreach (var project in ceProjects)
                {
                    var size = membersByProject[project.Id].Count;
                    result.TeamSizeDistribution[size] =
                        result.TeamSizeDistribution.GetValueOrDefault(size) + 1;
                }

                result.Success = true;
                result.Duration = DateTime.UtcNow - started;
                return result;
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync(cancellationToken);
                _logger.LogError(ex, "CE team size fix failed");
                return new ComputerEngineeringTeamSizeFixResult
                {
                    Success = false,
                    Error = ex.Message,
                    Duration = DateTime.UtcNow - started,
                };
            }
        }
    }
}
