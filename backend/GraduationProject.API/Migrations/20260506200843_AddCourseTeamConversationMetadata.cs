using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseTeamConversationMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CourseTeamId",
                table: "conversations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "conversations",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_conversations_course_team",
                table: "conversations",
                column: "CourseTeamId",
                unique: true,
                filter: "\"CourseTeamId\" IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_conversations_course_teams_CourseTeamId",
                table: "conversations",
                column: "CourseTeamId",
                principalTable: "course_teams",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_conversations_course_teams_CourseTeamId",
                table: "conversations");

            migrationBuilder.DropIndex(
                name: "ix_conversations_course_team",
                table: "conversations");

            migrationBuilder.DropColumn(
                name: "CourseTeamId",
                table: "conversations");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "conversations");
        }
    }
}
