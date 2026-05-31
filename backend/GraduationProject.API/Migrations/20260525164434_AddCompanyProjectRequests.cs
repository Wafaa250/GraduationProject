using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyProjectRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "company_requests",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    company_profile_id = table.Column<int>(type: "integer", nullable: false),
                    request_type = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    wizard_step = table.Column<int>(type: "integer", nullable: true),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false),
                    category_choice = table.Column<string>(type: "text", nullable: true),
                    category_other = table.Column<string>(type: "text", nullable: true),
                    duration_ongoing = table.Column<bool>(type: "boolean", nullable: false),
                    duration_value = table.Column<int>(type: "integer", nullable: true),
                    duration_unit = table.Column<string>(type: "text", nullable: true),
                    duration_label = table.Column<string>(type: "text", nullable: true),
                    collaboration_format = table.Column<string>(type: "text", nullable: true),
                    scope_notes = table.Column<string>(type: "text", nullable: true),
                    matching_status = table.Column<string>(type: "text", nullable: true),
                    matched_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_company_requests_company_profiles_company_profile_id",
                        column: x => x.company_profile_id,
                        principalTable: "company_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "company_request_roles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    company_request_id = table.Column<int>(type: "integer", nullable: false),
                    client_role_key = table.Column<string>(type: "text", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    role_name = table.Column<string>(type: "text", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_request_roles", x => x.id);
                    table.ForeignKey(
                        name: "FK_company_request_roles_company_requests_company_request_id",
                        column: x => x.company_request_id,
                        principalTable: "company_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "company_request_skills",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    company_request_role_id = table.Column<int>(type: "integer", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    skill_name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_request_skills", x => x.id);
                    table.ForeignKey(
                        name: "FK_company_request_skills_company_request_roles_company_reques~",
                        column: x => x.company_request_role_id,
                        principalTable: "company_request_roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_company_request_roles_company_request_id",
                table: "company_request_roles",
                column: "company_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_request_skills_company_request_role_id",
                table: "company_request_skills",
                column: "company_request_role_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_requests_company_profile_id",
                table: "company_requests",
                column: "company_profile_id",
                unique: true,
                filter: "\"status\" = 'draft'");

            migrationBuilder.CreateIndex(
                name: "IX_company_requests_company_profile_id_status",
                table: "company_requests",
                columns: new[] { "company_profile_id", "status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "company_request_skills");

            migrationBuilder.DropTable(
                name: "company_request_roles");

            migrationBuilder.DropTable(
                name: "company_requests");
        }
    }
}
