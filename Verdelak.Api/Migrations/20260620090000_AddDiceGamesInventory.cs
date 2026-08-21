using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    [Migration("20260620090000_AddDiceGamesInventory")]
    public partial class AddDiceGamesInventory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DiceGameItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GameName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false, defaultValue: "D&D Dice Masters"),
                    SetName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    CardId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CardNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CardName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Subtitle = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    Cost = table.Column<int>(type: "int", nullable: true),
                    EnergyType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Alignment = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Equippable = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Rarity = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DieLimit = table.Column<short>(type: "smallint", nullable: true),
                    OwnedCardQty = table.Column<short>(type: "smallint", nullable: false),
                    OwnedDieQty = table.Column<short>(type: "smallint", nullable: false),
                    OwnedFoilQty = table.Column<short>(type: "smallint", nullable: false),
                    WantQty = table.Column<short>(type: "smallint", nullable: false),
                    StatusID = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false, defaultValue: "H"),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    SourceSheet = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SourceRowLabel = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiceGameItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DragonDiceItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DieName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RaceOrSpecies = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Role = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    DieType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Health = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Points = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    OwnedQty = table.Column<short>(type: "smallint", nullable: false),
                    WantQty = table.Column<short>(type: "smallint", nullable: false),
                    StatusID = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false, defaultValue: "H"),
                    NoteCode = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: true),
                    IsAlternative = table.Column<bool>(type: "bit", nullable: false),
                    IsReprint = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    SourceSheet = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SourceRowLabel = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DragonDiceItems", x => x.Id);
                });

            migrationBuilder.CreateIndex(name: "IX_DiceGameItems_CardName", table: "DiceGameItems", column: "CardName");
            migrationBuilder.CreateIndex(name: "IX_DiceGameItems_GameName", table: "DiceGameItems", column: "GameName");
            migrationBuilder.CreateIndex(name: "IX_DiceGameItems_Rarity", table: "DiceGameItems", column: "Rarity");
            migrationBuilder.CreateIndex(name: "IX_DiceGameItems_SetName", table: "DiceGameItems", column: "SetName");
            migrationBuilder.CreateIndex(name: "IX_DiceGameItems_SourceSheet", table: "DiceGameItems", column: "SourceSheet");
            migrationBuilder.CreateIndex(name: "IX_DiceGameItems_StatusID", table: "DiceGameItems", column: "StatusID");

            migrationBuilder.CreateIndex(name: "IX_DragonDiceItems_DieName", table: "DragonDiceItems", column: "DieName");
            migrationBuilder.CreateIndex(name: "IX_DragonDiceItems_RaceOrSpecies", table: "DragonDiceItems", column: "RaceOrSpecies");
            migrationBuilder.CreateIndex(name: "IX_DragonDiceItems_Role", table: "DragonDiceItems", column: "Role");
            migrationBuilder.CreateIndex(name: "IX_DragonDiceItems_SourceSheet", table: "DragonDiceItems", column: "SourceSheet");
            migrationBuilder.CreateIndex(name: "IX_DragonDiceItems_StatusID", table: "DragonDiceItems", column: "StatusID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "DiceGameItems");
            migrationBuilder.DropTable(name: "DragonDiceItems");
        }
    }
}

