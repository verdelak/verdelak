using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRecipeOrganization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsCanning",
                table: "RecipeEntries",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUsedAt",
                table: "RecipeEntries",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecipeBookId",
                table: "RecipeEntries",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceDetail",
                table: "RecipeEntries",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourcePage",
                table: "RecipeEntries",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecipeEntries_IsCanning",
                table: "RecipeEntries",
                column: "IsCanning");

            migrationBuilder.CreateIndex(
                name: "IX_RecipeEntries_LastUsedAt",
                table: "RecipeEntries",
                column: "LastUsedAt");

            migrationBuilder.CreateIndex(
                name: "IX_RecipeEntries_RecipeBookId",
                table: "RecipeEntries",
                column: "RecipeBookId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RecipeEntries_IsCanning",
                table: "RecipeEntries");

            migrationBuilder.DropIndex(
                name: "IX_RecipeEntries_LastUsedAt",
                table: "RecipeEntries");

            migrationBuilder.DropIndex(
                name: "IX_RecipeEntries_RecipeBookId",
                table: "RecipeEntries");

            migrationBuilder.DropColumn(
                name: "IsCanning",
                table: "RecipeEntries");

            migrationBuilder.DropColumn(
                name: "LastUsedAt",
                table: "RecipeEntries");

            migrationBuilder.DropColumn(
                name: "RecipeBookId",
                table: "RecipeEntries");

            migrationBuilder.DropColumn(
                name: "SourceDetail",
                table: "RecipeEntries");

            migrationBuilder.DropColumn(
                name: "SourcePage",
                table: "RecipeEntries");
        }
    }
}
