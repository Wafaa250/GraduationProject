using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanySavedRecommendations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "company_saved_student_recommendations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    company_profile_id = table.Column<int>(type: "integer", nullable: false),
                    company_request_id = table.Column<int>(type: "integer", nullable: false),
                    student_profile_id = table.Column<int>(type: "integer", nullable: false),
                    saved_by_user_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_saved_student_recommendations", x => x.id);
                    table.ForeignKey(
                        name: "FK_company_saved_student_recommendations_company_profiles_comp~",
                        column: x => x.company_profile_id,
                        principalTable: "company_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_saved_student_recommendations_company_requests_comp~",
                        column: x => x.company_request_id,
                        principalTable: "company_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_saved_student_recommendations_student_profiles_stud~",
                        column: x => x.student_profile_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_saved_student_recommendations_users_saved_by_user_id",
                        column: x => x.saved_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "company_saved_team_recommendations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    company_profile_id = table.Column<int>(type: "integer", nullable: false),
                    company_request_id = table.Column<int>(type: "integer", nullable: false),
                    team_recommendation_id = table.Column<int>(type: "integer", nullable: false),
                    saved_by_user_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_saved_team_recommendations", x => x.id);
                    table.ForeignKey(
                        name: "FK_company_saved_team_recommendations_company_profiles_company~",
                        column: x => x.company_profile_id,
                        principalTable: "company_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_saved_team_recommendations_company_request_team_rec~",
                        column: x => x.team_recommendation_id,
                        principalTable: "company_request_team_recommendations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_saved_team_recommendations_company_requests_company~",
                        column: x => x.company_request_id,
                        principalTable: "company_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_saved_team_recommendations_users_saved_by_user_id",
                        column: x => x.saved_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_company_saved_student_recommendations_company_profile_id",
                table: "company_saved_student_recommendations",
                column: "company_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_saved_student_recommendations_company_profile_id_co~",
                table: "company_saved_student_recommendations",
                columns: new[] { "company_profile_id", "company_request_id", "student_profile_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_company_saved_student_recommendations_company_request_id",
                table: "company_saved_student_recommendations",
                column: "company_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_saved_student_recommendations_saved_by_user_id",
                table: "company_saved_student_recommendations",
                column: "saved_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_saved_student_recommendations_student_profile_id",
                table: "company_saved_student_recommendations",
                column: "student_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_saved_team_recommendations_company_profile_id",
                table: "company_saved_team_recommendations",
                column: "company_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_saved_team_recommendations_company_profile_id_compa~",
                table: "company_saved_team_recommendations",
                columns: new[] { "company_profile_id", "company_request_id", "team_recommendation_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_company_saved_team_recommendations_company_request_id",
                table: "company_saved_team_recommendations",
                column: "company_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_saved_team_recommendations_saved_by_user_id",
                table: "company_saved_team_recommendations",
                column: "saved_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_saved_team_recommendations_team_recommendation_id",
                table: "company_saved_team_recommendations",
                column: "team_recommendation_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "company_saved_student_recommendations");

            migrationBuilder.DropTable(
                name: "company_saved_team_recommendations");
        }
    }
}
