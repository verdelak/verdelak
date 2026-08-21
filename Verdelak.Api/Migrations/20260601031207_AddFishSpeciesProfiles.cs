using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFishSpeciesProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FishSpeciesProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CommonName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    ScientificName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    AdultSize = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Temperament = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TemperaturePreference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PhPreference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    GhPreference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    KhPreference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CareLevel = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TankLevel = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IsQuarantineRequired = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FishSpeciesProfiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FishSpeciesFoods",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FishSpeciesProfileId = table.Column<int>(type: "int", nullable: false),
                    FoodName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    FoodType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    FeedingFrequency = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IsStaple = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FishSpeciesFoods", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FishSpeciesFoods_FishSpeciesProfiles_FishSpeciesProfileId",
                        column: x => x.FishSpeciesProfileId,
                        principalTable: "FishSpeciesProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FishSpeciesFoods_FishSpeciesProfileId",
                table: "FishSpeciesFoods",
                column: "FishSpeciesProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_FishSpeciesFoods_FoodName",
                table: "FishSpeciesFoods",
                column: "FoodName");

            migrationBuilder.CreateIndex(
                name: "IX_FishSpeciesFoods_IsStaple",
                table: "FishSpeciesFoods",
                column: "IsStaple");

            migrationBuilder.CreateIndex(
                name: "IX_FishSpeciesProfiles_CommonName",
                table: "FishSpeciesProfiles",
                column: "CommonName");

            migrationBuilder.CreateIndex(
                name: "IX_FishSpeciesProfiles_ScientificName",
                table: "FishSpeciesProfiles",
                column: "ScientificName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FishSpeciesFoods");

            migrationBuilder.DropTable(
                name: "FishSpeciesProfiles");
        }
    }
}
