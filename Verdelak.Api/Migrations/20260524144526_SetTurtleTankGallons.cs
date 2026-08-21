using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class SetTurtleTankGallons : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE [FishTanks]
                SET [Gallons] = 40
                WHERE [Name] = N'Turtle Tank'
                AND [Location] = N'Turtle Room';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE [FishTanks]
                SET [Gallons] = NULL
                WHERE [Name] = N'Turtle Tank'
                AND [Location] = N'Turtle Room';
                """);
        }
    }
}
