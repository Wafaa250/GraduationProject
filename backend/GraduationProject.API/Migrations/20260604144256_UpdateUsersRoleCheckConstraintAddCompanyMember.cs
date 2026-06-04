using GraduationProject.API.Helpers;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUsersRoleCheckConstraintAddCompanyMember : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql($"""
                ALTER TABLE users DROP CONSTRAINT IF EXISTS {UserRoles.UsersRoleCheckConstraintName};
                """);

            migrationBuilder.AddCheckConstraint(
                name: UserRoles.UsersRoleCheckConstraintName,
                table: "users",
                sql: UserRoles.UsersRoleCheckSql);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: UserRoles.UsersRoleCheckConstraintName,
                table: "users");

            migrationBuilder.AddCheckConstraint(
                name: UserRoles.UsersRoleCheckConstraintName,
                table: "users",
                sql: "role IN ('student', 'doctor', 'company', 'studentassociation', 'association', 'admin')");
        }
    }
}
