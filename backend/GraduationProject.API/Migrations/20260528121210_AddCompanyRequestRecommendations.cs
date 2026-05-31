using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyRequestRecommendations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "company_request_recommendation_runs",
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
                    error_message = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_request_recommendation_runs", x => x.id);
                    table.ForeignKey(
                        name: "FK_company_request_recommendation_runs_company_profiles_compan~",
                        column: x => x.company_profile_id,
                        principalTable: "company_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_request_recommendation_runs_company_requests_compan~",
                        column: x => x.company_request_id,
                        principalTable: "company_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "company_request_recommendations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    run_id = table.Column<int>(type: "integer", nullable: false),
                    company_request_id = table.Column<int>(type: "integer", nullable: false),
                    student_profile_id = table.Column<int>(type: "integer", nullable: false),
                    rank = table.Column<int>(type: "integer", nullable: false),
                    score = table.Column<int>(type: "integer", nullable: false),
                    score_breakdown_json = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    reason_summary = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    highlights_json = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    source = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false, defaultValue: "deterministic"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_request_recommendations", x => x.id);
                    table.ForeignKey(
                        name: "FK_company_request_recommendations_company_request_recommendat~",
                        column: x => x.run_id,
                        principalTable: "company_request_recommendation_runs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_request_recommendations_company_requests_company_re~",
                        column: x => x.company_request_id,
                        principalTable: "company_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_request_recommendations_student_profiles_student_pr~",
                        column: x => x.student_profile_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_company_request_recommendation_runs_company_profile_id",
                table: "company_request_recommendation_runs",
                column: "company_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_request_recommendation_runs_company_request_id",
                table: "company_request_recommendation_runs",
                column: "company_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_request_recommendation_runs_company_request_id_gene~",
                table: "company_request_recommendation_runs",
                columns: new[] { "company_request_id", "generated_at" });

            migrationBuilder.CreateIndex(
                name: "IX_company_request_recommendations_company_request_id",
                table: "company_request_recommendations",
                column: "company_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_request_recommendations_company_request_id_student_~",
                table: "company_request_recommendations",
                columns: new[] { "company_request_id", "student_profile_id" });

            migrationBuilder.CreateIndex(
                name: "IX_company_request_recommendations_run_id",
                table: "company_request_recommendations",
                column: "run_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_request_recommendations_run_id_rank",
                table: "company_request_recommendations",
                columns: new[] { "run_id", "rank" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_company_request_recommendations_student_profile_id",
                table: "company_request_recommendations",
                column: "student_profile_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "company_request_recommendations");

            migrationBuilder.DropTable(
                name: "company_request_recommendation_runs");
        }
    }
}
