using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMovieInventoryItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MovieInventoryItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Creator = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    Format = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    WantStatusID = table.Column<string>(type: "char(1)", maxLength: 1, nullable: false),
                    ReleaseYear = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: true),
                    Barcode = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Source = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieInventoryItems", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovieInventoryItems_Barcode",
                table: "MovieInventoryItems",
                column: "Barcode");

            migrationBuilder.CreateIndex(
                name: "IX_MovieInventoryItems_Format",
                table: "MovieInventoryItems",
                column: "Format");

            migrationBuilder.CreateIndex(
                name: "IX_MovieInventoryItems_Title",
                table: "MovieInventoryItems",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_MovieInventoryItems_WantStatusID",
                table: "MovieInventoryItems",
                column: "WantStatusID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MovieInventoryItems");
        }
    }
}
