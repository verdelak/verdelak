using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGardenPlotPlantGardenPlotId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GardenPlotID",
                table: "GardenPlotPlants",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(
                """
                UPDATE [dbo].[GardenPlotPlants]
                SET [GardenPlotID] = COALESCE((SELECT TOP 1 [ID] FROM [dbo].[GardenPlot] ORDER BY [ID]), 0)
                WHERE [GardenPlotID] = 0;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_GardenPlotPlants_GardenPlotID",
                table: "GardenPlotPlants",
                column: "GardenPlotID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_GardenPlotPlants_GardenPlotID",
                table: "GardenPlotPlants");

            migrationBuilder.DropColumn(
                name: "GardenPlotID",
                table: "GardenPlotPlants");
        }
    }
}
