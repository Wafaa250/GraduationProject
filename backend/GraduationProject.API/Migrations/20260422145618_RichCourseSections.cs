using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class RichCourseSections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

           

            migrationBuilder.AlterColumn<int>(
                name: "section_number",
                table: "course_sections",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "capacity",
                table: "course_sections",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "days",
                table: "course_sections",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "name",
                table: "course_sections",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<TimeOnly>(
                name: "time_from",
                table: "course_sections",
                type: "time without time zone",
                nullable: true);

            migrationBuilder.AddColumn<TimeOnly>(
                name: "time_to",
                table: "course_sections",
                type: "time without time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "course_projects",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_id = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    team_size = table.Column<int>(type: "integer", nullable: false),
                    apply_to_all_sections = table.Column<bool>(type: "boolean", nullable: false),
                    allow_cross_section_teams = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_projects", x => x.id);
                    table.ForeignKey(
                        name: "FK_course_projects_courses_course_id",
                        column: x => x.course_id,
                        principalTable: "courses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "course_project_sections",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_project_id = table.Column<int>(type: "integer", nullable: false),
                    course_section_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_project_sections", x => x.id);
                    table.ForeignKey(
                        name: "FK_course_project_sections_course_projects_course_project_id",
                        column: x => x.course_project_id,
                        principalTable: "course_projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_course_project_sections_course_sections_course_section_id",
                        column: x => x.course_section_id,
                        principalTable: "course_sections",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_course_team_members_course_id",
                table: "course_team_members",
                column: "course_id");

          

           

            migrationBuilder.CreateIndex(
                name: "IX_course_project_sections_course_section_id",
                table: "course_project_sections",
                column: "course_section_id");

            migrationBuilder.CreateIndex(
                name: "ix_course_project_sections_project_section",
                table: "course_project_sections",
                columns: new[] { "course_project_id", "course_section_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_course_projects_course",
                table: "course_projects",
                column: "course_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "course_project_sections");

            migrationBuilder.DropTable(
                name: "course_projects");

            migrationBuilder.DropIndex(
                name: "IX_course_team_members_course_id",
                table: "course_team_members");

            migrationBuilder.DropIndex(
                name: "ix_course_team_members_project_student",
                table: "course_team_members");


          

            migrationBuilder.DropColumn(
                name: "capacity",
                table: "course_sections");

            migrationBuilder.DropColumn(
                name: "days",
                table: "course_sections");

            migrationBuilder.DropColumn(
                name: "name",
                table: "course_sections");

            migrationBuilder.DropColumn(
                name: "time_from",
                table: "course_sections");

            migrationBuilder.DropColumn(
                name: "time_to",
                table: "course_sections");

            migrationBuilder.AlterColumn<int>(
                name: "section_number",
                table: "course_sections",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_course_team_members_course_student",
                table: "course_team_members",
                columns: new[] { "course_id", "student_id" },
                unique: true);
        }
    }
}
