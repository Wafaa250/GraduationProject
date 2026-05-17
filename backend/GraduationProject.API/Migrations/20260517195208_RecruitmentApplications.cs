using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class RecruitmentApplications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "student_organization_recruitment_applications",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    student_profile_id = table.Column<int>(type: "integer", nullable: false),
                    organization_profile_id = table.Column<int>(type: "integer", nullable: false),
                    campaign_id = table.Column<int>(type: "integer", nullable: false),
                    position_id = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_organization_recruitment_applications", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_organization_recruitment_applications_student_assoc~",
                        column: x => x.organization_profile_id,
                        principalTable: "student_association_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_organization_recruitment_applications_student_organ~",
                        column: x => x.campaign_id,
                        principalTable: "student_organization_recruitment_campaigns",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_organization_recruitment_applications_student_orga~1",
                        column: x => x.position_id,
                        principalTable: "student_organization_recruitment_positions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_organization_recruitment_applications_student_profi~",
                        column: x => x.student_profile_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_organization_recruitment_application_answers",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    application_id = table.Column<int>(type: "integer", nullable: false),
                    question_id = table.Column<int>(type: "integer", nullable: false),
                    answer_value = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_organization_recruitment_application_answers", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_organization_recruitment_application_answers_studen~",
                        column: x => x.application_id,
                        principalTable: "student_organization_recruitment_applications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_organization_recruitment_application_answers_stude~1",
                        column: x => x.question_id,
                        principalTable: "student_organization_recruitment_questions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_application_answers_applic~",
                table: "student_organization_recruitment_application_answers",
                columns: new[] { "application_id", "question_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_application_answers_questi~",
                table: "student_organization_recruitment_application_answers",
                column: "question_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_applications_campaign_id",
                table: "student_organization_recruitment_applications",
                column: "campaign_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_applications_organization_~",
                table: "student_organization_recruitment_applications",
                columns: new[] { "organization_profile_id", "campaign_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_applications_position_id",
                table: "student_organization_recruitment_applications",
                column: "position_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_applications_student_profi~",
                table: "student_organization_recruitment_applications",
                columns: new[] { "student_profile_id", "position_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "student_organization_recruitment_application_answers");

            migrationBuilder.DropTable(
                name: "student_organization_recruitment_applications");
        }
    }
}
