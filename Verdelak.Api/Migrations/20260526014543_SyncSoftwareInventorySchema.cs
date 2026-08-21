using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class SyncSoftwareInventorySchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
IF OBJECT_ID(N'[dbo].[SoftwareLocation]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[SoftwareLocation]
    (
        [ID] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_SoftwareLocation] PRIMARY KEY,
        [Location] nvarchar(50) NOT NULL
    );
END;

IF OBJECT_ID(N'[dbo].[SoftwarePlatform]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[SoftwarePlatform]
    (
        [ID] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_SoftwarePlatform] PRIMARY KEY,
        [Platform] nvarchar(50) NOT NULL
    );
END;

IF OBJECT_ID(N'[dbo].[Software]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Software]
    (
        [ID] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Software] PRIMARY KEY,
        [Title] nvarchar(50) NOT NULL,
        [StatusID] nchar(1) NULL,
        [PlatformID] int NOT NULL,
        [LocationID] int NULL,
        [Publisher] nvarchar(100) NULL,
        [Developer] nvarchar(100) NULL,
        [VersionEdition] nvarchar(100) NULL,
        [MediaType] nvarchar(50) NULL,
        [SerialLicenseKeyNotes] nvarchar(1000) NULL,
        [HasBox] bit NOT NULL CONSTRAINT [DF_Software_HasBox] DEFAULT (0),
        [HasManual] bit NOT NULL CONSTRAINT [DF_Software_HasManual] DEFAULT (0),
        [HasDisc] bit NOT NULL CONSTRAINT [DF_Software_HasDisc] DEFAULT (0),
        [Notes] nvarchar(2000) NULL
    );
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE [type] = N'PK' AND parent_object_id = OBJECT_ID(N'[dbo].[SoftwareLocation]')
)
    ALTER TABLE [dbo].[SoftwareLocation] ADD CONSTRAINT [PK_SoftwareLocation] PRIMARY KEY ([ID]);

IF NOT EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE [type] = N'PK' AND parent_object_id = OBJECT_ID(N'[dbo].[SoftwarePlatform]')
)
    ALTER TABLE [dbo].[SoftwarePlatform] ADD CONSTRAINT [PK_SoftwarePlatform] PRIMARY KEY ([ID]);

IF NOT EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE [type] = N'PK' AND parent_object_id = OBJECT_ID(N'[dbo].[Software]')
)
    ALTER TABLE [dbo].[Software] ADD CONSTRAINT [PK_Software] PRIMARY KEY ([ID]);

IF COL_LENGTH(N'[dbo].[Software]', N'LocationID') IS NULL
    ALTER TABLE [dbo].[Software] ADD [LocationID] int NULL;

IF COL_LENGTH(N'[dbo].[Software]', N'Publisher') IS NULL
    ALTER TABLE [dbo].[Software] ADD [Publisher] nvarchar(100) NULL;

IF COL_LENGTH(N'[dbo].[Software]', N'Developer') IS NULL
    ALTER TABLE [dbo].[Software] ADD [Developer] nvarchar(100) NULL;

IF COL_LENGTH(N'[dbo].[Software]', N'VersionEdition') IS NULL
    ALTER TABLE [dbo].[Software] ADD [VersionEdition] nvarchar(100) NULL;

IF COL_LENGTH(N'[dbo].[Software]', N'MediaType') IS NULL
    ALTER TABLE [dbo].[Software] ADD [MediaType] nvarchar(50) NULL;

IF COL_LENGTH(N'[dbo].[Software]', N'SerialLicenseKeyNotes') IS NULL
    ALTER TABLE [dbo].[Software] ADD [SerialLicenseKeyNotes] nvarchar(1000) NULL;

IF COL_LENGTH(N'[dbo].[Software]', N'HasBox') IS NULL
    ALTER TABLE [dbo].[Software] ADD [HasBox] bit NOT NULL CONSTRAINT [DF_Software_HasBox] DEFAULT (0);

IF COL_LENGTH(N'[dbo].[Software]', N'HasManual') IS NULL
    ALTER TABLE [dbo].[Software] ADD [HasManual] bit NOT NULL CONSTRAINT [DF_Software_HasManual] DEFAULT (0);

IF COL_LENGTH(N'[dbo].[Software]', N'HasDisc') IS NULL
    ALTER TABLE [dbo].[Software] ADD [HasDisc] bit NOT NULL CONSTRAINT [DF_Software_HasDisc] DEFAULT (0);

