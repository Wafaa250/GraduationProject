using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyRequestHubPublishing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_published_to_hub",
                table: "company_requests",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "published_to_hub_at",
                table: "company_requests",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_published_to_hub",
                table: "company_requests");

            migrationBuilder.DropColumn(
                name: "published_to_hub_at",
                table: "company_requests");
        }
    }
}
