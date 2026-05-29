using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyMembersAndRequestAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "company_requests",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "company_requests",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "company_members",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    company_profile_id = table.Column<int>(type: "integer", nullable: false),
                    role = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_members", x => x.id);
                    table.ForeignKey(
                        name: "FK_company_members_company_profiles_company_profile_id",
                        column: x => x.company_profile_id,
                        principalTable: "company_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_members_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_company_members_company_profile_id_user_id",
                table: "company_members",
                columns: new[] { "company_profile_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_company_members_user_id",
                table: "company_members",
                column: "user_id",
                unique: true);

            migrationBuilder.Sql("""
                INSERT INTO company_members (user_id, company_profile_id, role, created_at)
                SELECT cp.user_id, cp.id, 'owner', NOW() AT TIME ZONE 'UTC'
                FROM company_profiles cp
                WHERE NOT EXISTS (
                    SELECT 1 FROM company_members cm WHERE cm.user_id = cp.user_id
                );
                """);

            migrationBuilder.Sql("""
                UPDATE company_requests cr
                SET created_by_user_id = cp.user_id
                FROM company_profiles cp
                WHERE cr.company_profile_id = cp.id
                  AND cr.created_by_user_id IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "company_members");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "company_requests");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "company_requests");
        }
    }
}
