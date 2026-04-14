using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectFileToCourseSetting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "file_name",
                table: "course_project_settings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "file_url",
                table: "course_project_settings",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "file_name",
                table: "course_project_settings");

            migrationBuilder.DropColumn(
                name: "file_url",
                table: "course_project_settings");
        }
    }
}
