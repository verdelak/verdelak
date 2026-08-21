using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFishTankLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FishTankLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FishTankId = table.Column<int>(type: "int", nullable: false),
                    LoggedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LogType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Temperature = table.Column<decimal>(type: "decimal(5,2)", nullable: true),
                    Ammonia = table.Column<decimal>(type: "decimal(6,2)", nullable: true),
                    Nitrite = table.Column<decimal>(type: "decimal(6,2)", nullable: true),
                    Nitrate = table.Column<decimal>(type: "decimal(6,2)", nullable: true),
                    Ph = table.Column<decimal>(type: "decimal(4,2)", nullable: true),
                    Gh = table.Column<decimal>(type: "decimal(6,2)", nullable: true),
                    Kh = table.Column<decimal>(type: "decimal(6,2)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FishTankLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FishTankLogs_FishTanks_FishTankId",
                        column: x => x.FishTankId,
                        principalTable: "FishTanks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FishTankLogs_FishTankId",
                table: "FishTankLogs",
                column: "FishTankId");

            migrationBuilder.CreateIndex(
                name: "IX_FishTankLogs_LoggedAt",
                table: "FishTankLogs",
                column: "LoggedAt");

            migrationBuilder.CreateIndex(
                name: "IX_FishTankLogs_LogType",
                table: "FishTankLogs",
                column: "LogType");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FishTankLogs");
        }
    }
}
