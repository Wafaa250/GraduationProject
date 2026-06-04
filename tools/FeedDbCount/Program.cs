using Npgsql;

const string conn =
    "Host=localhost;Port=5432;Database=skillswap_db;Username=postgres;Password=123456789";

await using var db = new NpgsqlConnection(conn);
await db.OpenAsync();

async Task<int> Scalar(string sql)
{
    await using var cmd = new NpgsqlCommand(sql, db);
    return Convert.ToInt32(await cmd.ExecuteScalarAsync());
}

Console.WriteLine("=== skillswap_db feed source counts ===");
Console.WriteLine($"graduation_projects (teammate, no supervisor): {await Scalar("SELECT COUNT(*) FROM graduation_projects WHERE supervisor_id IS NULL")}");
Console.WriteLine($"graduation_projects (supervised / doctor_project source): {await Scalar("SELECT COUNT(*) FROM graduation_projects WHERE supervisor_id IS NOT NULL")}");
Console.WriteLine($"company_profiles: {await Scalar("SELECT COUNT(*) FROM company_profiles")}");
Console.WriteLine($"company_requests TOTAL: {await Scalar("SELECT COUNT(*) FROM company_requests")}");
Console.WriteLine($"company_requests draft: {await Scalar("SELECT COUNT(*) FROM company_requests WHERE status = 'draft'")}");
Console.WriteLine($"company_requests submitted+active (OLD feed filter): {await Scalar("SELECT COUNT(*) FROM company_requests WHERE status = 'submitted' AND request_status = 'active'")}");
Console.WriteLine($"company_requests visible (NEW feed filter): {await Scalar("SELECT COUNT(*) FROM company_requests WHERE status NOT IN ('draft','archived') AND request_status <> 'closed'")}");
Console.WriteLine($"company_talent_requests: {await Scalar("SELECT COUNT(*) FROM company_talent_requests")}");
Console.WriteLine($"student_organization_events: {await Scalar("SELECT COUNT(*) FROM student_organization_events")}");
Console.WriteLine($"recruitment_campaigns published: {await Scalar("SELECT COUNT(*) FROM student_organization_recruitment_campaigns WHERE is_published = true")}");
Console.WriteLine($"recruitment_campaigns unpublished: {await Scalar("SELECT COUNT(*) FROM student_organization_recruitment_campaigns WHERE is_published = false")}");
Console.WriteLine($"recruitment_positions (published campaigns): {await Scalar("SELECT COUNT(*) FROM student_organization_recruitment_positions p INNER JOIN student_organization_recruitment_campaigns c ON c.id = p.campaign_id WHERE c.is_published = true")}");
Console.WriteLine($"course_projects: {await Scalar("SELECT COUNT(*) FROM course_projects")}");

await using (var cmd = new NpgsqlCommand("SELECT status, request_status, COUNT(*) FROM company_requests GROUP BY status, request_status ORDER BY COUNT(*) DESC", db))
await using (var r = await cmd.ExecuteReaderAsync())
{
    Console.WriteLine("\ncompany_requests by status / request_status:");
    while (await r.ReadAsync())
        Console.WriteLine($"  status={r.GetString(0)}, request_status={r.GetString(1)}, count={r.GetInt64(2)}");
}
