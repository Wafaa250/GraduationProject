using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Npgsql;

const int ProjectId = 161;

var apiRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
var config = new ConfigurationBuilder()
    .SetBasePath(apiRoot)
    .AddJsonFile("appsettings.json", optional: false)
    .AddJsonFile("appsettings.Development.json", optional: true)
    .Build();

await using var conn = new NpgsqlConnection(config.GetConnectionString("DefaultConnection"));
await conn.OpenAsync();

static List<int> ParseIntList(string? json)
{
    if (string.IsNullOrEmpty(json)) return [];
    try { return JsonSerializer.Deserialize<List<int>>(json) ?? []; }
    catch { return []; }
}

static List<string> ParseStringList(string? json)
{
    if (string.IsNullOrEmpty(json)) return [];
    try { return JsonSerializer.Deserialize<List<string>>(json) ?? []; }
    catch { return []; }
}

static List<int> GetSkillIds(string? roles, string? tech, string? tools) =>
    ParseIntList(roles).Concat(ParseIntList(tech)).Concat(ParseIntList(tools)).Distinct().ToList();

static int ComputeScore(List<int> studentSkillIds, List<int> requiredSkillIds)
{
    if (requiredSkillIds.Count == 0)
        return studentSkillIds.Count > 0 ? 50 : 35;
    if (studentSkillIds.Count == 0)
        return 20;
    var requiredSet = requiredSkillIds.ToHashSet();
    var studentSet = studentSkillIds.ToHashSet();
    var common = studentSet.Count(requiredSet.Contains);
    var complementary = studentSet.Count(id => !requiredSet.Contains(id));
    var overlapPct = (double)common / requiredSkillIds.Count * 100;
    var diversityPct = (double)complementary / Math.Max(studentSkillIds.Count, 1) * 100;
    return Math.Clamp((int)Math.Round(overlapPct * 0.65 + diversityPct * 0.35), 1, 100);
}

static string Label(StudentRow s) =>
    $"{s.Id}:{s.Name} (major={s.Major ?? "NULL"}, faculty={s.Faculty ?? "NULL"}, year={s.AcademicYear ?? "NULL"})";

Console.WriteLine("=================================================================");
Console.WriteLine(" recommend-students DIAGNOSTIC REPORT");
Console.WriteLine("=================================================================");
Console.WriteLine($"ProjectId: {ProjectId}");
Console.WriteLine();

var project = await QueryProject(conn, ProjectId);
if (project == null) { Console.WriteLine("Project not found."); return 1; }

Console.WriteLine($"Project: {project.Name}");
Console.WriteLine($"OwnerId: {project.OwnerId}");
Console.WriteLine($"RequiredSkills JSON: {project.RequiredSkills ?? "(null)"}");
Console.WriteLine();

var members = await QueryMemberIds(conn, ProjectId);
var gpOwners = await QueryGpOwnerIds(conn);
var owner = await QueryStudent(conn, project.OwnerId);
if (owner == null) { Console.WriteLine("Owner not found."); return 1; }

Console.WriteLine($"Owner: {Label(owner)}");
Console.WriteLine($"Owner skill IDs: [{string.Join(", ", GetSkillIds(owner.Roles, owner.TechnicalSkills, owner.Tools))}]");
Console.WriteLine();

var allSkills = await QuerySkills(conn);
var requiredNames = ParseStringList(project.RequiredSkills);
var nameMap = allSkills.GroupBy(s => s.Name.Trim(), StringComparer.OrdinalIgnoreCase)
    .ToDictionary(g => g.Key, g => g.First().Id, StringComparer.OrdinalIgnoreCase);
var requiredIds = requiredNames
    .Select(n => n.Trim())
    .Where(n => !string.IsNullOrEmpty(n) && nameMap.ContainsKey(n))
    .Select(n => nameMap[n])
    .Distinct()
    .ToList();

Console.WriteLine("Required skill names: " + (requiredNames.Count == 0 ? "(none)" : string.Join(", ", requiredNames)));
Console.WriteLine("Resolved required skill IDs: " + (requiredIds.Count == 0 ? "(none)" : string.Join(", ", requiredIds)));
foreach (var name in requiredNames)
{
    var hit = allSkills.FirstOrDefault(s => string.Equals(s.Name, name, StringComparison.OrdinalIgnoreCase));
    Console.WriteLine($"  '{name}' -> {(hit == null ? "NOT FOUND in skills table" : $"id={hit.Id} name='{hit.Name}'")}");
}
Console.WriteLine();

