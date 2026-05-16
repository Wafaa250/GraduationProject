using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class RecruitmentApplicationForms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "help_text",
                table: "student_organization_recruitment_questions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "position_id",
                table: "student_organization_recruitment_questions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_questions_campaign_id_posi~",
                table: "student_organization_recruitment_questions",
                columns: new[] { "campaign_id", "position_id", "display_order" });

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_questions_position_id",
                table: "student_organization_recruitment_questions",
                column: "position_id");

            migrationBuilder.AddForeignKey(
                name: "FK_student_organization_recruitment_questions_student_organiz~1",
                table: "student_organization_recruitment_questions",
                column: "position_id",
                principalTable: "student_organization_recruitment_positions",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_student_organization_recruitment_questions_student_organiz~1",
                table: "student_organization_recruitment_questions");

            migrationBuilder.DropIndex(
                name: "IX_student_organization_recruitment_questions_campaign_id_posi~",
                table: "student_organization_recruitment_questions");

            migrationBuilder.DropIndex(
                name: "IX_student_organization_recruitment_questions_position_id",
                table: "student_organization_recruitment_questions");

            migrationBuilder.DropColumn(
                name: "help_text",
                table: "student_organization_recruitment_questions");

            migrationBuilder.DropColumn(
                name: "position_id",
                table: "student_organization_recruitment_questions");
        }
    }
}
