using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordChangeAndCompanyUniqueness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "must_change_password",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "normalized_company_name",
                table: "company_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "primary_email_domain",
                table: "company_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "website_domain",
                table: "company_profiles",
                type: "text",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE company_profiles cp
                SET normalized_company_name = lower(trim(regexp_replace(cp.company_name, '\s+', ' ', 'g')))
                WHERE normalized_company_name IS NULL;
                """);

            migrationBuilder.Sql("""
                UPDATE company_profiles cp
                SET primary_email_domain = lower(split_part(u.email, '@', 2))
                FROM users u
                WHERE cp.user_id = u.id
                  AND cp.primary_email_domain IS NULL
                  AND lower(split_part(u.email, '@', 2)) NOT IN (
                      'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com',
                      'msn.com', 'yahoo.com', 'ymail.com', 'icloud.com', 'me.com', 'mac.com',
                      'proton.me', 'protonmail.com', 'aol.com', 'mail.com', 'zoho.com',
                      'gmx.com', 'yandex.com', 'mail.ru'
                  );
                """);

            migrationBuilder.Sql("""
                UPDATE company_profiles cp
                SET website_domain = lower(
                    CASE
                        WHEN cp.website_url IS NULL OR trim(cp.website_url) = '' THEN NULL
                        WHEN cp.website_url ~* '^https?://' THEN
                            regexp_replace(
                                split_part(regexp_replace(lower(cp.website_url), '^https?://', ''), '/', 1),
                                '^www\.',
                                ''
                            )
                        ELSE
                            regexp_replace(
                                split_part(regexp_replace(lower('https://' || cp.website_url), '^https?://', ''), '/', 1),
                                '^www\.',
                                ''
                            )
                    END
                )
                WHERE cp.website_domain IS NULL;
                """);

            migrationBuilder.Sql("""
                UPDATE company_profiles
                SET normalized_company_name = 'company-' || id::text
                WHERE normalized_company_name IS NULL OR trim(normalized_company_name) = '';
                """);

            migrationBuilder.Sql("""
                WITH ranked AS (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY normalized_company_name ORDER BY id
                           ) AS rn
                    FROM company_profiles
                )
                UPDATE company_profiles cp
                SET normalized_company_name = cp.normalized_company_name || '-' || cp.id::text
                FROM ranked r
                WHERE cp.id = r.id
                  AND r.rn > 1;
                """);

            migrationBuilder.Sql("""
                WITH ranked AS (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY primary_email_domain ORDER BY id
                           ) AS rn
                    FROM company_profiles
                    WHERE primary_email_domain IS NOT NULL
                )
                UPDATE company_profiles cp
                SET primary_email_domain = NULL
                FROM ranked r
                WHERE cp.id = r.id
                  AND r.rn > 1;
                """);

            migrationBuilder.Sql("""
                WITH ranked AS (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY website_domain ORDER BY id
                           ) AS rn
                    FROM company_profiles
                    WHERE website_domain IS NOT NULL
                )
                UPDATE company_profiles cp
                SET website_domain = NULL
                FROM ranked r
                WHERE cp.id = r.id
                  AND r.rn > 1;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "normalized_company_name",
                table: "company_profiles",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_company_profiles_normalized_company_name",
                table: "company_profiles",
                column: "normalized_company_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_company_profiles_primary_email_domain",
                table: "company_profiles",
                column: "primary_email_domain",
                unique: true,
                filter: "\"primary_email_domain\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_company_profiles_website_domain",
                table: "company_profiles",
                column: "website_domain",
                unique: true,
                filter: "\"website_domain\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_company_profiles_normalized_company_name",
                table: "company_profiles");

            migrationBuilder.DropIndex(
                name: "IX_company_profiles_primary_email_domain",
                table: "company_profiles");

            migrationBuilder.DropIndex(
                name: "IX_company_profiles_website_domain",
                table: "company_profiles");

            migrationBuilder.DropColumn(
                name: "must_change_password",
                table: "users");

            migrationBuilder.DropColumn(
                name: "normalized_company_name",
                table: "company_profiles");

            migrationBuilder.DropColumn(
                name: "primary_email_domain",
                table: "company_profiles");

            migrationBuilder.DropColumn(
                name: "website_domain",
                table: "company_profiles");
        }
    }
}
