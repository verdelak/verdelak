using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFishStock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FishStock",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FishTankId = table.Column<int>(type: "int", nullable: false),
                    CommonName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    ScientificName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FishStock", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FishStock_FishTanks_FishTankId",
                        column: x => x.FishTankId,
                        principalTable: "FishTanks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FishStock_CommonName",
                table: "FishStock",
                column: "CommonName");

            migrationBuilder.CreateIndex(
                name: "IX_FishStock_FishTankId",
                table: "FishStock",
                column: "FishTankId");

            migrationBuilder.CreateIndex(
                name: "IX_FishStock_IsActive",
                table: "FishStock",
                column: "IsActive");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FishStock");
        }
    }
}
