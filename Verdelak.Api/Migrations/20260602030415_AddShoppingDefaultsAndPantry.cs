using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddShoppingDefaultsAndPantry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PantryItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ItemName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Location = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ExpirationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsInStock = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PantryItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ShoppingItemDefaults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ItemName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Store = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Aisle = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: true),
                    IsFrequent = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShoppingItemDefaults", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PantryItems_Category",
                table: "PantryItems",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_PantryItems_ExpirationDate",
                table: "PantryItems",
                column: "ExpirationDate");

            migrationBuilder.CreateIndex(
                name: "IX_PantryItems_IsInStock",
                table: "PantryItems",
                column: "IsInStock");

            migrationBuilder.CreateIndex(
                name: "IX_PantryItems_ItemName",
                table: "PantryItems",
                column: "ItemName");

            migrationBuilder.CreateIndex(
                name: "IX_ShoppingItemDefaults_Category",
                table: "ShoppingItemDefaults",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_ShoppingItemDefaults_IsFrequent",
                table: "ShoppingItemDefaults",
                column: "IsFrequent");

            migrationBuilder.CreateIndex(
                name: "IX_ShoppingItemDefaults_ItemName",
                table: "ShoppingItemDefaults",
                column: "ItemName");

            migrationBuilder.CreateIndex(
                name: "IX_ShoppingItemDefaults_Store_Aisle_SortOrder",
                table: "ShoppingItemDefaults",
                columns: new[] { "Store", "Aisle", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PantryItems");

            migrationBuilder.DropTable(
                name: "ShoppingItemDefaults");
        }
    }
}
