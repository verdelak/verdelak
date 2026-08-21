using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFishTanks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_ScheduledTaskTags_ScheduledTasks_ScheduledTaskTaskID'
                )
                BEGIN
                    ALTER TABLE [ScheduledTaskTags]
                    DROP CONSTRAINT [FK_ScheduledTaskTags_ScheduledTasks_ScheduledTaskTaskID];
                END

                IF EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_ScheduledTaskTags_ScheduledTaskTaskID'
                    AND object_id = OBJECT_ID(N'[ScheduledTaskTags]')
                )
                BEGIN
                    DROP INDEX [IX_ScheduledTaskTags_ScheduledTaskTaskID] ON [ScheduledTaskTags];
                END

                IF COL_LENGTH('ScheduledTaskTags', 'ScheduledTaskTaskID') IS NOT NULL
                BEGIN
                    ALTER TABLE [ScheduledTaskTags]
                    DROP COLUMN [ScheduledTaskTaskID];
                END
                """);

            migrationBuilder.CreateTable(
                name: "FishTanks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Gallons = table.Column<decimal>(type: "decimal(8,2)", nullable: true),
                    Location = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsSetup = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FishTanks", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "FishTanks",
                columns: new[] { "Name", "Gallons", "Location", "IsSetup", "IsActive", "Notes" },
                values: new object[,]
                {
                    { "75 gallon tank", 75m, "Family Room", true, true, null },
                    { "55 gallon tank", 55m, "Game Room", true, true, null },
                    { "Turtle Tank", null, "Turtle Room", true, true, null },
                    { "200 gallon tank", 200m, "Basement", true, true, null },
                    { "30 gallon tank", 30m, "Basement", true, true, null },
                    { "20 gallon tank", 20m, "Basement", true, true, null },
                    { "10 gallon tank", 10m, "Basement", true, true, null },
                    { "2 gallon tank", 2m, "Basement", true, true, null },
                    { "Second 10 gallon tank", 10m, "Basement", false, false, "Not setup yet." },
                    { "Extra 2 gallon tank 1", 2m, "Basement", false, false, "Not setup yet." },
                    { "Extra 2 gallon tank 2", 2m, "Basement", false, false, "Not setup yet." }
                });

            migrationBuilder.Sql("""
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_ScheduledTaskTags_ScheduledTasks_TaskID'
                )
                BEGIN
                    ALTER TABLE [ScheduledTaskTags]
                    ADD CONSTRAINT [FK_ScheduledTaskTags_ScheduledTasks_TaskID]
                    FOREIGN KEY ([TaskID]) REFERENCES [ScheduledTasks]([TaskID]) ON DELETE CASCADE;
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF EXISTS (
                    SELECT 1
                    FROM sys.foreign_keys
                    WHERE name = 'FK_ScheduledTaskTags_ScheduledTasks_TaskID'
                )
                BEGIN
                    ALTER TABLE [ScheduledTaskTags]
                    DROP CONSTRAINT [FK_ScheduledTaskTags_ScheduledTasks_TaskID];
                END
                """);

            migrationBuilder.DropTable(
                name: "FishTanks");

            migrationBuilder.AddColumn<int>(
                name: "ScheduledTaskTaskID",
                table: "ScheduledTaskTags",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_ScheduledTaskTags_ScheduledTaskTaskID",
                table: "ScheduledTaskTags",
                column: "ScheduledTaskTaskID");

            migrationBuilder.AddForeignKey(
                name: "FK_ScheduledTaskTags_ScheduledTasks_ScheduledTaskTaskID",
                table: "ScheduledTaskTags",
                column: "ScheduledTaskTaskID",
                principalTable: "ScheduledTasks",
                principalColumn: "TaskID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
