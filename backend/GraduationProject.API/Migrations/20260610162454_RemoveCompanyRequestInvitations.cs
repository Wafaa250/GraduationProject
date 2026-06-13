using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveCompanyRequestInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "company_request_invitations");

            // display_order may already exist if RemoveLeadershipDisplayOrder was never applied
            // (or the column was retained while EF snapshots dropped it). Add only when missing.
            migrationBuilder.Sql("""
                DO $EF$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM information_schema.columns
                        WHERE table_schema = current_schema()
                          AND table_name = 'student_organization_team_members'
                          AND column_name = 'display_order'
                    ) THEN
                        ALTER TABLE student_organization_team_members
                            ADD COLUMN display_order integer NOT NULL DEFAULT 0;
                    END IF;
                END $EF$;
                """);

            migrationBuilder.CreateTable(
                name: "doctor_posts",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    attachment_url = table.Column<string>(type: "text", nullable: true),
                    attachment_type = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_doctor_posts", x => x.id);
                    table.ForeignKey(
                        name: "FK_doctor_posts_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_posts",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    attachment_url = table.Column<string>(type: "text", nullable: true),
                    attachment_type = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_posts", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_posts_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_doctor_posts_created_at",
                table: "doctor_posts",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_doctor_posts_user_id",
                table: "doctor_posts",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_posts_created_at",
                table: "student_posts",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_student_posts_user_id",
                table: "student_posts",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "doctor_posts");

            migrationBuilder.DropTable(
                name: "student_posts");

            // Intentionally leave display_order unchanged on rollback. The column may have
            // existed before this migration when RemoveLeadershipDisplayOrder was not applied.

            migrationBuilder.CreateTable(
                name: "company_request_invitations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    company_profile_id = table.Column<int>(type: "integer", nullable: false),
                    company_request_id = table.Column<int>(type: "integer", nullable: false),
                    company_request_role_id = table.Column<int>(type: "integer", nullable: true),
                    invited_by_user_id = table.Column<int>(type: "integer", nullable: false),
                    student_profile_id = table.Column<int>(type: "integer", nullable: false),
                    cancelled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    match_score = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    message = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    source = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false, defaultValue: "pending")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_request_invitations", x => x.id);
                    table.ForeignKey(
                        name: "FK_company_request_invitations_company_profiles_company_profil~",
                        column: x => x.company_profile_id,
                        principalTable: "company_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_request_invitations_company_request_roles_company_r~",
                        column: x => x.company_request_role_id,
                        principalTable: "company_request_roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_company_request_invitations_company_requests_company_reques~",
                        column: x => x.company_request_id,
                        principalTable: "company_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_request_invitations_student_profiles_student_profil~",
                        column: x => x.student_profile_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_request_invitations_users_invited_by_user_id",
                        column: x => x.invited_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_company_request_invitations_company_profile_id",
                table: "company_request_invitations",
                column: "company_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_request_invitations_company_request_id",
                table: "company_request_invitations",
                column: "company_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_request_invitations_company_request_id_student_pro~1",
                table: "company_request_invitations",
                columns: new[] { "company_request_id", "student_profile_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_company_request_invitations_company_request_id_student_prof~",
                table: "company_request_invitations",
                columns: new[] { "company_request_id", "student_profile_id" },
                unique: true,
                filter: "status = 'pending'");

            migrationBuilder.CreateIndex(
                name: "IX_company_request_invitations_company_request_role_id",
                table: "company_request_invitations",
                column: "company_request_role_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_request_invitations_invited_by_user_id",
                table: "company_request_invitations",
                column: "invited_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_request_invitations_student_profile_id",
                table: "company_request_invitations",
                column: "student_profile_id");
        }
    }
}
