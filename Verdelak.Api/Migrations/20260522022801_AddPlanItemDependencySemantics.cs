using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPlanItemDependencySemantics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DependencyType",
                table: "PlanItemPredecessors",
                type: "nvarchar(2)",
                maxLength: 2,
                nullable: false,
                defaultValue: "FS");

            migrationBuilder.AddColumn<int>(
                name: "ImportedLagFormat",
                table: "PlanItemPredecessors",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LagMinutes",
                table: "PlanItemPredecessors",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(
                """
                UPDATE PlanItemPredecessors
                SET DependencyType = CASE ImportedLinkType
                    WHEN '0' THEN 'FF'
                    WHEN '2' THEN 'SF'
                    WHEN '3' THEN 'SS'
                    ELSE 'FS'
                END
                WHERE ImportedLinkType IS NOT NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DependencyType",
                table: "PlanItemPredecessors");

            migrationBuilder.DropColumn(
                name: "ImportedLagFormat",
                table: "PlanItemPredecessors");

            migrationBuilder.DropColumn(
                name: "LagMinutes",
                table: "PlanItemPredecessors");
        }
    }
}