IF COL_LENGTH(N'[dbo].[Software]', N'Notes') IS NULL
    ALTER TABLE [dbo].[Software] ADD [Notes] nvarchar(2000) NULL;

IF NOT EXISTS (SELECT 1 FROM [dbo].[SoftwareLocation] WHERE [Location] = N'GOG')
    INSERT INTO [dbo].[SoftwareLocation] ([Location]) VALUES (N'GOG');
IF NOT EXISTS (SELECT 1 FROM [dbo].[SoftwareLocation] WHERE [Location] = N'Steam')
    INSERT INTO [dbo].[SoftwareLocation] ([Location]) VALUES (N'Steam');
IF NOT EXISTS (SELECT 1 FROM [dbo].[SoftwareLocation] WHERE [Location] = N'EA')
    INSERT INTO [dbo].[SoftwareLocation] ([Location]) VALUES (N'EA');
IF NOT EXISTS (SELECT 1 FROM [dbo].[SoftwareLocation] WHERE [Location] = N'Epic Games')
    INSERT INTO [dbo].[SoftwareLocation] ([Location]) VALUES (N'Epic Games');
IF NOT EXISTS (SELECT 1 FROM [dbo].[SoftwareLocation] WHERE [Location] = N'Microsoft')
    INSERT INTO [dbo].[SoftwareLocation] ([Location]) VALUES (N'Microsoft');
IF NOT EXISTS (SELECT 1 FROM [dbo].[SoftwareLocation] WHERE [Location] = N'Local')
    INSERT INTO [dbo].[SoftwareLocation] ([Location]) VALUES (N'Local');

IF NOT EXISTS (SELECT 1 FROM [dbo].[SoftwarePlatform] WHERE [Platform] = N'Windows')
    INSERT INTO [dbo].[SoftwarePlatform] ([Platform]) VALUES (N'Windows');
IF NOT EXISTS (SELECT 1 FROM [dbo].[SoftwarePlatform] WHERE [Platform] = N'Mac')
    INSERT INTO [dbo].[SoftwarePlatform] ([Platform]) VALUES (N'Mac');
IF NOT EXISTS (SELECT 1 FROM [dbo].[SoftwarePlatform] WHERE [Platform] = N'Linux')
    INSERT INTO [dbo].[SoftwarePlatform] ([Platform]) VALUES (N'Linux');
IF NOT EXISTS (SELECT 1 FROM [dbo].[SoftwarePlatform] WHERE [Platform] = N'DOS')
    INSERT INTO [dbo].[SoftwarePlatform] ([Platform]) VALUES (N'DOS');
