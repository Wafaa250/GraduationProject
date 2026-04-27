using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseProjectIdToPartnerRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "course_project_id",
                table: "course_partner_requests",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_course_partner_requests_course_project_id",
                table: "course_partner_requests",
                column: "course_project_id");

            migrationBuilder.AddForeignKey(
                name: "FK_course_partner_requests_course_projects_course_project_id",
                table: "course_partner_requests",
                column: "course_project_id",
                principalTable: "course_projects",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_course_partner_requests_course_projects_course_project_id",
                table: "course_partner_requests");

            migrationBuilder.DropIndex(
                name: "IX_course_partner_requests_course_project_id",
                table: "course_partner_requests");

            migrationBuilder.DropColumn(
                name: "course_project_id",
                table: "course_partner_requests");
        }
    }
}
