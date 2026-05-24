using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddGraduationProjectTeamFormationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "looking_for_teammates",
                table: "graduation_projects",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "required_roles",
                table: "graduation_projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "skill_priorities",
                table: "graduation_projects",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "looking_for_teammates",
                table: "graduation_projects");

            migrationBuilder.DropColumn(
                name: "required_roles",
                table: "graduation_projects");

            migrationBuilder.DropColumn(
                name: "skill_priorities",
                table: "graduation_projects");
        }
    }
}
