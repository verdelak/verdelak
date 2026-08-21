using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceTracker : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FinanceAccountBalances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    IsDebt = table.Column<bool>(type: "bit", nullable: false),
                    AsOfDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceAccountBalances", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FinanceDonations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DonationDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Organization = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Method = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    HasReceipt = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceDonations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FinanceRecurringBills",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ExpectedAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    DueDay = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceRecurringBills", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FinanceYearSnapshots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SnapshotDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TotalDebt = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TotalSavings = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Difference = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    IsFrozen = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceYearSnapshots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FinanceRecurringBillPayments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RecurringBillId = table.Column<int>(type: "int", nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    Month = table.Column<int>(type: "int", nullable: false),
                    AmountPaid = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    PaidDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsPaid = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceRecurringBillPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FinanceRecurringBillPayments_FinanceRecurringBills_RecurringBillId",
                        column: x => x.RecurringBillId,
                        principalTable: "FinanceRecurringBills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FinanceAccountBalances_Category",
                table: "FinanceAccountBalances",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_FinanceAccountBalances_IsActive_SortOrder",
                table: "FinanceAccountBalances",
                columns: new[] { "IsActive", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_FinanceDonations_DonationDate",
                table: "FinanceDonations",
                column: "DonationDate");

            migrationBuilder.CreateIndex(
                name: "IX_FinanceDonations_Organization",
                table: "FinanceDonations",
                column: "Organization");

            migrationBuilder.CreateIndex(
                name: "IX_FinanceRecurringBillPayments_RecurringBillId_Year_Month",
                table: "FinanceRecurringBillPayments",
                columns: new[] { "RecurringBillId", "Year", "Month" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FinanceRecurringBillPayments_Year_Month_IsPaid",
                table: "FinanceRecurringBillPayments",
                columns: new[] { "Year", "Month", "IsPaid" });

            migrationBuilder.CreateIndex(
                name: "IX_FinanceRecurringBills_Category",
                table: "FinanceRecurringBills",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_FinanceRecurringBills_IsActive_DueDay",
                table: "FinanceRecurringBills",
                columns: new[] { "IsActive", "DueDay" });

            migrationBuilder.CreateIndex(
                name: "IX_FinanceYearSnapshots_SnapshotDate",
                table: "FinanceYearSnapshots",
                column: "SnapshotDate",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FinanceAccountBalances");

            migrationBuilder.DropTable(
                name: "FinanceDonations");

            migrationBuilder.DropTable(
                name: "FinanceRecurringBillPayments");

            migrationBuilder.DropTable(
                name: "FinanceYearSnapshots");

            migrationBuilder.DropTable(
                name: "FinanceRecurringBills");
        }
    }
}
