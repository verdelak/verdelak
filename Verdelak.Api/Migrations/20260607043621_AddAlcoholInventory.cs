using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAlcoholInventory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AlcoholItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Producer = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Style = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Type = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Variety = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Color = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Country = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Region = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    VintageOrYear = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Size = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    Rating = table.Column<decimal>(type: "decimal(4,2)", precision: 4, scale: 2, nullable: true),
                    QuantityOnHand = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    Location = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    StatusID = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false, defaultValue: "H"),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    SourceSheet = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    SourceRowLabel = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlcoholItems", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AlcoholItems_Category",
                table: "AlcoholItems",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_AlcoholItems_Location",
                table: "AlcoholItems",
                column: "Location");

            migrationBuilder.CreateIndex(
                name: "IX_AlcoholItems_Name",
                table: "AlcoholItems",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_AlcoholItems_SourceSheet",
                table: "AlcoholItems",
                column: "SourceSheet");

            migrationBuilder.CreateIndex(
                name: "IX_AlcoholItems_StatusID",
                table: "AlcoholItems",
                column: "StatusID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlcoholItems");
        }
    }
}
