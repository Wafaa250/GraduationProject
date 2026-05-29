using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyRequestTeamRecommendations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Recover from a partial apply (e.g. empty migration recorded earlier or manual schema drift).
            migrationBuilder.Sql("""
                DROP TABLE IF EXISTS company_request_team_recommendation_members CASCADE;
                DROP TABLE IF EXISTS company_request_team_recommendations CASCADE;
                DROP TABLE IF EXISTS company_request_team_recommendation_runs CASCADE;
                """);

            migrationBuilder.CreateTable(
                name: "company_request_team_recommendation_runs",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    company_request_id = table.Column<int>(type: "integer", nullable: false),
                    company_profile_id = table.Column<int>(type: "integer", nullable: false),
                    algorithm_version = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false, defaultValue: "completed"),
                    generated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    error_message = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_request_team_recommendation_runs", x => x.id);
                    table.ForeignKey(
                        name: "FK_crtr_company_profile",
                        column: x => x.company_profile_id,
                        principalTable: "company_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_crtr_company_request",
                        column: x => x.company_request_id,
                        principalTable: "company_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "company_request_team_recommendations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    run_id = table.Column<int>(type: "integer", nullable: false),
                    company_request_id = table.Column<int>(type: "integer", nullable: false),
                    team_rank = table.Column<int>(type: "integer", nullable: false),
                    total_score = table.Column<int>(type: "integer", nullable: false),
                    role_coverage_score = table.Column<int>(type: "integer", nullable: false),
                    compatibility_score = table.Column<int>(type: "integer", nullable: false),
                    summary_reason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    strengths_json = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    risks_json = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_request_team_recommendations", x => x.id);
                    table.ForeignKey(
                        name: "FK_crtt_run",
                        column: x => x.run_id,
                        principalTable: "company_request_team_recommendation_runs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_crtt_company_request",
                        column: x => x.company_request_id,
                        principalTable: "company_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "company_request_team_recommendation_members",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    team_recommendation_id = table.Column<int>(type: "integer", nullable: false),
                    company_request_role_id = table.Column<int>(type: "integer", nullable: false),
                    student_profile_id = table.Column<int>(type: "integer", nullable: false),
                    role_score = table.Column<int>(type: "integer", nullable: false),
                    semantic_similarity = table.Column<double>(type: "double precision", nullable: false),
                    assignment_reason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    highlights_json = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_request_team_recommendation_members", x => x.id);
                    table.ForeignKey(
                        name: "FK_crtm_team_rec",
                        column: x => x.team_recommendation_id,
                        principalTable: "company_request_team_recommendations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_crtm_role",
                        column: x => x.company_request_role_id,
                        principalTable: "company_request_roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_crtm_student",
                        column: x => x.student_profile_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_crtr_company_profile",
                table: "company_request_team_recommendation_runs",
                column: "company_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_crtr_company_request",
                table: "company_request_team_recommendation_runs",
                column: "company_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_crtr_request_generated_at",
                table: "company_request_team_recommendation_runs",
                columns: new[] { "company_request_id", "generated_at" });

            migrationBuilder.CreateIndex(
                name: "IX_crtt_company_request",
                table: "company_request_team_recommendations",
                column: "company_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_crtt_run",
                table: "company_request_team_recommendations",
                column: "run_id");

            migrationBuilder.CreateIndex(
                name: "IX_crtt_run_team_rank",
                table: "company_request_team_recommendations",
                columns: new[] { "run_id", "team_rank" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_crtm_role_id",
                table: "company_request_team_recommendation_members",
                column: "company_request_role_id");

            migrationBuilder.CreateIndex(
                name: "IX_crtm_student_id",
                table: "company_request_team_recommendation_members",
                column: "student_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_crtm_team_rec_id",
                table: "company_request_team_recommendation_members",
                column: "team_recommendation_id");

            migrationBuilder.CreateIndex(
                name: "IX_crtm_team_rec_role",
                table: "company_request_team_recommendation_members",
                columns: new[] { "team_recommendation_id", "company_request_role_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP TABLE IF EXISTS company_request_team_recommendation_members CASCADE;
                DROP TABLE IF EXISTS company_request_team_recommendations CASCADE;
                DROP TABLE IF EXISTS company_request_team_recommendation_runs CASCADE;
                """);
        }
    }
}
