using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceAccountBalanceHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FinanceAccountBalanceHistory",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FinanceAccountBalanceId = table.Column<int>(type: "int", nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    AsOfDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RecordedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceAccountBalanceHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FinanceAccountBalanceHistory_FinanceAccountBalances_FinanceAccountBalanceId",
                        column: x => x.FinanceAccountBalanceId,
                        principalTable: "FinanceAccountBalances",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FinanceAccountBalanceHistory_FinanceAccountBalanceId_AsOfDate",
                table: "FinanceAccountBalanceHistory",
                columns: new[] { "FinanceAccountBalanceId", "AsOfDate" });

            migrationBuilder.CreateIndex(
                name: "IX_FinanceAccountBalanceHistory_RecordedAt",
                table: "FinanceAccountBalanceHistory",
                column: "RecordedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FinanceAccountBalanceHistory");
        }
    }
}
