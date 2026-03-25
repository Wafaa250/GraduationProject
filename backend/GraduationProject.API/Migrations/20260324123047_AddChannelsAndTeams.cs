using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddChannelsAndTeams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ── channels ─────────────────────────────────────────────────────
            migrationBuilder.CreateTable(
                name: "channels",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    doctor_id    = table.Column<int>(type: "integer", nullable: false),
                    name         = table.Column<string>(type: "text", nullable: false),
                    course_code  = table.Column<string>(type: "text", nullable: false),
                    section      = table.Column<string>(type: "text", nullable: false),
                    invite_code  = table.Column<string>(type: "text", nullable: false),
                    color        = table.Column<string>(type: "text", nullable: false),
                    created_at   = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_channels", x => x.id);
                    table.ForeignKey(
                        name: "FK_channels_doctor_profiles_doctor_id",
                        column: x => x.doctor_id,
                        principalTable: "doctor_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            // ── channel_students ─────────────────────────────────────────────
            migrationBuilder.CreateTable(
                name: "channel_students",
                columns: table => new
                {
                    id         = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    channel_id = table.Column<int>(type: "integer", nullable: false),
                    student_id = table.Column<int>(type: "integer", nullable: false),
                    joined_at  = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_channel_students", x => x.id);
                    table.ForeignKey(
                        name: "FK_channel_students_channels_channel_id",
                        column: x => x.channel_id,
                        principalTable: "channels",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_channel_students_student_profiles_student_id",
                        column: x => x.student_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            // ── teams ────────────────────────────────────────────────────────
            migrationBuilder.CreateTable(
                name: "teams",
                columns: table => new
                {
                    id            = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    channel_id    = table.Column<int>(type: "integer", nullable: false),
                    name          = table.Column<string>(type: "text", nullable: false),
                    project_title = table.Column<string>(type: "text", nullable: false),
                    created_at    = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teams", x => x.id);
                    table.ForeignKey(
                        name: "FK_teams_channels_channel_id",
                        column: x => x.channel_id,
                        principalTable: "channels",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            // ── team_members ─────────────────────────────────────────────────
            migrationBuilder.CreateTable(
                name: "team_members",
                columns: table => new
                {
                    id         = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    team_id    = table.Column<int>(type: "integer", nullable: false),
                    student_id = table.Column<int>(type: "integer", nullable: false),
                    joined_at  = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_team_members", x => x.id);
                    table.ForeignKey(
                        name: "FK_team_members_student_profiles_student_id",
                        column: x => x.student_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_team_members_teams_team_id",
                        column: x => x.team_id,
                        principalTable: "teams",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            // ── Indexes ───────────────────────────────────────────────────────
            migrationBuilder.CreateIndex(
                name: "IX_channels_doctor_id",
                table: "channels",
                column: "doctor_id");

            migrationBuilder.CreateIndex(
                name: "IX_channels_invite_code",
                table: "channels",
                column: "invite_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_channel_students_channel_id_student_id",
                table: "channel_students",
                columns: new[] { "channel_id", "student_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_channel_students_student_id",
                table: "channel_students",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "IX_teams_channel_id",
                table: "teams",
                column: "channel_id");

            migrationBuilder.CreateIndex(
                name: "IX_team_members_team_id_student_id",
                table: "team_members",
                columns: new[] { "team_id", "student_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_team_members_student_id",
                table: "team_members",
                column: "student_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "team_members");
            migrationBuilder.DropTable(name: "channel_students");
            migrationBuilder.DropTable(name: "teams");
            migrationBuilder.DropTable(name: "channels");
        }
    }
}
