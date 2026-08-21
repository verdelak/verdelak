using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddShowBoxSets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ShowBoxSets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ShowSeriesId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    StatusID = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false, defaultValue: "H"),
                    Format = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IsCompleteSeries = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShowBoxSets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShowBoxSets_ShowSeries_ShowSeriesId",
                        column: x => x.ShowSeriesId,
                        principalTable: "ShowSeries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ShowBoxSetSeasons",
                columns: table => new
                {
                    ShowBoxSetId = table.Column<int>(type: "int", nullable: false),
                    ShowSeasonId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShowBoxSetSeasons", x => new { x.ShowBoxSetId, x.ShowSeasonId });
                    table.ForeignKey(
                        name: "FK_ShowBoxSetSeasons_ShowBoxSets_ShowBoxSetId",
                        column: x => x.ShowBoxSetId,
                        principalTable: "ShowBoxSets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShowBoxSetSeasons_ShowSeasons_ShowSeasonId",
                        column: x => x.ShowSeasonId,
                        principalTable: "ShowSeasons",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShowBoxSets_Format",
                table: "ShowBoxSets",
                column: "Format");

            migrationBuilder.CreateIndex(
                name: "IX_ShowBoxSets_ShowSeriesId",
                table: "ShowBoxSets",
                column: "ShowSeriesId");

            migrationBuilder.CreateIndex(
                name: "IX_ShowBoxSets_StatusID",
                table: "ShowBoxSets",
                column: "StatusID");

            migrationBuilder.CreateIndex(
                name: "IX_ShowBoxSetSeasons_ShowSeasonId",
                table: "ShowBoxSetSeasons",
                column: "ShowSeasonId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShowBoxSetSeasons");

            migrationBuilder.DropTable(
                name: "ShowBoxSets");
        }
    }
}
