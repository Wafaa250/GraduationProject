using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSectionNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_course_sections_course_number",
                table: "course_sections");

            migrationBuilder.DropColumn(
                name: "section_number",
                table: "course_sections");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "section_number",
                table: "course_sections",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_course_sections_course_number",
                table: "course_sections",
                columns: new[] { "course_id", "section_number" },
                unique: true);
        }
    }
}
