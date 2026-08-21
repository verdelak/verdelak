using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFishLivestockEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FishLivestockEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FishTankId = table.Column<int>(type: "int", nullable: false),
                    DestinationFishTankId = table.Column<int>(type: "int", nullable: true),
                    EventDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CommonName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    ScientificName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    UpdatesStock = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FishLivestockEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FishLivestockEvents_FishTanks_DestinationFishTankId",
                        column: x => x.DestinationFishTankId,
                        principalTable: "FishTanks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FishLivestockEvents_FishTanks_FishTankId",
                        column: x => x.FishTankId,
                        principalTable: "FishTanks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FishLivestockEvents_CommonName",
                table: "FishLivestockEvents",
                column: "CommonName");

            migrationBuilder.CreateIndex(
                name: "IX_FishLivestockEvents_DestinationFishTankId",
                table: "FishLivestockEvents",
                column: "DestinationFishTankId");

            migrationBuilder.CreateIndex(
                name: "IX_FishLivestockEvents_EventDate",
                table: "FishLivestockEvents",
                column: "EventDate");

            migrationBuilder.CreateIndex(
                name: "IX_FishLivestockEvents_EventType",
                table: "FishLivestockEvents",
                column: "EventType");

            migrationBuilder.CreateIndex(
                name: "IX_FishLivestockEvents_FishTankId",
                table: "FishLivestockEvents",
                column: "FishTankId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FishLivestockEvents");
        }
    }
}
