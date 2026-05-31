using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyRequestLifecycleStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "request_status",
                table: "company_requests",
                type: "text",
                nullable: false,
                defaultValue: "active");

            migrationBuilder.Sql(
                """
                UPDATE company_requests
                SET request_status = 'closed'
                WHERE status = 'archived';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "request_status",
                table: "company_requests");
        }
    }
}