var allStudents = await QueryAllStudents(conn);
var gpOwnerSet = gpOwners.ToHashSet();
var memberSet = members.ToHashSet();

Console.WriteLine("PIPELINE COUNTS");
Console.WriteLine("---------------");
Console.WriteLine($"1. total students: {allStudents.Count}");

var complete = allStudents.Where(s =>
    !string.IsNullOrWhiteSpace(s.Major) &&
    !string.IsNullOrWhiteSpace(s.University) &&
    GetSkillIds(s.Roles, s.TechnicalSkills, s.Tools).Count > 0).ToList();
Console.WriteLine($"2. students with complete profiles (NOT filtered by endpoint): {complete.Count}");

var available = allStudents.Where(s => !string.Equals(s.Availability, "unavailable", StringComparison.OrdinalIgnoreCase)).ToList();
Console.WriteLine($"3. students not unavailable (NOT filtered by endpoint): {available.Count}");

var afterOwner = allStudents.Where(s => s.Id != project.OwnerId).ToList();
PrintRemoved("4. after excluding project owner", allStudents, afterOwner);

var afterMembers = afterOwner.Where(s => !memberSet.Contains(s.Id)).ToList();
PrintRemoved("5. after excluding current project members", afterOwner, afterMembers);
Console.WriteLine($"   Current member IDs: [{string.Join(", ", members)}]");

var afterGp = afterMembers.Where(s => !gpOwnerSet.Contains(s.Id)).ToList();
PrintRemoved("6. after excluding graduation-project owners", afterMembers, afterGp);
Console.WriteLine($"   GP owner IDs ({gpOwnerSet.Count}): [{string.Join(", ", gpOwnerSet.OrderBy(x => x))}]");

var ownerFaculty = owner.Faculty;
var afterFaculty = afterGp.Where(s =>
    ownerFaculty == null || s.Faculty == null ||
    string.Equals(s.Faculty, ownerFaculty, StringComparison.OrdinalIgnoreCase)).ToList();
Console.WriteLine($"7. after faculty filter (NOT applied by endpoint): {afterFaculty.Count}");

var ownerMajor = owner.Major;
var afterMajor = afterGp.Where(s =>
    s.Major != null && ownerMajor != null &&
    string.Equals(s.Major, ownerMajor, StringComparison.OrdinalIgnoreCase)).ToList();

Console.WriteLine($"8. after major filter (APPLIED): {afterMajor.Count}");
Console.WriteLine($"   Owner major: '{ownerMajor ?? "NULL"}'");
if (ownerMajor == null)
    Console.WriteLine("   *** owner major is NULL — major filter excludes ALL students ***");
PrintRemoved("   removed by major filter", afterGp, afterMajor);

var ownerYear = owner.AcademicYear;
var afterStage = afterMajor.Where(s =>
    ownerYear == null || s.AcademicYear == null ||
    string.Equals(s.AcademicYear, ownerYear, StringComparison.OrdinalIgnoreCase)).ToList();
Console.WriteLine($"9. after stage/academic_year filter (NOT applied by endpoint): {afterStage.Count}");

var scored = afterMajor.Select(s =>
{
    var ids = GetSkillIds(s.Roles, s.TechnicalSkills, s.Tools);
    var score = ComputeScore(ids, requiredIds);
    var common = requiredIds.Count == 0 ? 0 : ids.Count(id => requiredIds.Contains(id));
    return (Student: s, Score: score, Common: common, SkillIds: ids);
}).ToList();

var afterScore = scored.Where(x => x.Score >= 1).ToList();
Console.WriteLine($"10. after skills scoring (score >= 1): {afterScore.Count}");
Console.WriteLine($"11. final candidates (max 20): {Math.Min(afterScore.Count, 20)}");
Console.WriteLine();

