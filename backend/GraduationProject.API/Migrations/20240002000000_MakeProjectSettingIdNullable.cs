// Migrations/20240002000000_MakeProjectSettingIdNullable.cs
//
// ─────────────────────────────────────────────────────────────────────────────
// PHASE 4 MIGRATION
//
// What this migration does:
//
//   course_teams
//     • Alters column  project_setting_id  INT NOT NULL  →  INT NULL
//     • Drops FK  fk_course_teams_course_project_settings_project_setting_id
//       (was OnDelete RESTRICT, now re-added as OnDelete SET NULL)
//     • Re-adds FK with ON DELETE SET NULL
//
//   course_team_members
//     • Alters column  project_setting_id  INT NOT NULL  →  INT NULL
//     • Drops unique index  ix_course_team_members_project_student
//       (was on (project_setting_id, student_id) — old system enforcement)
//     • Adds new partial unique index  ix_course_team_members_project_student_new
//       on (course_project_id, student_id) WHERE course_project_id IS NOT NULL
//       (new system enforcement — only non-null rows are constrained)
//
// What this migration does NOT do:
//   • Does NOT drop any columns
//   • Does NOT touch course_project_settings or section_project_settings tables
//   • Does NOT delete any data
//
// DOWN fully reverses every step in the correct order.
// ─────────────────────────────────────────────────────────────────────────────

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class MakeProjectSettingIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ══════════════════════════════════════════════════════════════════
            // course_teams
            // ══════════════════════════════════════════════════════════════════

            // Step 1: Drop the existing RESTRICT FK on course_teams.project_setting_id.
            // Must be dropped before altering the column's nullability,
            // because PostgreSQL requires the column type change to be free of
            // constraints that reference the old NOT NULL definition.
            migrationBuilder.DropForeignKey(
                name:  "fk_course_teams_course_project_settings_project_setting_id",
                table: "course_teams");

            // Step 2: Make the column nullable (NOT NULL → NULL).
            // Existing rows already have a valid integer here, so this is safe.
            migrationBuilder.AlterColumn<int>(
                name:      "project_setting_id",
                table:     "course_teams",
                type:      "integer",
                nullable:  true,
                oldClrType: typeof(int),
                oldType:   "integer",
                oldNullable: false);

            // Step 3: Re-add the FK with ON DELETE SET NULL.
            // This replaces the old RESTRICT behaviour. When a CourseProjectSetting
            // row is deleted, teams that referenced it will have their
            // project_setting_id set to NULL — not blocked, not cascade-deleted.
            migrationBuilder.AddForeignKey(
                name:            "fk_course_teams_course_project_settings_project_setting_id",
                table:           "course_teams",
                column:          "project_setting_id",
                principalTable:  "course_project_settings",
                principalColumn: "id",
                onDelete:        ReferentialAction.SetNull);

            // ══════════════════════════════════════════════════════════════════
            // course_team_members
            // ══════════════════════════════════════════════════════════════════

            // Step 4: Drop the old unique index on (project_setting_id, student_id).
            // This was the "one team per project setting per student" guard from
            // the old system. It must be dropped before altering the column
            // because the index references project_setting_id.
            migrationBuilder.DropIndex(
                name:  "ix_course_team_members_project_student",
                table: "course_team_members");

            // Step 5: Make project_setting_id nullable on course_team_members.
            migrationBuilder.AlterColumn<int>(
                name:       "project_setting_id",
                table:      "course_team_members",
                type:       "integer",
                nullable:   true,
                oldClrType: typeof(int),
                oldType:    "integer",
                oldNullable: false);

            // Step 6: Add the new partial unique index on (course_project_id, student_id)
            // filtered to rows where course_project_id IS NOT NULL.
            //
            // This enforces the new invariant: a student can be in at most one
            // team per CourseProject. Rows with course_project_id = NULL (legacy
            // data) are excluded from this constraint intentionally.
            migrationBuilder.Sql(@"
                CREATE UNIQUE INDEX ix_course_team_members_project_student_new
                ON course_team_members (course_project_id, student_id)
                WHERE course_project_id IS NOT NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // ── Reverse course_team_members ────────────────────────────────────

            // Step 6 reverse: drop the new partial index.
            migrationBuilder.DropIndex(
                name:  "ix_course_team_members_project_student_new",
                table: "course_team_members");

            // Step 5 reverse: make project_setting_id NOT NULL again.
            // WARNING: this will fail if any row currently has NULL in this column.
            // Ensure all rows are back-filled before running Down.
            migrationBuilder.AlterColumn<int>(
                name:       "project_setting_id",
                table:      "course_team_members",
                type:       "integer",
                nullable:   false,
                oldClrType: typeof(int),
                oldType:    "integer",
                oldNullable: true);

            // Step 4 reverse: restore the old unique index on (project_setting_id, student_id).
            migrationBuilder.CreateIndex(
                name:    "ix_course_team_members_project_student",
                table:   "course_team_members",
                columns: new[] { "project_setting_id", "student_id" },
                unique:  true);

            // ── Reverse course_teams ───────────────────────────────────────────

            // Step 3 reverse: drop the SET NULL FK.
            migrationBuilder.DropForeignKey(
                name:  "fk_course_teams_course_project_settings_project_setting_id",
                table: "course_teams");

            // Step 2 reverse: make project_setting_id NOT NULL again.
            // WARNING: this will fail if any row currently has NULL.
            migrationBuilder.AlterColumn<int>(
                name:       "project_setting_id",
                table:      "course_teams",
                type:       "integer",
                nullable:   false,
                oldClrType: typeof(int),
                oldType:    "integer",
                oldNullable: true);

            // Step 1 reverse: restore the RESTRICT FK.
            migrationBuilder.AddForeignKey(
                name:            "fk_course_teams_course_project_settings_project_setting_id",
                table:           "course_teams",
                column:          "project_setting_id",
                principalTable:  "course_project_settings",
                principalColumn: "id",
                onDelete:        ReferentialAction.Restrict);
        }
    }
}
