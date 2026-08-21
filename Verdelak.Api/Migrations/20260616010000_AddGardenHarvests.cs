using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGardenHarvests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GardenHarvests",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GardenPlotID = table.Column<int>(type: "int", nullable: false),
                    SeedID = table.Column<int>(type: "int", nullable: false),
                    HarvestDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Year = table.Column<short>(type: "smallint", nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GardenHarvests", x => x.ID);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GardenHarvests_GardenPlotID",
                table: "GardenHarvests",
                column: "GardenPlotID");

            migrationBuilder.CreateIndex(
                name: "IX_GardenHarvests_HarvestDate",
                table: "GardenHarvests",
                column: "HarvestDate");

            migrationBuilder.CreateIndex(
                name: "IX_GardenHarvests_SeedID",
                table: "GardenHarvests",
                column: "SeedID");

            migrationBuilder.CreateIndex(
                name: "IX_GardenHarvests_Year",
                table: "GardenHarvests",
                column: "Year");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GardenHarvests");
        }
    }
}
