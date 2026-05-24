using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddGraduationProjectInterestsTechnologiesAbstractFile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "abstract_file_name",
                table: "graduation_projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "abstract_file_path",
                table: "graduation_projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "abstract_file_uploaded_at",
                table: "graduation_projects",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "interests",
                table: "graduation_projects",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "technologies",
                table: "graduation_projects",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "abstract_file_name",
                table: "graduation_projects");

            migrationBuilder.DropColumn(
                name: "abstract_file_path",
                table: "graduation_projects");

            migrationBuilder.DropColumn(
                name: "abstract_file_uploaded_at",
                table: "graduation_projects");

            migrationBuilder.DropColumn(
                name: "interests",
                table: "graduation_projects");

            migrationBuilder.DropColumn(
                name: "technologies",
                table: "graduation_projects");
        }
    }
}
