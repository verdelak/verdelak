using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPlanItemDependencyLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "PredecessorSourceTaskUid",
                table: "PlanItemPredecessors",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "PredecessorPlanItemId",
                table: "PlanItemPredecessors",
                type: "int",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE dependency
                SET PredecessorPlanItemId = predecessor.Id
                FROM PlanItemPredecessors dependency
                INNER JOIN PlanItems dependent ON dependent.Id = dependency.PlanItemId
                INNER JOIN PlanItems predecessor
                    ON predecessor.AnnualPlanId = dependent.AnnualPlanId
                    AND predecessor.SourceTaskUid = dependency.PredecessorSourceTaskUid
                WHERE dependency.PredecessorPlanItemId IS NULL
                    AND dependency.PredecessorSourceTaskUid IS NOT NULL;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_PlanItemPredecessors_PlanItemId_PredecessorPlanItemId",
                table: "PlanItemPredecessors",
                columns: new[] { "PlanItemId", "PredecessorPlanItemId" },
                unique: true,
                filter: "[PredecessorPlanItemId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PlanItemPredecessors_PredecessorPlanItemId",
                table: "PlanItemPredecessors",
                column: "PredecessorPlanItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_PlanItemPredecessors_PlanItems_PredecessorPlanItemId",
                table: "PlanItemPredecessors",
                column: "PredecessorPlanItemId",
                principalTable: "PlanItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PlanItemPredecessors_PlanItems_PredecessorPlanItemId",
                table: "PlanItemPredecessors");

            migrationBuilder.DropIndex(
                name: "IX_PlanItemPredecessors_PlanItemId_PredecessorPlanItemId",
                table: "PlanItemPredecessors");

            migrationBuilder.DropIndex(
                name: "IX_PlanItemPredecessors_PredecessorPlanItemId",
                table: "PlanItemPredecessors");

            migrationBuilder.DropColumn(
                name: "PredecessorPlanItemId",
                table: "PlanItemPredecessors");

            migrationBuilder.AlterColumn<int>(
                name: "PredecessorSourceTaskUid",
                table: "PlanItemPredecessors",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
