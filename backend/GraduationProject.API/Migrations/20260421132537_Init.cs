using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class Init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "skills",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_skills", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    password = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "association_profiles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    association_name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_association_profiles", x => x.id);
                    table.ForeignKey(
                        name: "FK_association_profiles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "company_profiles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    company_name = table.Column<string>(type: "text", nullable: false),
                    industry = table.Column<string>(type: "text", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_profiles", x => x.id);
                    table.ForeignKey(
                        name: "FK_company_profiles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "doctor_profiles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    specialization = table.Column<string>(type: "text", nullable: true),
                    supervision_capacity = table.Column<int>(type: "integer", nullable: false),
                    bio = table.Column<string>(type: "text", nullable: true),
                    university = table.Column<string>(type: "text", nullable: true),
                    faculty = table.Column<string>(type: "text", nullable: true),
                    department = table.Column<string>(type: "text", nullable: false),
                    profile_picture_base64 = table.Column<string>(type: "text", nullable: true),
                    years_of_experience = table.Column<int>(type: "integer", nullable: true),
                    linkedin = table.Column<string>(type: "text", nullable: true),
                    office_hours = table.Column<string>(type: "text", nullable: true),
                    technical_skills = table.Column<string>(type: "text", nullable: true),
                    research_skills = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_doctor_profiles", x => x.id);
                    table.ForeignKey(
                        name: "FK_doctor_profiles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_profiles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    major = table.Column<string>(type: "text", nullable: true),
                    bio = table.Column<string>(type: "text", nullable: true),
                    student_id = table.Column<string>(type: "text", nullable: true),
                    university = table.Column<string>(type: "text", nullable: true),
                    faculty = table.Column<string>(type: "text", nullable: true),
                    academic_year = table.Column<string>(type: "text", nullable: true),
                    gpa = table.Column<decimal>(type: "numeric", nullable: true),
                    availability = table.Column<string>(type: "text", nullable: true),
                    looking_for = table.Column<string>(type: "text", nullable: true),
                    github = table.Column<string>(type: "text", nullable: true),
                    linkedin = table.Column<string>(type: "text", nullable: true),
                    portfolio = table.Column<string>(type: "text", nullable: true),
                    profile_picture_base64 = table.Column<string>(type: "text", nullable: true),
                    languages = table.Column<string>(type: "text", nullable: true),
                    tools = table.Column<string>(type: "text", nullable: true),
                    roles = table.Column<string>(type: "text", nullable: true),
                    technical_skills = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_profiles", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_profiles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "courses",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    code = table.Column<string>(type: "text", nullable: false),
                    doctor_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    semester = table.Column<string>(type: "text", nullable: true),
                    use_shared_project_across_sections = table.Column<bool>(type: "boolean", nullable: false),
                    allow_cross_section_teams = table.Column<bool>(type: "boolean", nullable: false)
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
                name: "graduation_projects",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    owner_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    @abstract = table.Column<string>(name: "abstract", type: "text", nullable: true),
                    project_type = table.Column<string>(type: "text", nullable: false),
                    required_skills = table.Column<string>(type: "text", nullable: true),
                    partners_count = table.Column<int>(type: "integer", nullable: false),
                    supervisor_id = table.Column<int>(type: "integer", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_graduation_projects", x => x.id);
                    table.ForeignKey(
                        name: "FK_graduation_projects_doctor_profiles_supervisor_id",
                        column: x => x.supervisor_id,
                        principalTable: "doctor_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_graduation_projects_student_profiles_owner_id",
                        column: x => x.owner_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_skills",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    student_id = table.Column<int>(type: "integer", nullable: false),
                    skill_id = table.Column<int>(type: "integer", nullable: false),
                    level = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_skills", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_skills_skills_skill_id",
                        column: x => x.skill_id,
                        principalTable: "skills",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_student_skills_student_profiles_student_id",
                        column: x => x.student_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
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
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    file_url = table.Column<string>(type: "text", nullable: true),
                    file_name = table.Column<string>(type: "text", nullable: true)
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
                name: "graduation_project_members",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    project_id = table.Column<int>(type: "integer", nullable: false),
                    student_id = table.Column<int>(type: "integer", nullable: false),
                    role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "member"),
                    joined_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_graduation_project_members", x => x.id);
                    table.ForeignKey(
                        name: "FK_graduation_project_members_graduation_projects_project_id",
                        column: x => x.project_id,
                        principalTable: "graduation_projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_graduation_project_members_student_profiles_student_id",
                        column: x => x.student_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "project_invitations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    project_id = table.Column<int>(type: "integer", nullable: false),
                    sender_id = table.Column<int>(type: "integer", nullable: false),
                    receiver_id = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "pending"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_project_invitations", x => x.id);
                    table.ForeignKey(
                        name: "FK_project_invitations_graduation_projects_project_id",
                        column: x => x.project_id,
                        principalTable: "graduation_projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_project_invitations_student_profiles_receiver_id",
                        column: x => x.receiver_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_project_invitations_student_profiles_sender_id",
                        column: x => x.sender_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "supervisor_cancellation_requests",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    project_id = table.Column<int>(type: "integer", nullable: false),
                    doctor_id = table.Column<int>(type: "integer", nullable: false),
                    sender_id = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "pending"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_supervisor_cancellation_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_supervisor_cancellation_requests_doctor_profiles_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "doctor_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_supervisor_cancellation_requests_graduation_projects_projec~",
                        column: x => x.project_id,
                        principalTable: "graduation_projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_supervisor_cancellation_requests_student_profiles_sender_id",
                        column: x => x.sender_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "supervisor_requests",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    project_id = table.Column<int>(type: "integer", nullable: false),
                    doctor_id = table.Column<int>(type: "integer", nullable: false),
                    sender_id = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "pending"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_supervisor_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_supervisor_requests_doctor_profiles_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "doctor_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_supervisor_requests_graduation_projects_project_id",
                        column: x => x.project_id,
                        principalTable: "graduation_projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_supervisor_requests_student_profiles_sender_id",
                        column: x => x.sender_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
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
                name: "course_enrollments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_id = table.Column<int>(type: "integer", nullable: false),
                    student_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    course_section_id = table.Column<int>(type: "integer", nullable: true)
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
                name: "IX_association_profiles_user_id",
                table: "association_profiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_company_profiles_user_id",
                table: "company_profiles",
                column: "user_id",
                unique: true);

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
                name: "ix_course_sections_course_number",
                table: "course_sections",
                columns: new[] { "course_id", "section_number" },
                unique: true);

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

            migrationBuilder.CreateIndex(
                name: "IX_doctor_profiles_user_id",
                table: "doctor_profiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_graduation_project_members_project_student",
                table: "graduation_project_members",
                columns: new[] { "project_id", "student_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_graduation_project_members_student_id",
                table: "graduation_project_members",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "IX_graduation_projects_owner_id",
                table: "graduation_projects",
                column: "owner_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_graduation_projects_supervisor_id",
                table: "graduation_projects",
                column: "supervisor_id");

            migrationBuilder.CreateIndex(
                name: "ix_project_invitations_project_receiver",
                table: "project_invitations",
                columns: new[] { "project_id", "receiver_id" });

            migrationBuilder.CreateIndex(
                name: "IX_project_invitations_receiver_id",
                table: "project_invitations",
                column: "receiver_id");

            migrationBuilder.CreateIndex(
                name: "IX_project_invitations_sender_id",
                table: "project_invitations",
                column: "sender_id");

            migrationBuilder.CreateIndex(
                name: "ix_section_project_settings_section",
                table: "section_project_settings",
                column: "course_section_id");

            migrationBuilder.CreateIndex(
                name: "IX_skills_name",
                table: "skills",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_profiles_user_id",
                table: "student_profiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_skills_skill_id",
                table: "student_skills",
                column: "skill_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_skills_student_id_skill_id",
                table: "student_skills",
                columns: new[] { "student_id", "skill_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_supervisor_cancellation_requests_doctor",
                table: "supervisor_cancellation_requests",
                column: "doctor_id");

            migrationBuilder.CreateIndex(
                name: "ix_supervisor_cancellation_requests_project",
                table: "supervisor_cancellation_requests",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "IX_supervisor_cancellation_requests_sender_id",
                table: "supervisor_cancellation_requests",
                column: "sender_id");

            migrationBuilder.CreateIndex(
                name: "ix_supervisor_requests_doctor",
                table: "supervisor_requests",
                column: "doctor_id");

            migrationBuilder.CreateIndex(
                name: "ix_supervisor_requests_project",
                table: "supervisor_requests",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "IX_supervisor_requests_sender_id",
                table: "supervisor_requests",
                column: "sender_id");

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "association_profiles");

            migrationBuilder.DropTable(
                name: "company_profiles");

            migrationBuilder.DropTable(
                name: "course_enrollments");

            migrationBuilder.DropTable(
                name: "course_partner_requests");

            migrationBuilder.DropTable(
                name: "course_project_sections");

            migrationBuilder.DropTable(
                name: "course_team_members");

            migrationBuilder.DropTable(
                name: "graduation_project_members");

            migrationBuilder.DropTable(
                name: "project_invitations");

            migrationBuilder.DropTable(
                name: "section_project_settings");

            migrationBuilder.DropTable(
                name: "student_skills");

            migrationBuilder.DropTable(
                name: "supervisor_cancellation_requests");

            migrationBuilder.DropTable(
                name: "supervisor_requests");

            migrationBuilder.DropTable(
                name: "course_projects");

            migrationBuilder.DropTable(
                name: "course_teams");

            migrationBuilder.DropTable(
                name: "course_sections");

            migrationBuilder.DropTable(
                name: "skills");

            migrationBuilder.DropTable(
                name: "graduation_projects");

            migrationBuilder.DropTable(
                name: "course_project_settings");

            migrationBuilder.DropTable(
                name: "student_profiles");

            migrationBuilder.DropTable(
                name: "courses");

            migrationBuilder.DropTable(
                name: "doctor_profiles");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
