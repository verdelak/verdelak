using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRecipeEntries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RecipeEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Category = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Cuisine = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PrepMinutes = table.Column<int>(type: "int", nullable: true),
                    CookMinutes = table.Column<int>(type: "int", nullable: true),
                    Servings = table.Column<int>(type: "int", nullable: true),
                    SourceUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    IsFavorite = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecipeEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RecipeFoodTags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecipeFoodTags", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RecipeEntryIngredients",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RecipeId = table.Column<int>(type: "int", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    ItemName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Preparation = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    ShoppingCategory = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecipeEntryIngredients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecipeEntryIngredients_RecipeEntries_RecipeId",
                        column: x => x.RecipeId,
                        principalTable: "RecipeEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RecipeEntryInstructions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RecipeId = table.Column<int>(type: "int", nullable: false),
                    StepNumber = table.Column<int>(type: "int", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecipeEntryInstructions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RecipeEntryInstructions_RecipeEntries_RecipeId",
                        column: x => x.RecipeId,
                        principalTable: "RecipeEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RecipeFoodTagLinks",
                columns: table => new
                {
                    RecipeId = table.Column<int>(type: "int", nullable: false),
                    RecipeTagId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecipeFoodTagLinks", x => new { x.RecipeId, x.RecipeTagId });
                    table.ForeignKey(
                        name: "FK_RecipeFoodTagLinks_RecipeEntries_RecipeId",
                        column: x => x.RecipeId,
                        principalTable: "RecipeEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RecipeFoodTagLinks_RecipeFoodTags_RecipeTagId",
                        column: x => x.RecipeTagId,
                        principalTable: "RecipeFoodTags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RecipeEntries_Category",
                table: "RecipeEntries",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_RecipeEntries_Cuisine",
                table: "RecipeEntries",
                column: "Cuisine");

            migrationBuilder.CreateIndex(
                name: "IX_RecipeEntries_IsActive",
                table: "RecipeEntries",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_RecipeEntries_IsFavorite",
                table: "RecipeEntries",
                column: "IsFavorite");

            migrationBuilder.CreateIndex(
                name: "IX_RecipeEntries_Title",
                table: "RecipeEntries",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_RecipeEntryIngredients_ItemName",
                table: "RecipeEntryIngredients",
                column: "ItemName");

            migrationBuilder.CreateIndex(
                name: "IX_RecipeEntryIngredients_RecipeId",
                table: "RecipeEntryIngredients",
                column: "RecipeId");

            migrationBuilder.CreateIndex(
                name: "IX_RecipeEntryIngredients_ShoppingCategory",
                table: "RecipeEntryIngredients",
                column: "ShoppingCategory");

            migrationBuilder.CreateIndex(
                name: "IX_RecipeEntryInstructions_RecipeId",
                table: "RecipeEntryInstructions",
                column: "RecipeId");

            migrationBuilder.CreateIndex(
                name: "IX_RecipeFoodTagLinks_RecipeTagId",
                table: "RecipeFoodTagLinks",
                column: "RecipeTagId");

            migrationBuilder.CreateIndex(
                name: "IX_RecipeFoodTags_Name",
                table: "RecipeFoodTags",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RecipeFoodTags_Slug",
                table: "RecipeFoodTags",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RecipeEntryIngredients");

            migrationBuilder.DropTable(
                name: "RecipeEntryInstructions");

            migrationBuilder.DropTable(
                name: "RecipeFoodTagLinks");

            migrationBuilder.DropTable(
                name: "RecipeEntries");

            migrationBuilder.DropTable(
                name: "RecipeFoodTags");
        }
    }
}
