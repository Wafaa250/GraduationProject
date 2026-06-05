using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentOrganizationEventIsPublished : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_published",
                table: "student_organization_events",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_events_organization_profile_id_is_publ~",
                table: "student_organization_events",
                columns: new[] { "organization_profile_id", "is_published" });

            migrationBuilder.Sql(
                "UPDATE student_organization_events SET is_published = true;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_student_organization_events_organization_profile_id_is_publ~",
                table: "student_organization_events");

            migrationBuilder.DropColumn(
                name: "is_published",
                table: "student_organization_events");
        }
    }
}
