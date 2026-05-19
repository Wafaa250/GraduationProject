using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class RecruitmentApplicantAnalyses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "student_organization_recruitment_applicant_analyses",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_profile_id = table.Column<int>(type: "integer", nullable: false),
                    campaign_id = table.Column<int>(type: "integer", nullable: false),
                    position_id = table.Column<int>(type: "integer", nullable: false),
                    top_k = table.Column<int>(type: "integer", nullable: false),
                    results_json = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_organization_recruitment_applicant_analyses", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_organization_recruitment_applicant_analyses_student~",
                        column: x => x.position_id,
                        principalTable: "student_organization_recruitment_positions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_applicant_analyses_positi~1",
                table: "student_organization_recruitment_applicant_analyses",
                columns: new[] { "position_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_applicant_analyses_positio~",
                table: "student_organization_recruitment_applicant_analyses",
                column: "position_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "student_organization_recruitment_applicant_analyses");
        }
    }
}
