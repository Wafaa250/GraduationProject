using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyProfileExtendedFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "areas_of_interest",
                table: "company_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "contact_email",
                table: "company_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "headquarters_location",
                table: "company_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "optional_contact_link",
                table: "company_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "working_style",
                table: "company_profiles",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "areas_of_interest",
                table: "company_profiles");

            migrationBuilder.DropColumn(
                name: "contact_email",
                table: "company_profiles");

            migrationBuilder.DropColumn(
                name: "headquarters_location",
                table: "company_profiles");

            migrationBuilder.DropColumn(
                name: "optional_contact_link",
                table: "company_profiles");

            migrationBuilder.DropColumn(
                name: "working_style",
                table: "company_profiles");
        }
    }
}
