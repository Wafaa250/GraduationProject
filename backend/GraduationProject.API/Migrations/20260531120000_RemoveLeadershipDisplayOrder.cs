using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLeadershipDisplayOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_student_organization_team_members_organization_profile_id_d~",
                table: "student_organization_team_members");

            migrationBuilder.DropColumn(
                name: "display_order",
                table: "student_organization_team_members");

            migrationBuilder.DropIndex(
                name: "IX_student_organization_recruitment_positions_campaign_id_disp~",
                table: "student_organization_recruitment_positions");

            migrationBuilder.DropColumn(
                name: "display_order",
                table: "student_organization_recruitment_positions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "display_order",
                table: "student_organization_team_members",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "display_order",
                table: "student_organization_recruitment_positions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_team_members_organization_profile_id_d~",
                table: "student_organization_team_members",
                columns: new[] { "organization_profile_id", "display_order" });

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_positions_campaign_id_disp~",
                table: "student_organization_recruitment_positions",
                columns: new[] { "campaign_id", "display_order" });
        }
    }
}
