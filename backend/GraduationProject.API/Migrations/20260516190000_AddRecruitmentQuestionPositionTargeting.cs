using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddRecruitmentQuestionPositionTargeting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "position_id",
                table: "student_organization_recruitment_questions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_recruitment_questions_position_id",
                table: "student_organization_recruitment_questions",
                column: "position_id");

            migrationBuilder.AddForeignKey(
                name: "FK_student_organization_recruitment_questions_student_organization_recruitment_positions_position_id",
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
                name: "FK_student_organization_recruitment_questions_student_organization_recruitment_positions_position_id",
                table: "student_organization_recruitment_questions");

            migrationBuilder.DropIndex(
                name: "IX_student_organization_recruitment_questions_position_id",
                table: "student_organization_recruitment_questions");

            migrationBuilder.DropColumn(
                name: "position_id",
                table: "student_organization_recruitment_questions");
        }
    }
}
