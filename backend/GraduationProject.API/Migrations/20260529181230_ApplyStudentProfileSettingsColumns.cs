using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <summary>
    /// Adds student settings columns. Migration 20260529180824_AddAiProjectInterests was applied with an empty Up().
    /// </summary>
    public partial class ApplyStudentProfileSettingsColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE student_profiles
                    ADD COLUMN IF NOT EXISTS notification_preferences text;

                ALTER TABLE student_profiles
                    ADD COLUMN IF NOT EXISTS ai_project_interests text;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE student_profiles
                    DROP COLUMN IF EXISTS ai_project_interests;

                ALTER TABLE student_profiles
                    DROP COLUMN IF EXISTS notification_preferences;
                """);
        }
    }
}
