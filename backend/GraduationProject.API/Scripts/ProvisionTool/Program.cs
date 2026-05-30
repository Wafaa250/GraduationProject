using System.Text.Json;
using Npgsql;

static List<int> ParseIdJson(string? json)
{
    if (string.IsNullOrWhiteSpace(json)) return new();
    try
    {
        return JsonSerializer.Deserialize<List<int>>(json) ?? new();
    }
    catch
    {
        return new();
    }
}

static async Task<Dictionary<int, string>> LoadSkillNames(NpgsqlConnection conn)
{
    var map = new Dictionary<int, string>();
    await using var cmd = new NpgsqlCommand("SELECT id, name FROM skills", conn);
    await using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
        map[reader.GetInt32(0)] = reader.GetString(1);
    return map;
}

static string ResolveNames(string? idsJson, Dictionary<int, string> skills)
{
    var ids = ParseIdJson(idsJson);
    if (ids.Count == 0) return "—";
    var names = ids
        .Where(skills.ContainsKey)
        .Select(id => skills[id])
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .OrderBy(n => n)
        .ToList();
    return names.Count > 0 ? string.Join(", ", names) : "—";
}

static string AllSkills(string? roles, string? tech, string? tools, Dictionary<int, string> skillMap)
{
    var parts = new[]
    {
        ResolveNames(roles, skillMap),
        ResolveNames(tech, skillMap),
        ResolveNames(tools, skillMap),
    }
        .Where(p => p != "—")
        .ToList();
    return parts.Count > 0 ? string.Join(", ", parts) : "—";
}

var connString = Environment.GetEnvironmentVariable("SKILLSWAP_PG");
if (string.IsNullOrWhiteSpace(connString))
{
    Console.Error.WriteLine("Set SKILLSWAP_PG environment variable to the PostgreSQL connection string.");
    return 1;
}

var argsList = args.ToList();
if (argsList.Count < 1)
{
    Console.Error.WriteLine("Usage: ProvisionTool update-academic-year <emails-semicolon-separated>");
    Console.Error.WriteLine("       ProvisionTool print-table <defaultPassword> <doctorEmail> <studentEmails-semicolon-separated>");
    return 1;
}

var command = argsList[0];
var defaultPassword = "Password123!";

await using var conn = new NpgsqlConnection(connString);
await conn.OpenAsync();

if (command == "update-academic-year")
{
    var emails = argsList.Count > 1
        ? argsList[1].Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        : Array.Empty<string>();

    if (emails.Length == 0)
    {
        Console.Error.WriteLine("No target emails provided.");
        return 1;
    }

    var parameters = emails.Select((_, i) => $"@e{i}").ToArray();
    var sql = $"""
        UPDATE student_profiles sp
        SET academic_year = 'Senior (2025–2026)'
        FROM users u
        WHERE sp.user_id = u.id
          AND u.email IN ({string.Join(", ", parameters)})
        """;

    await using var cmd = new NpgsqlCommand(sql, conn);
    for (var i = 0; i < emails.Length; i++)
        cmd.Parameters.AddWithValue($"e{i}", emails[i].ToLowerInvariant());

    var rows = await cmd.ExecuteNonQueryAsync();
    Console.WriteLine($"Updated academic_year for {rows} student profile(s).");
    return 0;
}

if (command == "print-table")
{
    defaultPassword = argsList.Count > 1 ? argsList[1] : defaultPassword;
    var doctorEmail = argsList.Count > 2 ? argsList[2].ToLowerInvariant() : "doctor.ai@skillswap.ps";
    var studentEmails = argsList.Count > 3
        ? argsList[3].Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(e => e.ToLowerInvariant()).ToList()
        : new List<string>();

    var skillMap = await LoadSkillNames(conn);

    var emailFilter = new List<string> { doctorEmail };
    emailFilter.AddRange(studentEmails);
    var parameters = emailFilter.Select((_, i) => $"@e{i}").ToArray();
    var sql = $"""
        SELECT u.name, u.email, u.role, sp.major, sp.academic_year,
               sp.roles, sp.technical_skills, sp.tools
        FROM users u
        LEFT JOIN student_profiles sp ON sp.user_id = u.id
        WHERE u.email IN ({string.Join(", ", parameters)})
        ORDER BY CASE WHEN u.role = 'doctor' THEN 0 ELSE 1 END, u.name
        """;

    await using var cmd = new NpgsqlCommand(sql, conn);
    for (var i = 0; i < emailFilter.Count; i++)
        cmd.Parameters.AddWithValue($"e{i}", emailFilter[i]);

    await using var reader = await cmd.ExecuteReaderAsync();

    Console.WriteLine();
    Console.WriteLine("=== PROVISIONED DEVELOPMENT USERS ===");
    Console.WriteLine();
    Console.WriteLine(
        string.Format(
            "{0,-22} {1,-38} {2,-14} {3,-28} {4,-24} {5}",
            "Name", "Email", "Password", "Major", "Roles", "Skills"));
    Console.WriteLine(new string('-', 150));

    while (await reader.ReadAsync())
    {
        var name = reader.GetString(0);
        var email = reader.GetString(1);
        var role = reader.GetString(2);
        var major = reader.IsDBNull(3) ? "—" : reader.GetString(3);
        var academicYear = reader.IsDBNull(4) ? "" : reader.GetString(4);
        var rolesJson = reader.IsDBNull(5) ? null : reader.GetString(5);
        var techJson = reader.IsDBNull(6) ? null : reader.GetString(6);
        var toolsJson = reader.IsDBNull(7) ? null : reader.GetString(7);

        if (role == "doctor")
        {
            Console.WriteLine(
                string.Format(
                    "{0,-22} {1,-38} {2,-14} {3,-28} {4,-24} {5}",
                    name,
                    email,
                    defaultPassword,
                    "Computer Engineering",
                    "Doctor / AI",
                    "Artificial Intelligence, Machine Learning, Data Science, Computer Vision"));
            continue;
        }

        var roles = ResolveNames(rolesJson, skillMap);
        var skills = AllSkills(rolesJson, techJson, toolsJson, skillMap);
        var majorDisplay = string.IsNullOrWhiteSpace(academicYear)
            ? major
            : $"{major} · {academicYear}";

        Console.WriteLine(
            string.Format(
                "{0,-22} {1,-38} {2,-14} {3,-28} {4,-24} {5}",
                name,
                email,
                defaultPassword,
                majorDisplay,
                roles,
                skills));
    }

    Console.WriteLine();
    return 0;
}

Console.Error.WriteLine($"Unknown command: {command}");
return 1;
