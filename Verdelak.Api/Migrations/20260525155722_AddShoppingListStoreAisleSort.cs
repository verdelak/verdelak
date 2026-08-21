using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddShoppingListStoreAisleSort : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Aisle",
                table: "ShoppingListItems",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "ShoppingListItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Store",
                table: "ShoppingListItems",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShoppingListItems_Store_Aisle_SortOrder",
                table: "ShoppingListItems",
                columns: new[] { "Store", "Aisle", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ShoppingListItems_Store_Aisle_SortOrder",
                table: "ShoppingListItems");

            migrationBuilder.DropColumn(
                name: "Aisle",
                table: "ShoppingListItems");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "ShoppingListItems");

            migrationBuilder.DropColumn(
                name: "Store",
                table: "ShoppingListItems");
        }
    }
}