IF NOT EXISTS (SELECT 1 FROM [dbo].[SoftwarePlatform] WHERE [Platform] = N'Web')
    INSERT INTO [dbo].[SoftwarePlatform] ([Platform]) VALUES (N'Web');

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Software_LocationID' AND object_id = OBJECT_ID(N'[dbo].[Software]'))
    CREATE INDEX [IX_Software_LocationID] ON [dbo].[Software] ([LocationID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Software_PlatformID' AND object_id = OBJECT_ID(N'[dbo].[Software]'))
    CREATE INDEX [IX_Software_PlatformID] ON [dbo].[Software] ([PlatformID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Software_StatusID' AND object_id = OBJECT_ID(N'[dbo].[Software]'))
    CREATE INDEX [IX_Software_StatusID] ON [dbo].[Software] ([StatusID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Software_Title' AND object_id = OBJECT_ID(N'[dbo].[Software]'))
    CREATE INDEX [IX_Software_Title] ON [dbo].[Software] ([Title]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_SoftwareLocation_Location' AND object_id = OBJECT_ID(N'[dbo].[SoftwareLocation]'))
    CREATE INDEX [IX_SoftwareLocation_Location] ON [dbo].[SoftwareLocation] ([Location]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_SoftwarePlatform_Platform' AND object_id = OBJECT_ID(N'[dbo].[SoftwarePlatform]'))
    CREATE INDEX [IX_SoftwarePlatform_Platform] ON [dbo].[SoftwarePlatform] ([Platform]);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_Software_SoftwareLocation_LocationID')
    ALTER TABLE [dbo].[Software] WITH NOCHECK ADD CONSTRAINT [FK_Software_SoftwareLocation_LocationID]
        FOREIGN KEY ([LocationID]) REFERENCES [dbo].[SoftwareLocation] ([ID]) ON DELETE SET NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_Software_SoftwarePlatform_PlatformID')
    ALTER TABLE [dbo].[Software] WITH NOCHECK ADD CONSTRAINT [FK_Software_SoftwarePlatform_PlatformID]
        FOREIGN KEY ([PlatformID]) REFERENCES [dbo].[SoftwarePlatform] ([ID]);
""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_Software_SoftwareLocation_LocationID')
    ALTER TABLE [dbo].[Software] DROP CONSTRAINT [FK_Software_SoftwareLocation_LocationID];

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_Software_SoftwarePlatform_PlatformID')
    ALTER TABLE [dbo].[Software] DROP CONSTRAINT [FK_Software_SoftwarePlatform_PlatformID];

IF EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Software_LocationID' AND object_id = OBJECT_ID(N'[dbo].[Software]'))
    DROP INDEX [IX_Software_LocationID] ON [dbo].[Software];

IF EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Software_PlatformID' AND object_id = OBJECT_ID(N'[dbo].[Software]'))
    DROP INDEX [IX_Software_PlatformID] ON [dbo].[Software];

IF EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Software_StatusID' AND object_id = OBJECT_ID(N'[dbo].[Software]'))
    DROP INDEX [IX_Software_StatusID] ON [dbo].[Software];

IF EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Software_Title' AND object_id = OBJECT_ID(N'[dbo].[Software]'))
    DROP INDEX [IX_Software_Title] ON [dbo].[Software];

IF EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_SoftwareLocation_Location' AND object_id = OBJECT_ID(N'[dbo].[SoftwareLocation]'))
    DROP INDEX [IX_SoftwareLocation_Location] ON [dbo].[SoftwareLocation];

IF EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_SoftwarePlatform_Platform' AND object_id = OBJECT_ID(N'[dbo].[SoftwarePlatform]'))
    DROP INDEX [IX_SoftwarePlatform_Platform] ON [dbo].[SoftwarePlatform];

IF OBJECT_ID(N'[dbo].[Software]', N'U') IS NOT NULL
BEGIN
    DECLARE @dropDefaultsSql nvarchar(max) = N'';

    SELECT @dropDefaultsSql = @dropDefaultsSql + N'ALTER TABLE [dbo].[Software] DROP CONSTRAINT [' + dc.[name] + N'];'
    FROM sys.default_constraints dc
    INNER JOIN sys.columns c
        ON c.default_object_id = dc.object_id
    WHERE dc.parent_object_id = OBJECT_ID(N'[dbo].[Software]')
        AND c.[name] IN (
            N'HasBox',
            N'HasManual',
            N'HasDisc'
        );

    IF @dropDefaultsSql <> N''
        EXEC sp_executesql @dropDefaultsSql;

    IF COL_LENGTH(N'[dbo].[Software]', N'LocationID') IS NOT NULL ALTER TABLE [dbo].[Software] DROP COLUMN [LocationID];
    IF COL_LENGTH(N'[dbo].[Software]', N'Publisher') IS NOT NULL ALTER TABLE [dbo].[Software] DROP COLUMN [Publisher];
    IF COL_LENGTH(N'[dbo].[Software]', N'Developer') IS NOT NULL ALTER TABLE [dbo].[Software] DROP COLUMN [Developer];
    IF COL_LENGTH(N'[dbo].[Software]', N'VersionEdition') IS NOT NULL ALTER TABLE [dbo].[Software] DROP COLUMN [VersionEdition];
    IF COL_LENGTH(N'[dbo].[Software]', N'MediaType') IS NOT NULL ALTER TABLE [dbo].[Software] DROP COLUMN [MediaType];
    IF COL_LENGTH(N'[dbo].[Software]', N'SerialLicenseKeyNotes') IS NOT NULL ALTER TABLE [dbo].[Software] DROP COLUMN [SerialLicenseKeyNotes];
    IF COL_LENGTH(N'[dbo].[Software]', N'HasBox') IS NOT NULL ALTER TABLE [dbo].[Software] DROP COLUMN [HasBox];
    IF COL_LENGTH(N'[dbo].[Software]', N'HasManual') IS NOT NULL ALTER TABLE [dbo].[Software] DROP COLUMN [HasManual];
    IF COL_LENGTH(N'[dbo].[Software]', N'HasDisc') IS NOT NULL ALTER TABLE [dbo].[Software] DROP COLUMN [HasDisc];
    IF COL_LENGTH(N'[dbo].[Software]', N'Notes') IS NOT NULL ALTER TABLE [dbo].[Software] DROP COLUMN [Notes];
END;
""");
        }
    }
}
