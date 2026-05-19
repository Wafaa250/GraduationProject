using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyTalentRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "company_talent_requests",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    company_profile_id = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    required_skills = table.Column<string>(type: "text", nullable: true),
                    preferred_major = table.Column<string>(type: "text", nullable: true),
                    engagement_type = table.Column<string>(type: "text", nullable: true),
                    duration = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_talent_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_company_talent_requests_company_profiles_company_profile_id",
                        column: x => x.company_profile_id,
                        principalTable: "company_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_company_talent_requests_company_profile_id",
                table: "company_talent_requests",
                column: "company_profile_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "company_talent_requests");
        }
    }
}
