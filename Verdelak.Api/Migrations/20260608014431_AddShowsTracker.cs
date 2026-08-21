using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddShowsTracker : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "RarityID",
                table: "Minis",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1)",
                oldMaxLength: 1,
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "ShowSeries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SortTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    WantToWatch = table.Column<bool>(type: "bit", nullable: false),
                    WantToRewatch = table.Column<bool>(type: "bit", nullable: false),
                    LegacyShowsToWatchId = table.Column<int>(type: "int", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShowSeries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ShowSeasons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ShowSeriesId = table.Column<int>(type: "int", nullable: false),
                    SeasonNumber = table.Column<int>(type: "int", nullable: true),
                    SeasonLabel = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    StatusID = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false, defaultValue: "H"),
                    Format = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IsWatched = table.Column<bool>(type: "bit", nullable: false),
                    WantToWatch = table.Column<bool>(type: "bit", nullable: false),
                    WantToRewatch = table.Column<bool>(type: "bit", nullable: false),
                    LastWatchedDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShowSeasons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShowSeasons_ShowSeries_ShowSeriesId",
                        column: x => x.ShowSeriesId,
                        principalTable: "ShowSeries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql("""
                INSERT INTO ShowSeries (Title, SortTitle, Notes, WantToWatch, WantToRewatch, LegacyShowsToWatchId, CreatedAtUtc, UpdatedAtUtc)
                SELECT
                    LEFT(LTRIM(RTRIM(Title)), 200),
                    LEFT(LTRIM(RTRIM(Title)), 200),
                    CASE WHEN Seasons IS NULL THEN NULL ELSE CONCAT('Legacy seasons value: ', Seasons) END,
                    CAST(1 AS bit),
                    CAST(0 AS bit),
                    ID,
                    SYSUTCDATETIME(),
                    SYSUTCDATETIME()
                FROM ShowsToWatch oldShows
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM ShowSeries newShows
                    WHERE newShows.LegacyShowsToWatchId = oldShows.ID
                );
                """);

            migrationBuilder.CreateIndex(
                name: "IX_ShowSeasons_Format",
                table: "ShowSeasons",
                column: "Format");

            migrationBuilder.CreateIndex(
                name: "IX_ShowSeasons_SeasonNumber",
                table: "ShowSeasons",
                column: "SeasonNumber");

            migrationBuilder.CreateIndex(
                name: "IX_ShowSeasons_ShowSeriesId",
                table: "ShowSeasons",
                column: "ShowSeriesId");

            migrationBuilder.CreateIndex(
                name: "IX_ShowSeasons_StatusID",
                table: "ShowSeasons",
                column: "StatusID");

            migrationBuilder.CreateIndex(
                name: "IX_ShowSeries_LegacyShowsToWatchId",
                table: "ShowSeries",
                column: "LegacyShowsToWatchId",
                unique: true,
                filter: "[LegacyShowsToWatchId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ShowSeries_SortTitle",
                table: "ShowSeries",
                column: "SortTitle");

            migrationBuilder.CreateIndex(
                name: "IX_ShowSeries_Title",
                table: "ShowSeries",
                column: "Title");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShowSeasons");

            migrationBuilder.DropTable(
                name: "ShowSeries");

            migrationBuilder.AlterColumn<string>(
                name: "RarityID",
                table: "Minis",
                type: "nvarchar(1)",
                maxLength: 1,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);
        }
    }
}
