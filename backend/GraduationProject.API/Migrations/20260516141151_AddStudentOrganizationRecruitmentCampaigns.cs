using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentOrganizationRecruitmentCampaigns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "student_organization_recruitment_campaigns",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_profile_id = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    application_deadline = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    cover_image_url = table.Column<string>(type: "text", nullable: true),
                    is_published = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_organization_recruitment_campaigns", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_organization_recruitment_campaigns_student_associat~",
                        column: x => x.organization_profile_id,
                        principalTable: "student_association_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_organization_recruitment_positions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    campaign_id = table.Column<int>(type: "integer", nullable: false),
                    role_title = table.Column<string>(type: "text", nullable: false),
                    needed_count = table.Column<int>(type: "integer", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    requirements = table.Column<string>(type: "text", nullable: true),
                    required_skills = table.Column<string>(type: "text", nullable: true),
                    display_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_organization_recruitment_positions", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_organization_recruitment_positions_student_organiza~",
                        column: x => x.campaign_id,
                        principalTable: "student_organization_recruitment_campaigns",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_campaigns_organization_pr~1",
                table: "student_organization_recruitment_campaigns",
                columns: new[] { "organization_profile_id", "is_published" });

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_campaigns_organization_pro~",
                table: "student_organization_recruitment_campaigns",
                column: "organization_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_positions_campaign_id",
                table: "student_organization_recruitment_positions",
                column: "campaign_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_positions_campaign_id_disp~",
                table: "student_organization_recruitment_positions",
                columns: new[] { "campaign_id", "display_order" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "student_organization_recruitment_positions");

            migrationBuilder.DropTable(
                name: "student_organization_recruitment_campaigns");
        }
    }
}
