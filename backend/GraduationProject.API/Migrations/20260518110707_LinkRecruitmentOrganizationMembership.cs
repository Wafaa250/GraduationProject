using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class LinkRecruitmentOrganizationMembership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "source_application_id",
                table: "student_organization_team_members",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "student_profile_id",
                table: "student_organization_team_members",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "membership_kind",
                table: "student_organization_members",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "team_member_id",
                table: "student_organization_members",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_team_members_organization_profile_id_s~",
                table: "student_organization_team_members",
                columns: new[] { "organization_profile_id", "student_profile_id" },
                unique: true,
                filter: "student_profile_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_team_members_source_application_id",
                table: "student_organization_team_members",
                column: "source_application_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_team_members_student_profile_id",
                table: "student_organization_team_members",
                column: "student_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_members_organization_profile_id_member~",
                table: "student_organization_members",
                columns: new[] { "organization_profile_id", "membership_kind" });

            migrationBuilder.CreateIndex(
                name: "IX_student_organization_members_team_member_id",
                table: "student_organization_members",
                column: "team_member_id");

            migrationBuilder.AddForeignKey(
                name: "FK_student_organization_members_student_organization_team_memb~",
                table: "student_organization_members",
                column: "team_member_id",
                principalTable: "student_organization_team_members",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_student_organization_team_members_student_organization_recr~",
                table: "student_organization_team_members",
                column: "source_application_id",
                principalTable: "student_organization_recruitment_applications",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_student_organization_team_members_student_profiles_student_~",
                table: "student_organization_team_members",
                column: "student_profile_id",
                principalTable: "student_profiles",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_student_organization_members_student_organization_team_memb~",
                table: "student_organization_members");

            migrationBuilder.DropForeignKey(
                name: "FK_student_organization_team_members_student_organization_recr~",
                table: "student_organization_team_members");

            migrationBuilder.DropForeignKey(
                name: "FK_student_organization_team_members_student_profiles_student_~",
                table: "student_organization_team_members");

            migrationBuilder.DropIndex(
                name: "IX_student_organization_team_members_organization_profile_id_s~",
                table: "student_organization_team_members");

            migrationBuilder.DropIndex(
                name: "IX_student_organization_team_members_source_application_id",
                table: "student_organization_team_members");

            migrationBuilder.DropIndex(
                name: "IX_student_organization_team_members_student_profile_id",
                table: "student_organization_team_members");

            migrationBuilder.DropIndex(
                name: "IX_student_organization_members_organization_profile_id_member~",
                table: "student_organization_members");

            migrationBuilder.DropIndex(
                name: "IX_student_organization_members_team_member_id",
                table: "student_organization_members");

            migrationBuilder.DropColumn(
                name: "source_application_id",
                table: "student_organization_team_members");

            migrationBuilder.DropColumn(
                name: "student_profile_id",
                table: "student_organization_team_members");

            migrationBuilder.DropColumn(
                name: "membership_kind",
                table: "student_organization_members");

            migrationBuilder.DropColumn(
                name: "team_member_id",
                table: "student_organization_members");
        }
    }
}
