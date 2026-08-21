using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAppUserTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MusicAlbum_MusicArtist_ArtistID",
                table: "MusicAlbum");

            migrationBuilder.DropColumn(
                name: "Reviewer",
                table: "Review");

            migrationBuilder.DropColumn(
                name: "Bio",
                table: "MusicArtistBios");

            migrationBuilder.AddColumn<int>(
                name: "ReviewerID",
                table: "Review",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "AdditionalInfo",
                table: "MusicArtistBios",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BioText",
                table: "MusicArtistBios",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Reviewer",
                columns: table => new
                {
                    ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReviewerName = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reviewer", x => x.ID);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Review_ReviewerID",
                table: "Review",
                column: "ReviewerID");

            migrationBuilder.AddForeignKey(
                name: "FK_MusicAlbum_MusicArtist_ArtistID",
                table: "MusicAlbum",
                column: "ArtistID",
                principalTable: "MusicArtist",
                principalColumn: "ID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Review_Reviewer_ReviewerID",
                table: "Review",
                column: "ReviewerID",
                principalTable: "Reviewer",
                principalColumn: "ID",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MusicAlbum_MusicArtist_ArtistID",
                table: "MusicAlbum");

            migrationBuilder.DropForeignKey(
                name: "FK_Review_Reviewer_ReviewerID",
                table: "Review");

            migrationBuilder.DropTable(
                name: "Reviewer");

            migrationBuilder.DropIndex(
                name: "IX_Review_ReviewerID",
                table: "Review");

            migrationBuilder.DropColumn(
                name: "ReviewerID",
                table: "Review");

            migrationBuilder.DropColumn(
                name: "AdditionalInfo",
                table: "MusicArtistBios");

            migrationBuilder.DropColumn(
                name: "BioText",
                table: "MusicArtistBios");

            migrationBuilder.AddColumn<string>(
                name: "Reviewer",
                table: "Review",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Bio",
                table: "MusicArtistBios",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_MusicAlbum_MusicArtist_ArtistID",
                table: "MusicAlbum",
                column: "ArtistID",
                principalTable: "MusicArtist",
                principalColumn: "ID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
