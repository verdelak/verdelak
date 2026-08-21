using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBarcodeStagingItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BarcodeStagingItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Upc = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    NormalizedCode = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    CodeType = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: false),
                    Source = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: false),
                    BatchName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ItemType = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: false),
                    SuggestedTitle = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    SuggestedCreator = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    SuggestedFormat = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SuggestedYear = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: true),
                    LookupProvider = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Confidence = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RawLookupJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BarcodeStagingItems", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BarcodeStagingItems_BatchName",
                table: "BarcodeStagingItems",
                column: "BatchName");

            migrationBuilder.CreateIndex(
                name: "IX_BarcodeStagingItems_CodeType",
                table: "BarcodeStagingItems",
                column: "CodeType");

            migrationBuilder.CreateIndex(
                name: "IX_BarcodeStagingItems_ItemType",
                table: "BarcodeStagingItems",
                column: "ItemType");

            migrationBuilder.CreateIndex(
                name: "IX_BarcodeStagingItems_Status",
                table: "BarcodeStagingItems",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_BarcodeStagingItems_NormalizedCode",
                table: "BarcodeStagingItems",
                column: "NormalizedCode");

            migrationBuilder.CreateIndex(
                name: "IX_BarcodeStagingItems_Source",
                table: "BarcodeStagingItems",
                column: "Source");

            migrationBuilder.CreateIndex(
                name: "IX_BarcodeStagingItems_Upc",
                table: "BarcodeStagingItems",
                column: "Upc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BarcodeStagingItems");
        }
    }
}
