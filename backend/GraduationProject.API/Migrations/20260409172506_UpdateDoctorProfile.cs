using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDoctorProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "linkedin",
                table: "doctor_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "office_hours",
                table: "doctor_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "research_skills",
                table: "doctor_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "technical_skills",
                table: "doctor_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "years_of_experience",
                table: "doctor_profiles",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "linkedin",
                table: "doctor_profiles");

            migrationBuilder.DropColumn(
                name: "office_hours",
                table: "doctor_profiles");

            migrationBuilder.DropColumn(
                name: "research_skills",
                table: "doctor_profiles");

            migrationBuilder.DropColumn(
                name: "technical_skills",
                table: "doctor_profiles");

            migrationBuilder.DropColumn(
                name: "years_of_experience",
                table: "doctor_profiles");
        }
    }
}
