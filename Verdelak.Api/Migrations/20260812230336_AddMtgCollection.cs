using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMtgCollection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MtgCards",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    ManaCost = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Colors = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ColorIdentity = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    TypeLine = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    OracleText = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Power = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Toughness = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Loyalty = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Legalities = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MtgCards", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MtgPrintings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CardId = table.Column<int>(type: "int", nullable: false),
                    SetCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    SetName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CollectorNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Rarity = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Artist = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    ImageUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ScryfallId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ReleasedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BorderColor = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    Frame = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    Finishes = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MtgPrintings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MtgPrintings_MtgCards_CardId",
                        column: x => x.CardId,
                        principalTable: "MtgCards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MtgCollectionItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrintingId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<short>(type: "smallint", nullable: false),
                    FoilQuantity = table.Column<short>(type: "smallint", nullable: false),
                    WantStatusID = table.Column<string>(type: "char(1)", maxLength: 1, nullable: false),
                    Condition = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Language = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    Location = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    EstimatedValue = table.Column<decimal>(type: "decimal(18,2)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MtgCollectionItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MtgCollectionItems_MtgPrintings_PrintingId",
                        column: x => x.PrintingId,
                        principalTable: "MtgPrintings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MtgCards_ColorIdentity",
                table: "MtgCards",
                column: "ColorIdentity");

            migrationBuilder.CreateIndex(
                name: "IX_MtgCards_Colors",
                table: "MtgCards",
                column: "Colors");

            migrationBuilder.CreateIndex(
                name: "IX_MtgCards_Name",
                table: "MtgCards",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_MtgCards_TypeLine",
                table: "MtgCards",
                column: "TypeLine");

            migrationBuilder.CreateIndex(
                name: "IX_MtgCollectionItems_Condition",
                table: "MtgCollectionItems",
                column: "Condition");

            migrationBuilder.CreateIndex(
                name: "IX_MtgCollectionItems_Language",
                table: "MtgCollectionItems",
                column: "Language");

            migrationBuilder.CreateIndex(
                name: "IX_MtgCollectionItems_Location",
                table: "MtgCollectionItems",
                column: "Location");

            migrationBuilder.CreateIndex(
                name: "IX_MtgCollectionItems_PrintingId",
                table: "MtgCollectionItems",
                column: "PrintingId");

            migrationBuilder.CreateIndex(
                name: "IX_MtgCollectionItems_WantStatusID",
                table: "MtgCollectionItems",
                column: "WantStatusID");

            migrationBuilder.CreateIndex(
                name: "IX_MtgPrintings_CardId",
                table: "MtgPrintings",
                column: "CardId");

            migrationBuilder.CreateIndex(
                name: "IX_MtgPrintings_Rarity",
                table: "MtgPrintings",
                column: "Rarity");

            migrationBuilder.CreateIndex(
                name: "IX_MtgPrintings_ScryfallId",
                table: "MtgPrintings",
                column: "ScryfallId");

            migrationBuilder.CreateIndex(
                name: "IX_MtgPrintings_SetCode",
                table: "MtgPrintings",
                column: "SetCode");

            migrationBuilder.CreateIndex(
                name: "IX_MtgPrintings_SetCode_CollectorNumber",
                table: "MtgPrintings",
                columns: new[] { "SetCode", "CollectorNumber" });

            migrationBuilder.CreateIndex(
                name: "IX_MtgPrintings_SetName",
                table: "MtgPrintings",
                column: "SetName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MtgCollectionItems");

            migrationBuilder.DropTable(
                name: "MtgPrintings");

            migrationBuilder.DropTable(
                name: "MtgCards");
        }
    }
}