var withOverlap = scored.Count(x => x.Common > 0);
var zeroOverlap = scored.Count(x => x.Common == 0);
Console.WriteLine("SKILLS MATCHING (project required skill IDs vs student skill IDs)");
Console.WriteLine($"   Required IDs: [{string.Join(", ", requiredIds)}]");
Console.WriteLine($"   Same-major candidates with CommonSkills > 0: {withOverlap}");
Console.WriteLine($"   Same-major candidates with CommonSkills = 0: {zeroOverlap}");
Console.WriteLine("   LEGACY filter simulation (.Where(c => requiredSkillIds.Count == 0 || c.CommonSkills > 0)):");
Console.WriteLine($"   Would survive legacy filter: {scored.Count(x => requiredIds.Count == 0 || x.Common > 0)}");
Console.WriteLine($"   Would be REMOVED by legacy filter: {scored.Count(x => requiredIds.Count > 0 && x.Common == 0)}");
if (zeroOverlap > 0 && requiredIds.Count > 0)
{
    Console.WriteLine("   Students removed ONLY by legacy CommonSkills > 0 filter (first 15):");
    foreach (var x in scored.Where(x => x.Common == 0).Take(15))
        Console.WriteLine($"     - {x.Student.Id}:{x.Student.Name} skillIds=[{string.Join(",", x.SkillIds)}] score={x.Score}");
}
Console.WriteLine();

// Simulate pre-cleanup GP owner exclusion (when 81 projects existed)
var historicalGpOwners = await QueryHistoricalGpOwnerCount(conn);
Console.WriteLine($"HISTORICAL NOTE: graduation_projects table now has {gpOwnerSet.Count} owner(s).");
Console.WriteLine($"If GP-owner filter ran when many seeded projects existed, most CE students were excluded as owners.");
Console.WriteLine();

Console.WriteLine("EXACT ENDPOINT LINQ");
Console.WriteLine("-------------------");
Console.WriteLine("""
_db.StudentProfiles
  .Include(s => s.User)
  .AsNoTracking()
  .Where(s => s.Major != null && ownerMajor != null &&
              s.Major.ToLower() == ownerMajor.ToLower() &&
              s.Id != project.OwnerId &&
              !memberIds.Contains(s.Id) &&
              !gpOwnerSet.Contains(s.Id))
  .ToListAsync();
""");
Console.WriteLine();

var sameMajorAll = allStudents.Where(s =>
    s.Major != null && ownerMajor != null &&
    string.Equals(s.Major, ownerMajor, StringComparison.OrdinalIgnoreCase)).ToList();

Console.WriteLine($"All students with owner major '{ownerMajor}': {sameMajorAll.Count}");
foreach (var s in sameMajorAll)
{
    var flags = new List<string>();
    if (s.Id == project.OwnerId) flags.Add("OWNER");
    if (memberSet.Contains(s.Id)) flags.Add("MEMBER");
    if (gpOwnerSet.Contains(s.Id)) flags.Add("GP_OWNER");
    Console.WriteLine($"  {Label(s)} [{string.Join(", ", flags)}]");
}
Console.WriteLine();

Console.WriteLine("ROOT CAUSE");
Console.WriteLine("----------");
if (requiredIds.Count > 0 && zeroOverlap == scored.Count && scored.Count > 0)
{
    Console.WriteLine("[] would be returned by LEGACY code using: .Where(c => requiredSkillIds.Count == 0 || c.CommonSkills > 0)");
    Console.WriteLine("CAUSE: every same-major candidate has ZERO overlapping required skill IDs.");
    Console.WriteLine("       Project requires React/REST APIs/Node.js/PostgreSQL (web stack IDs).");
    Console.WriteLine("       CE seeded students store embedded-systems skill IDs (C, ARM, RTOS, etc.) — different ID namespace.");
}
else if (afterMajor.Count == 0)
{
    Console.WriteLine("[] returned at AiController line 137-142: major/affiliation query yields 0 students.");
    if (ownerMajor == null)
        Console.WriteLine("CAUSE: owner major is NULL.");
    else if (!sameMajorAll.Any(s => s.Id != project.OwnerId))
        Console.WriteLine($"CAUSE: no students besides owner have major '{ownerMajor}'.");
    else
    {
        var nonOwner = sameMajorAll.Where(s => s.Id != project.OwnerId).ToList();
        var eligible = nonOwner.Where(s => !memberSet.Contains(s.Id) && !gpOwnerSet.Contains(s.Id)).ToList();
        Console.WriteLine($"Same-major non-owner: {nonOwner.Count}, eligible after affiliation: {eligible.Count}");
        if (eligible.Count == 0)
            Console.WriteLine("CAUSE: every same-major student is excluded as member or GP owner.");
    }
}
else if (requiredIds.Count > 0 && scored.Count(x => x.Common > 0) == 0)
    Console.WriteLine("CURRENT source code should still return up to 20 candidates (complementarity scoring).");
else
    Console.WriteLine($"{afterScore.Count} candidates pass filters with current source code.");
    Console.WriteLine("If API still returns [], the running process likely has NOT been restarted since the fix.");

