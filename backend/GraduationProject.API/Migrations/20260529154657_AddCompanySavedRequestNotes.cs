using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanySavedRequestNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "company_saved_request_notes",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    company_profile_id = table.Column<int>(type: "integer", nullable: false),
                    company_request_id = table.Column<int>(type: "integer", nullable: false),
                    note = table.Column<string>(type: "text", nullable: true),
                    updated_by_user_id = table.Column<int>(type: "integer", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_saved_request_notes", x => x.id);
                    table.ForeignKey(
                        name: "FK_company_saved_request_notes_company_profiles_company_profil~",
                        column: x => x.company_profile_id,
                        principalTable: "company_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_saved_request_notes_company_requests_company_reques~",
                        column: x => x.company_request_id,
                        principalTable: "company_requests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_saved_request_notes_users_updated_by_user_id",
                        column: x => x.updated_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_company_saved_request_notes_company_profile_id_company_requ~",
                table: "company_saved_request_notes",
                columns: new[] { "company_profile_id", "company_request_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_company_saved_request_notes_company_request_id",
                table: "company_saved_request_notes",
                column: "company_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_company_saved_request_notes_updated_by_user_id",
                table: "company_saved_request_notes",
                column: "updated_by_user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "company_saved_request_notes");
        }
    }
}
