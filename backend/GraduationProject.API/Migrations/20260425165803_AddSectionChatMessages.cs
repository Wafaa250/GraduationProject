using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSectionChatMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "course_project_id",
                table: "course_teams",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_course_teams_course_project_id",
                table: "course_teams",
                column: "course_project_id");

            migrationBuilder.AddForeignKey(
                name: "FK_course_teams_course_projects_course_project_id",
                table: "course_teams",
                column: "course_project_id",
                principalTable: "course_projects",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_course_teams_course_projects_course_project_id",
                table: "course_teams");

            migrationBuilder.DropIndex(
                name: "IX_course_teams_course_project_id",
                table: "course_teams");

            migrationBuilder.DropColumn(
                name: "course_project_id",
                table: "course_teams");
        }
    }
}
