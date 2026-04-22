using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSectionsAndSemester : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "allow_cross_section_teams",
                table: "courses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "semester",
                table: "courses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "use_shared_project_across_sections",
                table: "courses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "course_section_id",
                table: "course_enrollments",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "course_sections",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_id = table.Column<int>(type: "integer", nullable: false),
                    section_number = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_sections", x => x.id);
                    table.ForeignKey(
                        name: "FK_course_sections_courses_course_id",
                        column: x => x.course_id,
                        principalTable: "courses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "section_project_settings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_section_id = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    team_size = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_section_project_settings", x => x.id);
                    table.ForeignKey(
                        name: "FK_section_project_settings_course_sections_course_section_id",
                        column: x => x.course_section_id,
                        principalTable: "course_sections",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_course_enrollments_course_section_id",
                table: "course_enrollments",
                column: "course_section_id");

            migrationBuilder.CreateIndex(
                name: "ix_course_sections_course_number",
                table: "course_sections",
                columns: new[] { "course_id", "section_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_section_project_settings_section",
                table: "section_project_settings",
                column: "course_section_id");

            migrationBuilder.AddForeignKey(
                name: "FK_course_enrollments_course_sections_course_section_id",
                table: "course_enrollments",
                column: "course_section_id",
                principalTable: "course_sections",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_course_enrollments_course_sections_course_section_id",
                table: "course_enrollments");

            migrationBuilder.DropTable(
                name: "section_project_settings");

            migrationBuilder.DropTable(
                name: "course_sections");

            migrationBuilder.DropIndex(
                name: "IX_course_enrollments_course_section_id",
                table: "course_enrollments");

            migrationBuilder.DropColumn(
                name: "allow_cross_section_teams",
                table: "courses");

            migrationBuilder.DropColumn(
                name: "semester",
                table: "courses");

            migrationBuilder.DropColumn(
                name: "use_shared_project_across_sections",
                table: "courses");

            migrationBuilder.DropColumn(
                name: "course_section_id",
                table: "course_enrollments");
        }
    }
}