Console.WriteLine();
Console.WriteLine("NOTE: faculty, stage, complete-profile filters are NOT in RecommendStudents.");
Console.WriteLine("=================================================================");

return 0;

static void PrintRemoved(string step, List<StudentRow> before, List<StudentRow> after)
{
    var keep = after.Select(s => s.Id).ToHashSet();
    var removed = before.Where(s => !keep.Contains(s.Id)).ToList();
    Console.WriteLine($"{step}: {after.Count} (removed {removed.Count})");
    foreach (var s in removed)
        Console.WriteLine($"   - REMOVED {s.Id}:{s.Name}");
}

static async Task<ProjectRow?> QueryProject(NpgsqlConnection conn, int id)
{
    await using var cmd = new NpgsqlCommand(
        "SELECT id, name, owner_id, required_skills FROM graduation_projects WHERE id = @id", conn);
    cmd.Parameters.AddWithValue("id", id);
    await using var r = await cmd.ExecuteReaderAsync();
    if (!await r.ReadAsync()) return null;
    return new ProjectRow(r.GetInt32(0), r.GetString(1), r.GetInt32(2), r.IsDBNull(3) ? null : r.GetString(3));
}

static async Task<List<int>> QueryMemberIds(NpgsqlConnection conn, int projectId)
{
    await using var cmd = new NpgsqlCommand(
        "SELECT student_id FROM graduation_project_members WHERE project_id = @pid", conn);
    cmd.Parameters.AddWithValue("pid", projectId);
    var ids = new List<int>();
    await using var r = await cmd.ExecuteReaderAsync();
    while (await r.ReadAsync()) ids.Add(r.GetInt32(0));
    return ids;
}

static async Task<List<int>> QueryGpOwnerIds(NpgsqlConnection conn)
{
    await using var cmd = new NpgsqlCommand("SELECT owner_id FROM graduation_projects", conn);
    var ids = new List<int>();
    await using var r = await cmd.ExecuteReaderAsync();
    while (await r.ReadAsync()) ids.Add(r.GetInt32(0));
    return ids;
}

static async Task<StudentRow?> QueryStudent(NpgsqlConnection conn, int id)
{
    var all = await QueryAllStudents(conn);
    return all.FirstOrDefault(s => s.Id == id);
}

static async Task<List<SkillRow>> QuerySkills(NpgsqlConnection conn)
{
    await using var cmd = new NpgsqlCommand("SELECT id, name FROM skills ORDER BY id", conn);
    var list = new List<SkillRow>();
    await using var r = await cmd.ExecuteReaderAsync();
    while (await r.ReadAsync()) list.Add(new SkillRow(r.GetInt32(0), r.GetString(1)));
    return list;
}

static async Task<int> QueryHistoricalGpOwnerCount(NpgsqlConnection conn)
{
    await using var cmd = new NpgsqlCommand("SELECT COUNT(DISTINCT owner_id) FROM graduation_projects", conn);
    return Convert.ToInt32(await cmd.ExecuteScalarAsync());
}

static async Task<List<StudentRow>> QueryAllStudents(NpgsqlConnection conn)
{
    await using var cmd = new NpgsqlCommand(
        """
        SELECT sp.id, u.name, sp.major, sp.faculty, sp.academic_year, sp.university,
               sp.availability, sp.roles, sp.technical_skills, sp.tools
        FROM student_profiles sp
        JOIN users u ON u.id = sp.user_id
        ORDER BY sp.id
        """, conn);
    var list = new List<StudentRow>();
    await using var r = await cmd.ExecuteReaderAsync();
    while (await r.ReadAsync())
    {
        list.Add(new StudentRow(
            r.GetInt32(0), r.GetString(1),
            r.IsDBNull(2) ? null : r.GetString(2),
            r.IsDBNull(3) ? null : r.GetString(3),
            r.IsDBNull(4) ? null : r.GetString(4),
            r.IsDBNull(5) ? null : r.GetString(5),
            r.IsDBNull(6) ? null : r.GetString(6),
            r.IsDBNull(7) ? null : r.GetString(7),
            r.IsDBNull(8) ? null : r.GetString(8),
            r.IsDBNull(9) ? null : r.GetString(9)));
    }
    return list;
}

record ProjectRow(int Id, string Name, int OwnerId, string? RequiredSkills);
record SkillRow(int Id, string Name);
record StudentRow(
    int Id, string Name, string? Major, string? Faculty, string? AcademicYear,
    string? University, string? Availability, string? Roles, string? TechnicalSkills, string? Tools);
