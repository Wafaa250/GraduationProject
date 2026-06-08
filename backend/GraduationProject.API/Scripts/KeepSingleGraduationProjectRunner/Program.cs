using Microsoft.Extensions.Configuration;
using Npgsql;

const string TargetProjectName = "AI-Powered Graduation Project Collaboration Platform";

var apiRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));
var scriptPath = Path.GetFullPath(Path.Combine(apiRoot, "..", "DatabaseScripts", "keep-single-graduation-project.sql"));

var config = new ConfigurationBuilder()
    .SetBasePath(apiRoot)
    .AddJsonFile("appsettings.json", optional: false)
    .AddJsonFile("appsettings.Development.json", optional: true)
    .Build();

var connectionString = config.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is missing from appsettings.");

if (!File.Exists(scriptPath))
    throw new FileNotFoundException("Cleanup SQL script not found.", scriptPath);

var sql = await File.ReadAllTextAsync(scriptPath);

Console.WriteLine("Keep Single Graduation Project Cleanup");
Console.WriteLine("======================================");
Console.WriteLine($"Target project: {TargetProjectName}");
Console.WriteLine($"Script: {scriptPath}");
Console.WriteLine();

await using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();

await using (var preCmd = new NpgsqlCommand(
    """
    SELECT COUNT(*)::int,
           COALESCE(string_agg(name, ' | ' ORDER BY id), '(none)')
    FROM graduation_projects;
    """, conn))
{
    await using var reader = await preCmd.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
        Console.WriteLine($"Before cleanup: {reader.GetInt32(0)} graduation project(s)");
        Console.WriteLine($"Project names: {reader.GetString(1)}");
        Console.WriteLine();
    }
}

try
{
    await using var cmd = new NpgsqlCommand(sql, conn);
    await using var reader = await cmd.ExecuteReaderAsync();

    do
    {
        while (await reader.ReadAsync())
        {
            var values = new string[reader.FieldCount];
            for (var i = 0; i < reader.FieldCount; i++)
                values[i] = reader.IsDBNull(i) ? "NULL" : reader.GetValue(i)?.ToString() ?? "NULL";
            Console.WriteLine(string.Join(" | ", values));
        }
    } while (await reader.NextResultAsync());

    Console.WriteLine();
    Console.WriteLine("Transaction committed successfully.");
}
catch (PostgresException ex)
{
    Console.Error.WriteLine();
    Console.Error.WriteLine($"Cleanup aborted and rolled back: [{ex.SqlState}] {ex.MessageText}");
    return 1;
}
catch (Exception ex)
{
    Console.Error.WriteLine();
    Console.Error.WriteLine($"Cleanup failed: {ex.Message}");
    return 1;
}

await using (var postCmd = new NpgsqlCommand(
    """
    SELECT COUNT(*)::int, MAX(name)
    FROM graduation_projects;
    """, conn))
{
    await using var reader = await postCmd.ExecuteReaderAsync();
    if (await reader.ReadAsync())
    {
        var count = reader.GetInt32(0);
        var name = reader.IsDBNull(1) ? null : reader.GetString(1);
        Console.WriteLine($"After cleanup: {count} graduation project(s)");
        Console.WriteLine(name is null ? "No project remains." : $"Remaining project: {name}");

        if (count != 1 || name != TargetProjectName)
        {
            Console.Error.WriteLine("Post-run verification failed.");
            return 1;
        }
    }
}

Console.WriteLine("Done.");
return 0;
