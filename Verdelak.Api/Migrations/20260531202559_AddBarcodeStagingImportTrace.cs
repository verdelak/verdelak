using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBarcodeStagingImportTrace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ImportedAtUtc",
                table: "BarcodeStagingItems",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ImportedEntityId",
                table: "BarcodeStagingItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImportedEntityType",
                table: "BarcodeStagingItems",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_BarcodeStagingItems_ImportedEntityType_ImportedEntityId",
                table: "BarcodeStagingItems",
                columns: new[] { "ImportedEntityType", "ImportedEntityId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BarcodeStagingItems_ImportedEntityType_ImportedEntityId",
                table: "BarcodeStagingItems");

            migrationBuilder.DropColumn(
                name: "ImportedAtUtc",
                table: "BarcodeStagingItems");

            migrationBuilder.DropColumn(
                name: "ImportedEntityId",
                table: "BarcodeStagingItems");

            migrationBuilder.DropColumn(
                name: "ImportedEntityType",
                table: "BarcodeStagingItems");
        }
    }
}
