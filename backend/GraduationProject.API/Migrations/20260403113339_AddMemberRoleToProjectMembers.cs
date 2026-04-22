using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddMemberRoleToProjectMembers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameIndex(
                name: "IX_graduation_project_members_project_id_student_id",
                table: "graduation_project_members",
                newName: "ix_graduation_project_members_project_student");

            migrationBuilder.AddColumn<string>(
                name: "role",
                table: "graduation_project_members",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "member");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "role",
                table: "graduation_project_members");

            migrationBuilder.RenameIndex(
                name: "ix_graduation_project_members_project_student",
                table: "graduation_project_members",
                newName: "IX_graduation_project_members_project_id_student_id");
        }
    }
}
