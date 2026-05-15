using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationFollows : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "organization_follows",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_profile_id = table.Column<int>(type: "integer", nullable: false),
                    student_profile_id = table.Column<int>(type: "integer", nullable: false),
                    followed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_organization_follows", x => x.id);
                    table.ForeignKey(
                        name: "FK_organization_follows_student_association_profiles_organizat~",
                        column: x => x.organization_profile_id,
                        principalTable: "student_association_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_organization_follows_student_profiles_student_profile_id",
                        column: x => x.student_profile_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_organization_follows_organization_profile_id_student_profil~",
                table: "organization_follows",
                columns: new[] { "organization_profile_id", "student_profile_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_organization_follows_student_profile_id",
                table: "organization_follows",
                column: "student_profile_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "organization_follows");
        }
    }
}
