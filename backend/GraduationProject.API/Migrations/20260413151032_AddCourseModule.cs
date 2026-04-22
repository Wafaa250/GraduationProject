using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {


            migrationBuilder.CreateTable(
                name: "courses",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    code = table.Column<string>(type: "text", nullable: false),
                    doctor_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_courses", x => x.id);
                    table.ForeignKey(
                        name: "FK_courses_doctor_profiles_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "doctor_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "course_enrollments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_id = table.Column<int>(type: "integer", nullable: false),
                    student_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_enrollments", x => x.id);
                    table.ForeignKey(
                        name: "FK_course_enrollments_courses_course_id",
                        column: x => x.course_id,
                        principalTable: "courses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_course_enrollments_student_profiles_student_id",
                        column: x => x.student_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "course_project_settings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_id = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    team_size = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_project_settings", x => x.id);
                    table.ForeignKey(
                        name: "FK_course_project_settings_courses_course_id",
                        column: x => x.course_id,
                        principalTable: "courses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "course_teams",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_id = table.Column<int>(type: "integer", nullable: false),
                    project_setting_id = table.Column<int>(type: "integer", nullable: false),
                    leader_student_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_teams", x => x.id);
                    table.ForeignKey(
                        name: "FK_course_teams_course_project_settings_project_setting_id",
                        column: x => x.project_setting_id,
                        principalTable: "course_project_settings",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_course_teams_courses_course_id",
                        column: x => x.course_id,
                        principalTable: "courses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_course_teams_student_profiles_leader_student_id",
                        column: x => x.leader_student_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "course_partner_requests",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_id = table.Column<int>(type: "integer", nullable: false),
                    sender_student_id = table.Column<int>(type: "integer", nullable: false),
                    receiver_student_id = table.Column<int>(type: "integer", nullable: false),
                    team_id = table.Column<int>(type: "integer", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "pending"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_partner_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_course_partner_requests_course_teams_team_id",
                        column: x => x.team_id,
                        principalTable: "course_teams",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_course_partner_requests_courses_course_id",
                        column: x => x.course_id,
                        principalTable: "courses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_course_partner_requests_student_profiles_receiver_student_id",
                        column: x => x.receiver_student_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_course_partner_requests_student_profiles_sender_student_id",
                        column: x => x.sender_student_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "course_team_members",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    team_id = table.Column<int>(type: "integer", nullable: false),
                    course_id = table.Column<int>(type: "integer", nullable: false),
                    student_id = table.Column<int>(type: "integer", nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "member"),
                    joined_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_team_members", x => x.id);
                    table.ForeignKey(
                        name: "FK_course_team_members_course_teams_team_id",
                        column: x => x.team_id,
                        principalTable: "course_teams",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_course_team_members_courses_course_id",
                        column: x => x.course_id,
                        principalTable: "courses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_course_team_members_student_profiles_student_id",
                        column: x => x.student_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_course_enrollments_course_student",
                table: "course_enrollments",
                columns: new[] { "course_id", "student_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_course_enrollments_student_id",
                table: "course_enrollments",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "ix_course_partner_requests_course",
                table: "course_partner_requests",
                column: "course_id");

            migrationBuilder.CreateIndex(
                name: "IX_course_partner_requests_receiver_student_id",
                table: "course_partner_requests",
                column: "receiver_student_id");

            migrationBuilder.CreateIndex(
                name: "IX_course_partner_requests_sender_student_id",
                table: "course_partner_requests",
                column: "sender_student_id");

            migrationBuilder.CreateIndex(
                name: "IX_course_partner_requests_team_id",
                table: "course_partner_requests",
                column: "team_id");

            migrationBuilder.CreateIndex(
                name: "ix_course_project_settings_course",
                table: "course_project_settings",
                column: "course_id");

            migrationBuilder.CreateIndex(
                name: "ix_course_team_members_course_student",
                table: "course_team_members",
                columns: new[] { "course_id", "student_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_course_team_members_student_id",
                table: "course_team_members",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "ix_course_team_members_team_student",
                table: "course_team_members",
                columns: new[] { "team_id", "student_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_course_teams_course",
                table: "course_teams",
                column: "course_id");

            migrationBuilder.CreateIndex(
                name: "IX_course_teams_leader_student_id",
                table: "course_teams",
                column: "leader_student_id");

            migrationBuilder.CreateIndex(
                name: "IX_course_teams_project_setting_id",
                table: "course_teams",
                column: "project_setting_id");

            migrationBuilder.CreateIndex(
                name: "ix_courses_doctor_code",
                table: "courses",
                columns: new[] { "doctor_id", "code" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "course_enrollments");

            migrationBuilder.DropTable(
                name: "course_partner_requests");

            migrationBuilder.DropTable(
                name: "course_team_members");

            migrationBuilder.DropTable(
                name: "course_teams");

            migrationBuilder.DropTable(
                name: "course_project_settings");

            migrationBuilder.DropTable(
                name: "courses");

        }
    }
}
