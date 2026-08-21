using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMiniaturesLegacyMappings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
IF COL_LENGTH(N'dbo.Minis', N'Subset') IS NULL
    ALTER TABLE [dbo].[Minis] ADD [Subset] nvarchar(100) NULL;

IF COL_LENGTH(N'dbo.Minis', N'Size') IS NULL
    ALTER TABLE [dbo].[Minis] ADD [Size] nvarchar(50) NULL;

IF COL_LENGTH(N'dbo.Minis', N'Type') IS NULL
    ALTER TABLE [dbo].[Minis] ADD [Type] nvarchar(50) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Minis_MiniName' AND object_id = OBJECT_ID(N'[dbo].[Minis]'))
    CREATE INDEX [IX_Minis_MiniName] ON [dbo].[Minis] ([MiniName]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Minis_Num' AND object_id = OBJECT_ID(N'[dbo].[Minis]'))
    CREATE INDEX [IX_Minis_Num] ON [dbo].[Minis] ([Num]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Minis_RarityID' AND object_id = OBJECT_ID(N'[dbo].[Minis]'))
    CREATE INDEX [IX_Minis_RarityID] ON [dbo].[Minis] ([RarityID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Minis_SeriesID' AND object_id = OBJECT_ID(N'[dbo].[Minis]'))
    CREATE INDEX [IX_Minis_SeriesID] ON [dbo].[Minis] ([SeriesID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Minis_Size' AND object_id = OBJECT_ID(N'[dbo].[Minis]'))
    CREATE INDEX [IX_Minis_Size] ON [dbo].[Minis] ([Size]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Minis_Subset' AND object_id = OBJECT_ID(N'[dbo].[Minis]'))
    CREATE INDEX [IX_Minis_Subset] ON [dbo].[Minis] ([Subset]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Minis_Type' AND object_id = OBJECT_ID(N'[dbo].[Minis]'))
    CREATE INDEX [IX_Minis_Type] ON [dbo].[Minis] ([Type]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_MiniCompany_Company' AND object_id = OBJECT_ID(N'[dbo].[MiniCompany]'))
    CREATE INDEX [IX_MiniCompany_Company] ON [dbo].[MiniCompany] ([Company]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_MiniSeries_Series' AND object_id = OBJECT_ID(N'[dbo].[MiniSeries]'))
    CREATE INDEX [IX_MiniSeries_Series] ON [dbo].[MiniSeries] ([Series]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_MiniSeries_SystemID' AND object_id = OBJECT_ID(N'[dbo].[MiniSeries]'))
    CREATE INDEX [IX_MiniSeries_SystemID] ON [dbo].[MiniSeries] ([SystemID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_MiniStatus_MiniID' AND object_id = OBJECT_ID(N'[dbo].[MiniStatus]'))
    CREATE INDEX [IX_MiniStatus_MiniID] ON [dbo].[MiniStatus] ([MiniID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_MiniStatus_StatusID' AND object_id = OBJECT_ID(N'[dbo].[MiniStatus]'))
    CREATE INDEX [IX_MiniStatus_StatusID] ON [dbo].[MiniStatus] ([StatusID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_MiniSystem_CompanyID' AND object_id = OBJECT_ID(N'[dbo].[MiniSystem]'))
    CREATE INDEX [IX_MiniSystem_CompanyID] ON [dbo].[MiniSystem] ([CompanyID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_MiniSystem_System' AND object_id = OBJECT_ID(N'[dbo].[MiniSystem]'))
    CREATE INDEX [IX_MiniSystem_System] ON [dbo].[MiniSystem] ([System]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_MiniSystemRelease_SystemID' AND object_id = OBJECT_ID(N'[dbo].[MiniSystemRelease]'))
    CREATE INDEX [IX_MiniSystemRelease_SystemID] ON [dbo].[MiniSystemRelease] ([SystemID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_MiniValue_miniID' AND object_id = OBJECT_ID(N'[dbo].[MiniValue]'))
    CREATE INDEX [IX_MiniValue_miniID] ON [dbo].[MiniValue] ([miniID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_MiniValue_StoredID' AND object_id = OBJECT_ID(N'[dbo].[MiniValue]'))
    CREATE INDEX [IX_MiniValue_StoredID] ON [dbo].[MiniValue] ([StoredID]);
""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
IF EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Minis_Type' AND object_id = OBJECT_ID(N'[dbo].[Minis]'))
    DROP INDEX [IX_Minis_Type] ON [dbo].[Minis];

IF EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Minis_Subset' AND object_id = OBJECT_ID(N'[dbo].[Minis]'))
    DROP INDEX [IX_Minis_Subset] ON [dbo].[Minis];

IF EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Minis_Size' AND object_id = OBJECT_ID(N'[dbo].[Minis]'))
    DROP INDEX [IX_Minis_Size] ON [dbo].[Minis];

IF COL_LENGTH(N'dbo.Minis', N'Type') IS NOT NULL
    ALTER TABLE [dbo].[Minis] DROP COLUMN [Type];

IF COL_LENGTH(N'dbo.Minis', N'Size') IS NOT NULL
    ALTER TABLE [dbo].[Minis] DROP COLUMN [Size];

IF COL_LENGTH(N'dbo.Minis', N'Subset') IS NOT NULL
    ALTER TABLE [dbo].[Minis] DROP COLUMN [Subset];
""");
        }
    }
}
