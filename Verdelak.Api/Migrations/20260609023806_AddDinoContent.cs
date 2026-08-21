using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDinoContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DinoTaxonomyNodes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Rank = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    ParentId = table.Column<int>(type: "int", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DinoTaxonomyNodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DinoTaxonomyNodes_DinoTaxonomyNodes_ParentId",
                        column: x => x.ParentId,
                        principalTable: "DinoTaxonomyNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DinosaurEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CommonName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ScientificName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(220)", maxLength: 220, nullable: false),
                    KingdomId = table.Column<int>(type: "int", nullable: true),
                    PhylumId = table.Column<int>(type: "int", nullable: true),
                    ClassId = table.Column<int>(type: "int", nullable: true),
                    Clades = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    FamilyId = table.Column<int>(type: "int", nullable: true),
                    SubfamilyId = table.Column<int>(type: "int", nullable: true),
                    GenusId = table.Column<int>(type: "int", nullable: true),
                    SpeciesId = table.Column<int>(type: "int", nullable: true),
                    DiscoveryDate = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DiscoveredBy = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: true),
                    IsPublished = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DinosaurEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DinosaurEntries_DinoTaxonomyNodes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "DinoTaxonomyNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DinosaurEntries_DinoTaxonomyNodes_FamilyId",
                        column: x => x.FamilyId,
                        principalTable: "DinoTaxonomyNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DinosaurEntries_DinoTaxonomyNodes_GenusId",
                        column: x => x.GenusId,
                        principalTable: "DinoTaxonomyNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DinosaurEntries_DinoTaxonomyNodes_KingdomId",
                        column: x => x.KingdomId,
                        principalTable: "DinoTaxonomyNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DinosaurEntries_DinoTaxonomyNodes_PhylumId",
                        column: x => x.PhylumId,
                        principalTable: "DinoTaxonomyNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DinosaurEntries_DinoTaxonomyNodes_SpeciesId",
                        column: x => x.SpeciesId,
                        principalTable: "DinoTaxonomyNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DinosaurEntries_DinoTaxonomyNodes_SubfamilyId",
                        column: x => x.SubfamilyId,
                        principalTable: "DinoTaxonomyNodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DinoContentSections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DinosaurEntryId = table.Column<int>(type: "int", nullable: false),
                    Heading = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DinoContentSections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DinoContentSections_DinosaurEntries_DinosaurEntryId",
                        column: x => x.DinosaurEntryId,
                        principalTable: "DinosaurEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DinoIllustrations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DinosaurEntryId = table.Column<int>(type: "int", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Caption = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Credit = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DinoIllustrations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DinoIllustrations_DinosaurEntries_DinosaurEntryId",
                        column: x => x.DinosaurEntryId,
                        principalTable: "DinosaurEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DinoContentSections_DinosaurEntryId",
                table: "DinoContentSections",
                column: "DinosaurEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_DinoIllustrations_DinosaurEntryId",
                table: "DinoIllustrations",
                column: "DinosaurEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_DinosaurEntries_ClassId",
                table: "DinosaurEntries",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_DinosaurEntries_CommonName",
                table: "DinosaurEntries",
                column: "CommonName");

            migrationBuilder.CreateIndex(
                name: "IX_DinosaurEntries_FamilyId",
                table: "DinosaurEntries",
                column: "FamilyId");

            migrationBuilder.CreateIndex(
                name: "IX_DinosaurEntries_GenusId",
                table: "DinosaurEntries",
                column: "GenusId");

            migrationBuilder.CreateIndex(
                name: "IX_DinosaurEntries_IsPublished",
                table: "DinosaurEntries",
                column: "IsPublished");

            migrationBuilder.CreateIndex(
                name: "IX_DinosaurEntries_KingdomId",
                table: "DinosaurEntries",
                column: "KingdomId");

            migrationBuilder.CreateIndex(
                name: "IX_DinosaurEntries_PhylumId",
                table: "DinosaurEntries",
                column: "PhylumId");

            migrationBuilder.CreateIndex(
                name: "IX_DinosaurEntries_ScientificName",
                table: "DinosaurEntries",
                column: "ScientificName");

            migrationBuilder.CreateIndex(
                name: "IX_DinosaurEntries_Slug",
                table: "DinosaurEntries",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DinosaurEntries_SpeciesId",
                table: "DinosaurEntries",
                column: "SpeciesId");

            migrationBuilder.CreateIndex(
                name: "IX_DinosaurEntries_SubfamilyId",
                table: "DinosaurEntries",
                column: "SubfamilyId");

            migrationBuilder.CreateIndex(
                name: "IX_DinoTaxonomyNodes_ParentId",
                table: "DinoTaxonomyNodes",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_DinoTaxonomyNodes_Rank_Name",
                table: "DinoTaxonomyNodes",
                columns: new[] { "Rank", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DinoContentSections");

            migrationBuilder.DropTable(
                name: "DinoIllustrations");

            migrationBuilder.DropTable(
                name: "DinosaurEntries");

            migrationBuilder.DropTable(
                name: "DinoTaxonomyNodes");
        }
    }
}
