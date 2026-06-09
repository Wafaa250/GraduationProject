using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GraduationProject.API.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentDoctorIntegrationSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS collaboration_preferences text;
                ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS expected_graduation text;
                ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS other_links text;
                ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS personal_website text;
                ALTER TABLE graduation_projects ADD COLUMN IF NOT EXISTS abstract_file_base64 text;
                ALTER TABLE graduation_projects ADD COLUMN IF NOT EXISTS abstract_file_name text;
                ALTER TABLE graduation_projects ADD COLUMN IF NOT EXISTS abstract_file_uploaded_at timestamp with time zone;
                ALTER TABLE graduation_projects ADD COLUMN IF NOT EXISTS project_interests text;
                ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS available_for_supervision boolean NOT NULL DEFAULT false;
                ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS notification_preferences text;
                CREATE TABLE IF NOT EXISTS graduation_project_drafts (
                    user_id integer NOT NULL,
                    payload_json text NOT NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT "PK_graduation_project_drafts" PRIMARY KEY (user_id),
                    CONSTRAINT "FK_graduation_project_drafts_users_user_id" FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS student_account_settings (
                    user_id integer NOT NULL,
                    notification_preferences text,
                    ai_project_interests text,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT "PK_student_account_settings" PRIMARY KEY (user_id),
                    CONSTRAINT "FK_student_account_settings_users_user_id" FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP TABLE IF EXISTS graduation_project_drafts;
                DROP TABLE IF EXISTS student_account_settings;
                ALTER TABLE student_profiles DROP COLUMN IF EXISTS collaboration_preferences;
                ALTER TABLE student_profiles DROP COLUMN IF EXISTS expected_graduation;
                ALTER TABLE student_profiles DROP COLUMN IF EXISTS other_links;
                ALTER TABLE student_profiles DROP COLUMN IF EXISTS personal_website;
                ALTER TABLE graduation_projects DROP COLUMN IF EXISTS abstract_file_base64;
                ALTER TABLE graduation_projects DROP COLUMN IF EXISTS abstract_file_name;
                ALTER TABLE graduation_projects DROP COLUMN IF EXISTS abstract_file_uploaded_at;
                ALTER TABLE graduation_projects DROP COLUMN IF EXISTS project_interests;
                ALTER TABLE doctor_profiles DROP COLUMN IF EXISTS available_for_supervision;
                ALTER TABLE doctor_profiles DROP COLUMN IF EXISTS notification_preferences;
                """);
        }
    }
}
