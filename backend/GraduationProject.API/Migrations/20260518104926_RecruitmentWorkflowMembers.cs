using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class RecruitmentWorkflowMembers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "accepted_at",
                table: "student_organization_recruitment_applications",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "student_organization_members",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    organization_profile_id = table.Column<int>(type: "integer", nullable: false),
                    student_profile_id = table.Column<int>(type: "integer", nullable: false),
                    source_application_id = table.Column<int>(type: "integer", nullable: true),
                    role_title = table.Column<string>(type: "text", nullable: true),
                    accepted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_organization_members", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_organization_members_student_association_profiles_o~",
                        column: x => x.organization_profile_id,
                        principalTable: "student_association_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_organization_members_student_organization_recruitme~",
                        column: x => x.source_application_id,
                        principalTable: "student_organization_recruitment_applications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_student_organization_members_student_profiles_student_profi~",
                        column: x => x.student_profile_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_members_organization_profile_id_studen~",
                table: "student_organization_members",
                columns: new[] { "organization_profile_id", "student_profile_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_members_source_application_id",
                table: "student_organization_members",
                column: "source_application_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_members_student_profile_id",
                table: "student_organization_members",
                column: "student_profile_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "student_organization_members");

            migrationBuilder.DropColumn(
                name: "accepted_at",
                table: "student_organization_recruitment_applications");
        }
    }
}
