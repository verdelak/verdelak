using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFishSpeciesProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdultSize",
                table: "FishStock",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhPreference",
                table: "FishStock",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Temperament",
                table: "FishStock",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TemperaturePreference",
                table: "FishStock",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdultSize",
                table: "FishStock");

            migrationBuilder.DropColumn(
                name: "PhPreference",
                table: "FishStock");

            migrationBuilder.DropColumn(
                name: "Temperament",
                table: "FishStock");

            migrationBuilder.DropColumn(
                name: "TemperaturePreference",
                table: "FishStock");
        }
    }
}
