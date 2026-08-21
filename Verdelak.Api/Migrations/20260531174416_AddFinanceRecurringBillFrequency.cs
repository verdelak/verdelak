using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceRecurringBillFrequency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BillingIntervalMonths",
                table: "FinanceRecurringBills",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "StartMonth",
                table: "FinanceRecurringBills",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_FinanceRecurringBills_IsActive_BillingIntervalMonths_StartMonth",
                table: "FinanceRecurringBills",
                columns: new[] { "IsActive", "BillingIntervalMonths", "StartMonth" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_FinanceRecurringBills_IsActive_BillingIntervalMonths_StartMonth",
                table: "FinanceRecurringBills");

            migrationBuilder.DropColumn(
                name: "BillingIntervalMonths",
                table: "FinanceRecurringBills");

            migrationBuilder.DropColumn(
                name: "StartMonth",
                table: "FinanceRecurringBills");
        }
    }
}
