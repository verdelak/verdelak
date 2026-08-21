using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalImportStaging : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExternalImportBatches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Source = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TargetArea = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    BatchName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "Open"),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExternalImportBatches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ExternalImportStagingItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BatchId = table.Column<int>(type: "int", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TargetArea = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ExternalId = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Title = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    PlatformName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    LocationName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Publisher = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    Developer = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    VersionEdition = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    MediaType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ArtworkUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "Staged"),
                    MatchStatus = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "NotChecked"),
                    SelectedAction = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "Import"),
                    MatchedEntityType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    MatchedEntityId = table.Column<int>(type: "int", nullable: true),
                    MatchedTitle = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    RawJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ImportedEntityType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ImportedEntityId = table.Column<int>(type: "int", nullable: true),
                    ImportedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExternalImportStagingItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExternalImportStagingItems_ExternalImportBatches_BatchId",
                        column: x => x.BatchId,
                        principalTable: "ExternalImportBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(name: "IX_ExternalImportBatches_CreatedAtUtc", table: "ExternalImportBatches", column: "CreatedAtUtc");
            migrationBuilder.CreateIndex(name: "IX_ExternalImportBatches_Source", table: "ExternalImportBatches", column: "Source");
            migrationBuilder.CreateIndex(name: "IX_ExternalImportBatches_Status", table: "ExternalImportBatches", column: "Status");
            migrationBuilder.CreateIndex(name: "IX_ExternalImportBatches_TargetArea", table: "ExternalImportBatches", column: "TargetArea");
            migrationBuilder.CreateIndex(name: "IX_ExternalImportStagingItems_BatchId", table: "ExternalImportStagingItems", column: "BatchId");
            migrationBuilder.CreateIndex(name: "IX_ExternalImportStagingItems_ExternalId", table: "ExternalImportStagingItems", column: "ExternalId");
            migrationBuilder.CreateIndex(name: "IX_ExternalImportStagingItems_MatchStatus", table: "ExternalImportStagingItems", column: "MatchStatus");
            migrationBuilder.CreateIndex(name: "IX_ExternalImportStagingItems_SelectedAction", table: "ExternalImportStagingItems", column: "SelectedAction");
            migrationBuilder.CreateIndex(name: "IX_ExternalImportStagingItems_Source", table: "ExternalImportStagingItems", column: "Source");
            migrationBuilder.CreateIndex(name: "IX_ExternalImportStagingItems_Status", table: "ExternalImportStagingItems", column: "Status");
            migrationBuilder.CreateIndex(name: "IX_ExternalImportStagingItems_TargetArea", table: "ExternalImportStagingItems", column: "TargetArea");
            migrationBuilder.CreateIndex(name: "IX_ExternalImportStagingItems_Title", table: "ExternalImportStagingItems", column: "Title");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "ExternalImportStagingItems");
            migrationBuilder.DropTable(name: "ExternalImportBatches");
        }
    }
}
