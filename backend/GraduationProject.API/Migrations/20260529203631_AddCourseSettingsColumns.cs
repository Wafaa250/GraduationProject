using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseSettingsColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AcademicYear",
                table: "courses",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AllowAiTeamSuggestions",
                table: "courses",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "AllowCourseProjects",
                table: "courses",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "AllowStudentCollaboration",
                table: "courses",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "AllowTeamFormation",
                table: "courses",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultTeamFormationStrategy",
                table: "courses",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "doctor");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "courses",
                type: "character varying(600)",
                maxLength: 600,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcademicYear",
                table: "courses");

            migrationBuilder.DropColumn(
                name: "AllowAiTeamSuggestions",
                table: "courses");

            migrationBuilder.DropColumn(
                name: "AllowCourseProjects",
                table: "courses");

            migrationBuilder.DropColumn(
                name: "AllowStudentCollaboration",
                table: "courses");

            migrationBuilder.DropColumn(
                name: "AllowTeamFormation",
                table: "courses");

            migrationBuilder.DropColumn(
                name: "DefaultTeamFormationStrategy",
                table: "courses");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "courses");
        }
    }
}
