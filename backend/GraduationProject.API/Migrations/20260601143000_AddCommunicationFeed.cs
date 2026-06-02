using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GraduationProject.API.Migrations
{
    public partial class AddCommunicationFeed : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "company_follows",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    company_profile_id = table.Column<int>(type: "integer", nullable: false),
                    student_profile_id = table.Column<int>(type: "integer", nullable: false),
                    followed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_company_follows", x => x.id);
                    table.ForeignKey(
                        name: "FK_company_follows_company_profiles_company_profile_id",
                        column: x => x.company_profile_id,
                        principalTable: "company_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_company_follows_student_profiles_student_profile_id",
                        column: x => x.student_profile_id,
                        principalTable: "student_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "feed_post_engagements",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    post_key = table.Column<string>(type: "text", nullable: false),
                    engagement_type = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_feed_post_engagements", x => x.id);
                    table.ForeignKey(
                        name: "FK_feed_post_engagements_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "feed_post_comments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    post_key = table.Column<string>(type: "text", nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_feed_post_comments", x => x.id);
                    table.ForeignKey(
                        name: "FK_feed_post_comments_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_company_follows_company_profile_id_student_profile_id",
                table: "company_follows",
                columns: new[] { "company_profile_id", "student_profile_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_company_follows_student_profile_id",
                table: "company_follows",
                column: "student_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_feed_post_engagements_post_key",
                table: "feed_post_engagements",
                column: "post_key");

            migrationBuilder.CreateIndex(
                name: "IX_feed_post_engagements_user_id_post_key_engagement_type",
                table: "feed_post_engagements",
                columns: new[] { "user_id", "post_key", "engagement_type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_feed_post_comments_post_key",
                table: "feed_post_comments",
                column: "post_key");

            migrationBuilder.CreateIndex(
                name: "IX_feed_post_comments_user_id",
                table: "feed_post_comments",
                column: "user_id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "company_follows");
            migrationBuilder.DropTable(name: "feed_post_engagements");
            migrationBuilder.DropTable(name: "feed_post_comments");
        }
    }
}
