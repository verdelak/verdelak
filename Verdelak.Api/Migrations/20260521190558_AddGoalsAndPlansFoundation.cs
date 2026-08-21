using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGoalsAndPlansFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AnnualPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Year = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: false),
                    SourceSystem = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    SourceFileName = table.Column<string>(type: "nvarchar(260)", maxLength: 260, nullable: true),
                    SourceCreatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SourceLastSavedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ImportedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnualPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlanItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AnnualPlanId = table.Column<int>(type: "int", nullable: false),
                    ParentPlanItemId = table.Column<int>(type: "int", nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    OutlineLevel = table.Column<int>(type: "int", nullable: false),
                    ItemType = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    TopLevelSection = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PercentComplete = table.Column<int>(type: "int", nullable: false),
                    IsSummary = table.Column<bool>(type: "bit", nullable: false),
                    IsMilestone = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: false),
                    SourceTaskUid = table.Column<int>(type: "int", nullable: true),
                    SourceTaskId = table.Column<int>(type: "int", nullable: true),
                    SourceManualSchedule = table.Column<bool>(type: "bit", nullable: false),
                    ImportedStart = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ImportedFinish = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ImportedDuration = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanItems_AnnualPlans_AnnualPlanId",
                        column: x => x.AnnualPlanId,
                        principalTable: "AnnualPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlanItems_PlanItems_ParentPlanItemId",
                        column: x => x.ParentPlanItemId,
                        principalTable: "PlanItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlanItemPredecessors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlanItemId = table.Column<int>(type: "int", nullable: false),
                    PredecessorSourceTaskUid = table.Column<int>(type: "int", nullable: false),
                    ImportedLinkType = table.Column<string>(type: "nvarchar(25)", maxLength: 25, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanItemPredecessors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanItemPredecessors_PlanItems_PlanItemId",
                        column: x => x.PlanItemId,
                        principalTable: "PlanItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnnualPlans_Status",
                table: "AnnualPlans",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_AnnualPlans_Year",
                table: "AnnualPlans",
                column: "Year",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlanItemPredecessors_PlanItemId",
                table: "PlanItemPredecessors",
                column: "PlanItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanItemPredecessors_PredecessorSourceTaskUid",
                table: "PlanItemPredecessors",
                column: "PredecessorSourceTaskUid");

            migrationBuilder.CreateIndex(
                name: "IX_PlanItems_AnnualPlanId_SortOrder",
                table: "PlanItems",
                columns: new[] { "AnnualPlanId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_PlanItems_AnnualPlanId_TopLevelSection",
                table: "PlanItems",
                columns: new[] { "AnnualPlanId", "TopLevelSection" });

            migrationBuilder.CreateIndex(
                name: "IX_PlanItems_ParentPlanItemId",
                table: "PlanItems",
                column: "ParentPlanItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanItems_SourceTaskUid",
                table: "PlanItems",
                column: "SourceTaskUid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlanItemPredecessors");

            migrationBuilder.DropTable(
                name: "PlanItems");

            migrationBuilder.DropTable(
                name: "AnnualPlans");
        }
    }
}
