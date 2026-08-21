using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFishAquariumProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FishAquariumProducts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FishTankId = table.Column<int>(type: "int", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PercentLeft = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    ExpirationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FishAquariumProducts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FishAquariumProducts_FishTanks_FishTankId",
                        column: x => x.FishTankId,
                        principalTable: "FishTanks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FishAquariumProducts_Category",
                table: "FishAquariumProducts",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_FishAquariumProducts_ExpirationDate",
                table: "FishAquariumProducts",
                column: "ExpirationDate");

            migrationBuilder.CreateIndex(
                name: "IX_FishAquariumProducts_FishTankId",
                table: "FishAquariumProducts",
                column: "FishTankId");

            migrationBuilder.CreateIndex(
                name: "IX_FishAquariumProducts_IsActive",
                table: "FishAquariumProducts",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_FishAquariumProducts_Name",
                table: "FishAquariumProducts",
                column: "Name");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FishAquariumProducts");
        }
    }
}
