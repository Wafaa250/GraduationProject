using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseTeams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "course_teams",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CourseProjectId = table.Column<int>(type: "integer", nullable: false),
                    TeamIndex = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_teams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_course_teams_course_projects_CourseProjectId",
                        column: x => x.CourseProjectId,
                        principalTable: "course_projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "course_team_members",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CourseTeamId = table.Column<int>(type: "integer", nullable: false),
                    StudentProfileId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    MatchScore = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_team_members", x => x.Id);
                    table.ForeignKey(
                        name: "FK_course_team_members_course_teams_CourseTeamId",
                        column: x => x.CourseTeamId,
                        principalTable: "course_teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_course_team_members_student_profiles_StudentProfileId",
                        column: x => x.StudentProfileId,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_course_team_members_StudentProfileId",
                table: "course_team_members",
                column: "StudentProfileId");

            migrationBuilder.CreateIndex(
                name: "ix_course_team_members_team_student",
                table: "course_team_members",
                columns: new[] { "CourseTeamId", "StudentProfileId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_course_teams_project_index",
                table: "course_teams",
                columns: new[] { "CourseProjectId", "TeamIndex" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "course_team_members");

            migrationBuilder.DropTable(
                name: "course_teams");
        }
    }
}
