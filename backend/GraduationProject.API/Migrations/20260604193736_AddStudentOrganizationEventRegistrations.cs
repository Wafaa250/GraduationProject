using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentOrganizationEventRegistrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "student_organization_event_registrations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    event_id = table.Column<int>(type: "integer", nullable: false),
                    student_profile_id = table.Column<int>(type: "integer", nullable: false),
                    organization_profile_id = table.Column<int>(type: "integer", nullable: false),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_organization_event_registrations", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_organization_event_registrations_student_associatio~",
                        column: x => x.organization_profile_id,
                        principalTable: "student_association_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_organization_event_registrations_student_organizati~",
                        column: x => x.event_id,
                        principalTable: "student_organization_events",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_organization_event_registrations_student_profiles_s~",
                        column: x => x.student_profile_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_organization_event_registration_answers",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    registration_id = table.Column<int>(type: "integer", nullable: false),
                    field_id = table.Column<int>(type: "integer", nullable: false),
                    answer_value = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_organization_event_registration_answers", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_organization_event_registration_answers_student_org~",
                        column: x => x.field_id,
                        principalTable: "student_organization_event_registration_fields",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_student_organization_event_registration_answers_student_or~1",
                        column: x => x.registration_id,
                        principalTable: "student_organization_event_registrations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_event_registration_answers_field_id",
                table: "student_organization_event_registration_answers",
                column: "field_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_event_registration_answers_registratio~",
                table: "student_organization_event_registration_answers",
                columns: new[] { "registration_id", "field_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_event_registrations_event_id_student_p~",
                table: "student_organization_event_registrations",
                columns: new[] { "event_id", "student_profile_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_event_registrations_event_id_submitted~",
                table: "student_organization_event_registrations",
                columns: new[] { "event_id", "submitted_at" });

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_event_registrations_organization_profi~",
                table: "student_organization_event_registrations",
                column: "organization_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_event_registrations_student_profile_id",
                table: "student_organization_event_registrations",
                column: "student_profile_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "student_organization_event_registration_answers");

            migrationBuilder.DropTable(
                name: "student_organization_event_registrations");
        }
    }
}
