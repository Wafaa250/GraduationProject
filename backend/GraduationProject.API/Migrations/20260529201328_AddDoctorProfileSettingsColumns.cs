using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddDoctorProfileSettingsColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "academic_rank",
                table: "doctor_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "available_for_supervision",
                table: "doctor_profiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "notification_preferences",
                table: "doctor_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "phone_number",
                table: "doctor_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "preferred_project_areas",
                table: "doctor_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "research_interests",
                table: "doctor_profiles",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "academic_rank",
                table: "doctor_profiles");

            migrationBuilder.DropColumn(
                name: "available_for_supervision",
                table: "doctor_profiles");

            migrationBuilder.DropColumn(
                name: "notification_preferences",
                table: "doctor_profiles");

            migrationBuilder.DropColumn(
                name: "phone_number",
                table: "doctor_profiles");

            migrationBuilder.DropColumn(
                name: "preferred_project_areas",
                table: "doctor_profiles");

            migrationBuilder.DropColumn(
                name: "research_interests",
                table: "doctor_profiles");
        }
    }
}
