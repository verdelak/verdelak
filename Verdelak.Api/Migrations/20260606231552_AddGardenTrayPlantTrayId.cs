using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGardenTrayPlantTrayId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[dbo].[GardenSeedTrayPlants]', N'U') IS NOT NULL
                   AND COL_LENGTH(N'[dbo].[GardenSeedTrayPlants]', N'TrayID') IS NULL
                BEGIN
                    ALTER TABLE [dbo].[GardenSeedTrayPlants]
                        ADD [TrayID] int NOT NULL
                            CONSTRAINT [DF_GardenSeedTrayPlants_TrayID] DEFAULT(0);

                    EXEC(N'UPDATE [dbo].[GardenSeedTrayPlants]
                        SET [TrayID] = COALESCE((SELECT TOP 1 [ID] FROM [dbo].[GardenSeedTray] ORDER BY [ID]), 0)
                        WHERE [TrayID] = 0;');
                END

                IF OBJECT_ID(N'[dbo].[GardenSeedTrayPlants]', N'U') IS NOT NULL
                   AND COL_LENGTH(N'[dbo].[GardenSeedTrayPlants]', N'TrayID') IS NOT NULL
                   AND NOT EXISTS (
                       SELECT 1
                       FROM sys.indexes
                       WHERE [name] = N'IX_GardenSeedTrayPlants_TrayID'
                         AND [object_id] = OBJECT_ID(N'[dbo].[GardenSeedTrayPlants]')
                   )
                BEGIN
                    CREATE INDEX [IX_GardenSeedTrayPlants_TrayID]
                    ON [dbo].[GardenSeedTrayPlants] ([TrayID]);
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[dbo].[GardenSeedTrayPlants]', N'U') IS NOT NULL
                   AND EXISTS (
                       SELECT 1
                       FROM sys.indexes
                       WHERE [name] = N'IX_GardenSeedTrayPlants_TrayID'
                         AND [object_id] = OBJECT_ID(N'[dbo].[GardenSeedTrayPlants]')
                   )
                BEGIN
                    DROP INDEX [IX_GardenSeedTrayPlants_TrayID]
                    ON [dbo].[GardenSeedTrayPlants];
                END

                IF OBJECT_ID(N'[dbo].[GardenSeedTrayPlants]', N'U') IS NOT NULL
                   AND COL_LENGTH(N'[dbo].[GardenSeedTrayPlants]', N'TrayID') IS NOT NULL
                BEGIN
                    DECLARE @constraintName nvarchar(128);

                    SELECT @constraintName = dc.[name]
                    FROM sys.default_constraints dc
                    INNER JOIN sys.columns c
                        ON c.[default_object_id] = dc.[object_id]
                    WHERE dc.[parent_object_id] = OBJECT_ID(N'[dbo].[GardenSeedTrayPlants]')
                      AND c.[name] = N'TrayID';

                    IF @constraintName IS NOT NULL
                    BEGIN
                        EXEC(N'ALTER TABLE [dbo].[GardenSeedTrayPlants] DROP CONSTRAINT [' + @constraintName + N']');
                    END

                    ALTER TABLE [dbo].[GardenSeedTrayPlants]
                    DROP COLUMN [TrayID];
                END
                """);
        }
    }
}
