using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyProfileUrlsAndLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // DB may already have these columns from an older company module — add only if missing.
            migrationBuilder.Sql("""
                ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS linkedin_url text;
                ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS location text;
                ALTER TABLE company_profiles ADD COLUMN IF NOT EXISTS website_url text;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "linkedin_url",
                table: "company_profiles");

            migrationBuilder.DropColumn(
                name: "location",
                table: "company_profiles");

            migrationBuilder.DropColumn(
                name: "website_url",
                table: "company_profiles");
        }
    }
}
