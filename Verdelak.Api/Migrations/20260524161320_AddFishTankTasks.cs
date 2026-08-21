using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFishTankTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FishTankTasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FishTankId = table.Column<int>(type: "int", nullable: false),
                    TaskId = table.Column<int>(type: "int", nullable: false),
                    TaskCategory = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FishTankTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FishTankTasks_FishTanks_FishTankId",
                        column: x => x.FishTankId,
                        principalTable: "FishTanks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FishTankTasks_ScheduledTasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "ScheduledTasks",
                        principalColumn: "TaskID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FishTankTasks_FishTankId",
                table: "FishTankTasks",
                column: "FishTankId");

            migrationBuilder.CreateIndex(
                name: "IX_FishTankTasks_TaskCategory",
                table: "FishTankTasks",
                column: "TaskCategory");

            migrationBuilder.CreateIndex(
                name: "IX_FishTankTasks_TaskId",
                table: "FishTankTasks",
                column: "TaskId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FishTankTasks");
        }
    }
}
