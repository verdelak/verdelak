using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPlanItemNativePlanningFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PlanningWindowType",
                table: "PlanItems",
                type: "nvarchar(25)",
                maxLength: 25,
                nullable: false,
                defaultValue: "Unscheduled");

            migrationBuilder.AddColumn<string>(
                name: "ScheduleSurfaceMode",
                table: "PlanItems",
                type: "nvarchar(25)",
                maxLength: 25,
                nullable: false,
                defaultValue: "Never");

            migrationBuilder.AddColumn<DateTime>(
                name: "TargetEndDate",
                table: "PlanItems",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TargetStartDate",
                table: "PlanItems",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlanItems_AnnualPlanId_PlanningWindowType",
                table: "PlanItems",
                columns: new[] { "AnnualPlanId", "PlanningWindowType" });

            migrationBuilder.CreateIndex(
                name: "IX_PlanItems_AnnualPlanId_TargetEndDate",
                table: "PlanItems",
                columns: new[] { "AnnualPlanId", "TargetEndDate" });

            migrationBuilder.CreateIndex(
                name: "IX_PlanItems_AnnualPlanId_TargetStartDate",
                table: "PlanItems",
                columns: new[] { "AnnualPlanId", "TargetStartDate" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PlanItems_AnnualPlanId_PlanningWindowType",
                table: "PlanItems");

            migrationBuilder.DropIndex(
                name: "IX_PlanItems_AnnualPlanId_TargetEndDate",
                table: "PlanItems");

            migrationBuilder.DropIndex(
                name: "IX_PlanItems_AnnualPlanId_TargetStartDate",
                table: "PlanItems");

            migrationBuilder.DropColumn(
                name: "PlanningWindowType",
                table: "PlanItems");

            migrationBuilder.DropColumn(
                name: "ScheduleSurfaceMode",
                table: "PlanItems");

            migrationBuilder.DropColumn(
                name: "TargetEndDate",
                table: "PlanItems");

            migrationBuilder.DropColumn(
                name: "TargetStartDate",
                table: "PlanItems");
        }
    }
}
