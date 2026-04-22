using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSupervisorFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "supervisor_id",
                table: "graduation_projects",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "supervisor_requests",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    project_id = table.Column<int>(type: "integer", nullable: false),
                    doctor_id = table.Column<int>(type: "integer", nullable: false),
                    sender_id = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "pending"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_supervisor_requests", x => x.id);
                    table.ForeignKey(
                        name: "FK_supervisor_requests_doctor_profiles_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "doctor_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_supervisor_requests_graduation_projects_project_id",
                        column: x => x.project_id,
                        principalTable: "graduation_projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_supervisor_requests_student_profiles_sender_id",
                        column: x => x.sender_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_graduation_projects_supervisor_id",
                table: "graduation_projects",
                column: "supervisor_id");

            migrationBuilder.CreateIndex(
                name: "ix_supervisor_requests_doctor",
                table: "supervisor_requests",
                column: "doctor_id");

            migrationBuilder.CreateIndex(
                name: "ix_supervisor_requests_project",
                table: "supervisor_requests",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "IX_supervisor_requests_sender_id",
                table: "supervisor_requests",
                column: "sender_id");

            migrationBuilder.AddForeignKey(
                name: "FK_graduation_projects_doctor_profiles_supervisor_id",
                table: "graduation_projects",
                column: "supervisor_id",
                principalTable: "doctor_profiles",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_graduation_projects_doctor_profiles_supervisor_id",
                table: "graduation_projects");

            migrationBuilder.DropTable(
                name: "supervisor_requests");

            migrationBuilder.DropIndex(
                name: "IX_graduation_projects_supervisor_id",
                table: "graduation_projects");

            migrationBuilder.DropColumn(
                name: "supervisor_id",
                table: "graduation_projects");
        }
    }
}
