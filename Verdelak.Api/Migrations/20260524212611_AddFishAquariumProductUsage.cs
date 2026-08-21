using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFishAquariumProductUsage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FishAquariumProductUsage",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FishAquariumProductId = table.Column<int>(type: "int", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsageType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    QuantityUsed = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    QuantityAfter = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    PercentLeftAfter = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    OpenedNewContainer = table.Column<bool>(type: "bit", nullable: false),
                    UpdateInventory = table.Column<bool>(type: "bit", nullable: false),
                    AddToShoppingList = table.Column<bool>(type: "bit", nullable: false),
                    ShoppingCategory = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FishAquariumProductUsage", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FishAquariumProductUsage_FishAquariumProducts_FishAquariumProductId",
                        column: x => x.FishAquariumProductId,
                        principalTable: "FishAquariumProducts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FishAquariumProductUsage_AddToShoppingList",
                table: "FishAquariumProductUsage",
                column: "AddToShoppingList");

            migrationBuilder.CreateIndex(
                name: "IX_FishAquariumProductUsage_FishAquariumProductId",
                table: "FishAquariumProductUsage",
                column: "FishAquariumProductId");

            migrationBuilder.CreateIndex(
                name: "IX_FishAquariumProductUsage_ShoppingCategory",
                table: "FishAquariumProductUsage",
                column: "ShoppingCategory");

            migrationBuilder.CreateIndex(
                name: "IX_FishAquariumProductUsage_UsageType",
                table: "FishAquariumProductUsage",
                column: "UsageType");

            migrationBuilder.CreateIndex(
                name: "IX_FishAquariumProductUsage_UsedAt",
                table: "FishAquariumProductUsage",
                column: "UsedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FishAquariumProductUsage");
        }
    }
}
