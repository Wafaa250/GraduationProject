using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseProjects : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "course_projects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CourseId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    TeamSize = table.Column<int>(type: "integer", nullable: false),
                    ApplyToAllSections = table.Column<bool>(type: "boolean", nullable: false),
                    AllowCrossSectionTeams = table.Column<bool>(type: "boolean", nullable: false),
                    AiMode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "doctor"),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_projects", x => x.Id);
                    table.ForeignKey(
                        name: "FK_course_projects_courses_CourseId",
                        column: x => x.CourseId,
                        principalTable: "courses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "course_project_sections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CourseProjectId = table.Column<int>(type: "integer", nullable: false),
                    CourseSectionId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_project_sections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_course_project_sections_course_projects_CourseProjectId",
                        column: x => x.CourseProjectId,
                        principalTable: "course_projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_course_project_sections_course_sections_CourseSectionId",
                        column: x => x.CourseSectionId,
                        principalTable: "course_sections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_course_project_sections_CourseSectionId",
                table: "course_project_sections",
                column: "CourseSectionId");

            migrationBuilder.CreateIndex(
                name: "ix_course_project_sections_project_section",
                table: "course_project_sections",
                columns: new[] { "CourseProjectId", "CourseSectionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_course_projects_course",
                table: "course_projects",
                column: "CourseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "course_project_sections");

            migrationBuilder.DropTable(
                name: "course_projects");
        }
    }
}
