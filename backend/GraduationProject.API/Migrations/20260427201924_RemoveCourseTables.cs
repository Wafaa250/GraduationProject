using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCourseTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "course_enrollments");

            migrationBuilder.DropTable(
                name: "course_partner_requests");

            migrationBuilder.DropTable(
                name: "course_project_sections");

            migrationBuilder.DropTable(
                name: "course_team_members");

            migrationBuilder.DropTable(
                name: "section_chat_messages");

            migrationBuilder.DropTable(
                name: "section_project_settings");

            migrationBuilder.DropTable(
                name: "course_teams");

            migrationBuilder.DropTable(
                name: "course_sections");

            migrationBuilder.DropTable(
                name: "course_project_settings");

            migrationBuilder.DropTable(
                name: "course_projects");

            migrationBuilder.DropTable(
                name: "courses");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "courses",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    doctor_id = table.Column<int>(type: "integer", nullable: false),
                    allow_cross_section_teams = table.Column<bool>(type: "boolean", nullable: false),
                    code = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    semester = table.Column<string>(type: "text", nullable: true),
                    use_shared_project_across_sections = table.Column<bool>(type: "boolean", nullable: false)
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
                name: "course_project_settings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    file_name = table.Column<string>(type: "text", nullable: true),
                    file_url = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    team_size = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
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
                name: "course_projects",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_id = table.Column<int>(type: "integer", nullable: false),
                    ai_mode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "doctor"),
                    allow_cross_section_teams = table.Column<bool>(type: "boolean", nullable: false),
                    apply_to_all_sections = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    team_size = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false)
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
                name: "course_sections",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_id = table.Column<int>(type: "integer", nullable: false),
                    capacity = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    days = table.Column<string>(type: "text", nullable: true),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    time_from = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    time_to = table.Column<TimeOnly>(type: "time without time zone", nullable: true)
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
                name: "course_teams",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_id = table.Column<int>(type: "integer", nullable: false),
                    course_project_id = table.Column<int>(type: "integer", nullable: true),
                    leader_student_id = table.Column<int>(type: "integer", nullable: false),
                    project_setting_id = table.Column<int>(type: "integer", nullable: false),
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
                        name: "FK_course_teams_course_projects_course_project_id",
                        column: x => x.course_project_id,
                        principalTable: "course_projects",
                        principalColumn: "id");
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
                name: "course_enrollments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_id = table.Column<int>(type: "integer", nullable: false),
                    course_section_id = table.Column<int>(type: "integer", nullable: true),
                    student_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_enrollments", x => x.id);
                    table.ForeignKey(
                        name: "FK_course_enrollments_course_sections_course_section_id",
                        column: x => x.course_section_id,
                        principalTable: "course_sections",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
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

            migrationBuilder.CreateTable(
                name: "section_chat_messages",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    section_id = table.Column<int>(type: "integer", nullable: false),
                    sender_user_id = table.Column<int>(type: "integer", nullable: false),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    text = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_section_chat_messages", x => x.id);
                    table.ForeignKey(
                        name: "FK_section_chat_messages_course_sections_section_id",
                        column: x => x.section_id,
                        principalTable: "course_sections",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_section_chat_messages_users_sender_user_id",
                        column: x => x.sender_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "section_project_settings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_section_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    team_size = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
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

            migrationBuilder.CreateTable(
                name: "course_partner_requests",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_id = table.Column<int>(type: "integer", nullable: false),
                    course_project_id = table.Column<int>(type: "integer", nullable: true),
                    receiver_student_id = table.Column<int>(type: "integer", nullable: false),
                    sender_student_id = table.Column<int>(type: "integer", nullable: false),
                    team_id = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "pending")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_course_partner_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_course_partner_requests_course_projects_course_project_id",
                        column: x => x.course_project_id,
                        principalTable: "course_projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
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
                    course_id = table.Column<int>(type: "integer", nullable: false),
                    student_id = table.Column<int>(type: "integer", nullable: false),
                    team_id = table.Column<int>(type: "integer", nullable: false),
                    joined_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    project_setting_id = table.Column<int>(type: "integer", nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "member")
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
                name: "IX_course_enrollments_course_section_id",
                table: "course_enrollments",
                column: "course_section_id");

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
                name: "IX_course_partner_requests_course_project_id",
                table: "course_partner_requests",
                column: "course_project_id");

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
                name: "IX_course_project_sections_course_section_id",
                table: "course_project_sections",
                column: "course_section_id");

            migrationBuilder.CreateIndex(
                name: "ix_course_project_sections_project_section",
                table: "course_project_sections",
                columns: new[] { "course_project_id", "course_section_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_course_project_settings_course",
                table: "course_project_settings",
                column: "course_id");

            migrationBuilder.CreateIndex(
                name: "ix_course_projects_course",
                table: "course_projects",
                column: "course_id");

            migrationBuilder.CreateIndex(
                name: "ix_course_sections_course_name",
                table: "course_sections",
                columns: new[] { "course_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_course_team_members_course_id",
                table: "course_team_members",
                column: "course_id");

            migrationBuilder.CreateIndex(
                name: "ix_course_team_members_project_student",
                table: "course_team_members",
                columns: new[] { "project_setting_id", "student_id" },
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
                name: "IX_course_teams_course_project_id",
                table: "course_teams",
                column: "course_project_id");

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

            migrationBuilder.CreateIndex(
                name: "ix_section_chat_messages_section_sent",
                table: "section_chat_messages",
                columns: new[] { "section_id", "sent_at" });

            migrationBuilder.CreateIndex(
                name: "IX_section_chat_messages_sender_user_id",
                table: "section_chat_messages",
                column: "sender_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_section_project_settings_section",
                table: "section_project_settings",
                column: "course_section_id");
        }
    }
}
