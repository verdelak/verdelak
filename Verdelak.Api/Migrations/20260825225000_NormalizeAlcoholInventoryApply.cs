using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Verdelak.Api.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeAlcoholInventoryApply : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
IF OBJECT_ID(N'[dbo].[AlcoholCategory]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AlcoholCategory] (
        [ID] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_AlcoholCategory] PRIMARY KEY,
        [Category] nvarchar(50) NOT NULL
    );
END;

IF OBJECT_ID(N'[dbo].[AlcoholType]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AlcoholType] (
        [ID] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_AlcoholType] PRIMARY KEY,
        [Type] nvarchar(50) NOT NULL,
        [CategoryID] int NULL
    );
END;

IF COL_LENGTH(N'dbo.AlcoholType', N'CategoryID') IS NULL
    ALTER TABLE [dbo].[AlcoholType] ADD [CategoryID] int NULL;

IF OBJECT_ID(N'[dbo].[AlcoholStyle]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AlcoholStyle] (
        [ID] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_AlcoholStyle] PRIMARY KEY,
        [Name] nvarchar(250) NOT NULL,
        [Description] nvarchar(2000) NULL,
        [TypeID] int NULL
    );
END;

IF COL_LENGTH(N'dbo.AlcoholStyle', N'Description') IS NOT NULL
    ALTER TABLE [dbo].[AlcoholStyle] ALTER COLUMN [Description] nvarchar(2000) NULL;

IF COL_LENGTH(N'dbo.AlcoholStyle', N'TypeID') IS NOT NULL
    ALTER TABLE [dbo].[AlcoholStyle] ALTER COLUMN [TypeID] int NULL;

IF OBJECT_ID(N'[dbo].[AlcoholRegion]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AlcoholRegion] (
        [ID] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_AlcoholRegion] PRIMARY KEY,
        [Region] nvarchar(150) NOT NULL,
        [Country] nvarchar(100) NULL
    );
END;

IF COL_LENGTH(N'dbo.AlcoholRegion', N'Country') IS NULL
    ALTER TABLE [dbo].[AlcoholRegion] ADD [Country] nvarchar(100) NULL;

IF COL_LENGTH(N'dbo.AlcoholRegion', N'Region') IS NOT NULL
    ALTER TABLE [dbo].[AlcoholRegion] ALTER COLUMN [Region] nvarchar(150) NOT NULL;

IF OBJECT_ID(N'[dbo].[AlcoholLocation]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AlcoholLocation] (
        [ID] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_AlcoholLocation] PRIMARY KEY,
        [Location] nvarchar(100) NOT NULL,
        [Notes] nvarchar(1000) NULL
    );
END;

IF OBJECT_ID(N'[dbo].[AlcoholProducts]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AlcoholProducts] (
        [ID] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_AlcoholProducts] PRIMARY KEY,
        [Product] nvarchar(200) NOT NULL
    );
END;

IF COL_LENGTH(N'dbo.AlcoholProducts', N'Product') IS NOT NULL
    ALTER TABLE [dbo].[AlcoholProducts] ALTER COLUMN [Product] nvarchar(200) NOT NULL;

IF COL_LENGTH(N'dbo.AlcoholProducts', N'CategoryID') IS NULL
    ALTER TABLE [dbo].[AlcoholProducts] ADD [CategoryID] int NULL;

IF COL_LENGTH(N'dbo.AlcoholProducts', N'TypeID') IS NULL
    ALTER TABLE [dbo].[AlcoholProducts] ADD [TypeID] int NULL;

IF COL_LENGTH(N'dbo.AlcoholProducts', N'StyleID') IS NULL
    ALTER TABLE [dbo].[AlcoholProducts] ADD [StyleID] int NULL;

IF COL_LENGTH(N'dbo.AlcoholProducts', N'RegionID') IS NULL
    ALTER TABLE [dbo].[AlcoholProducts] ADD [RegionID] int NULL;

IF COL_LENGTH(N'dbo.AlcoholProducts', N'Producer') IS NULL
    ALTER TABLE [dbo].[AlcoholProducts] ADD [Producer] nvarchar(200) NULL;

IF COL_LENGTH(N'dbo.AlcoholProducts', N'Variety') IS NULL
    ALTER TABLE [dbo].[AlcoholProducts] ADD [Variety] nvarchar(150) NULL;

IF COL_LENGTH(N'dbo.AlcoholProducts', N'Color') IS NULL
    ALTER TABLE [dbo].[AlcoholProducts] ADD [Color] nvarchar(50) NULL;

IF COL_LENGTH(N'dbo.AlcoholProducts', N'Country') IS NULL
    ALTER TABLE [dbo].[AlcoholProducts] ADD [Country] nvarchar(100) NULL;

IF COL_LENGTH(N'dbo.AlcoholProducts', N'VintageOrYear') IS NULL
    ALTER TABLE [dbo].[AlcoholProducts] ADD [VintageOrYear] nvarchar(50) NULL;

IF COL_LENGTH(N'dbo.AlcoholProducts', N'Size') IS NULL
    ALTER TABLE [dbo].[AlcoholProducts] ADD [Size] nvarchar(50) NULL;

IF COL_LENGTH(N'dbo.AlcoholProducts', N'Notes') IS NULL
    ALTER TABLE [dbo].[AlcoholProducts] ADD [Notes] nvarchar(2000) NULL;

IF COL_LENGTH(N'dbo.AlcoholProducts', N'SourceSheet') IS NULL
    ALTER TABLE [dbo].[AlcoholProducts] ADD [SourceSheet] nvarchar(100) NULL;

IF COL_LENGTH(N'dbo.AlcoholProducts', N'SourceRowLabel') IS NULL
    ALTER TABLE [dbo].[AlcoholProducts] ADD [SourceRowLabel] nvarchar(100) NULL;

IF OBJECT_ID(N'[dbo].[AlcoholCount]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AlcoholCount] (
        [ID] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_AlcoholCount] PRIMARY KEY,
        [AlcoholID] int NOT NULL,
        [LocationID] int NULL,
        [Qty] decimal(10,2) NOT NULL CONSTRAINT [DF_AlcoholCount_Qty] DEFAULT 0,
        [wantStatusID] char(1) NOT NULL CONSTRAINT [DF_AlcoholCount_wantStatusID] DEFAULT 'H'
    );
END;

IF COL_LENGTH(N'dbo.AlcoholCount', N'Qty') IS NOT NULL
    ALTER TABLE [dbo].[AlcoholCount] ALTER COLUMN [Qty] decimal(10,2) NOT NULL;

IF COL_LENGTH(N'dbo.AlcoholCount', N'LocationID') IS NOT NULL
    ALTER TABLE [dbo].[AlcoholCount] ALTER COLUMN [LocationID] int NULL;

IF COL_LENGTH(N'dbo.AlcoholCount', N'Notes') IS NULL
    ALTER TABLE [dbo].[AlcoholCount] ADD [Notes] nvarchar(1000) NULL;

IF OBJECT_ID(N'[dbo].[AlcoholRating]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AlcoholRating] (
        [ID] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_AlcoholRating] PRIMARY KEY,
        [AlcoholID] int NOT NULL,
        [Rating] decimal(6,2) NULL
    );
END;

IF COL_LENGTH(N'dbo.AlcoholRating', N'Notes') IS NULL
    ALTER TABLE [dbo].[AlcoholRating] ADD [Notes] nvarchar(1000) NULL;

IF COL_LENGTH(N'dbo.AlcoholRating', N'Rating') IS NOT NULL
    ALTER TABLE [dbo].[AlcoholRating] ALTER COLUMN [Rating] decimal(6,2) NULL;

IF OBJECT_ID(N'[dbo].[AlcoholValue]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[AlcoholValue] (
        [ID] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_AlcoholValue] PRIMARY KEY,
        [AlcoholID] int NOT NULL,
        [StoreID] int NULL,
        [Price] money NOT NULL,
        [AsOfDate] datetime2 NULL,
        [Notes] nvarchar(1000) NULL
    );
END;

IF COL_LENGTH(N'dbo.AlcoholValue', N'StoreID') IS NOT NULL
    ALTER TABLE [dbo].[AlcoholValue] ALTER COLUMN [StoreID] int NULL;

IF COL_LENGTH(N'dbo.AlcoholValue', N'AsOfDate') IS NULL
    ALTER TABLE [dbo].[AlcoholValue] ADD [AsOfDate] datetime2 NULL;

IF COL_LENGTH(N'dbo.AlcoholValue', N'Notes') IS NULL
    ALTER TABLE [dbo].[AlcoholValue] ADD [Notes] nvarchar(1000) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE [type] = N'PK' AND parent_object_id = OBJECT_ID(N'[dbo].[AlcoholCategory]'))
    ALTER TABLE [dbo].[AlcoholCategory] ADD CONSTRAINT [PK_AlcoholCategory] PRIMARY KEY CLUSTERED ([ID]);

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE [type] = N'PK' AND parent_object_id = OBJECT_ID(N'[dbo].[AlcoholType]'))
    ALTER TABLE [dbo].[AlcoholType] ADD CONSTRAINT [PK_AlcoholType] PRIMARY KEY CLUSTERED ([ID]);

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE [type] = N'PK' AND parent_object_id = OBJECT_ID(N'[dbo].[AlcoholStyle]'))
    ALTER TABLE [dbo].[AlcoholStyle] ADD CONSTRAINT [PK_AlcoholStyle] PRIMARY KEY CLUSTERED ([ID]);

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE [type] = N'PK' AND parent_object_id = OBJECT_ID(N'[dbo].[AlcoholRegion]'))
    ALTER TABLE [dbo].[AlcoholRegion] ADD CONSTRAINT [PK_AlcoholRegion] PRIMARY KEY CLUSTERED ([ID]);

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE [type] = N'PK' AND parent_object_id = OBJECT_ID(N'[dbo].[AlcoholLocation]'))
    ALTER TABLE [dbo].[AlcoholLocation] ADD CONSTRAINT [PK_AlcoholLocation] PRIMARY KEY CLUSTERED ([ID]);

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE [type] = N'PK' AND parent_object_id = OBJECT_ID(N'[dbo].[AlcoholProducts]'))
    ALTER TABLE [dbo].[AlcoholProducts] ADD CONSTRAINT [PK_AlcoholProducts] PRIMARY KEY CLUSTERED ([ID]);

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE [type] = N'PK' AND parent_object_id = OBJECT_ID(N'[dbo].[AlcoholCount]'))
    ALTER TABLE [dbo].[AlcoholCount] ADD CONSTRAINT [PK_AlcoholCount] PRIMARY KEY CLUSTERED ([ID]);

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE [type] = N'PK' AND parent_object_id = OBJECT_ID(N'[dbo].[AlcoholRating]'))
    ALTER TABLE [dbo].[AlcoholRating] ADD CONSTRAINT [PK_AlcoholRating] PRIMARY KEY CLUSTERED ([ID]);

IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE [type] = N'PK' AND parent_object_id = OBJECT_ID(N'[dbo].[AlcoholValue]'))
    ALTER TABLE [dbo].[AlcoholValue] ADD CONSTRAINT [PK_AlcoholValue] PRIMARY KEY CLUSTERED ([ID]);
""");

            migrationBuilder.Sql("""
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholCategory_Category' AND object_id = OBJECT_ID(N'[dbo].[AlcoholCategory]'))
    CREATE UNIQUE INDEX [IX_AlcoholCategory_Category] ON [dbo].[AlcoholCategory] ([Category]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholType_CategoryID_Type' AND object_id = OBJECT_ID(N'[dbo].[AlcoholType]'))
    CREATE UNIQUE INDEX [IX_AlcoholType_CategoryID_Type] ON [dbo].[AlcoholType] ([CategoryID], [Type]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholStyle_TypeID_Name' AND object_id = OBJECT_ID(N'[dbo].[AlcoholStyle]'))
    CREATE UNIQUE INDEX [IX_AlcoholStyle_TypeID_Name] ON [dbo].[AlcoholStyle] ([TypeID], [Name]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholRegion_Country_Region' AND object_id = OBJECT_ID(N'[dbo].[AlcoholRegion]'))
    CREATE UNIQUE INDEX [IX_AlcoholRegion_Country_Region] ON [dbo].[AlcoholRegion] ([Country], [Region]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholLocation_Location' AND object_id = OBJECT_ID(N'[dbo].[AlcoholLocation]'))
    CREATE UNIQUE INDEX [IX_AlcoholLocation_Location] ON [dbo].[AlcoholLocation] ([Location]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholProducts_Product' AND object_id = OBJECT_ID(N'[dbo].[AlcoholProducts]'))
    CREATE INDEX [IX_AlcoholProducts_Product] ON [dbo].[AlcoholProducts] ([Product]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholProducts_CategoryID' AND object_id = OBJECT_ID(N'[dbo].[AlcoholProducts]'))
    CREATE INDEX [IX_AlcoholProducts_CategoryID] ON [dbo].[AlcoholProducts] ([CategoryID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholProducts_TypeID' AND object_id = OBJECT_ID(N'[dbo].[AlcoholProducts]'))
    CREATE INDEX [IX_AlcoholProducts_TypeID] ON [dbo].[AlcoholProducts] ([TypeID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholProducts_StyleID' AND object_id = OBJECT_ID(N'[dbo].[AlcoholProducts]'))
    CREATE INDEX [IX_AlcoholProducts_StyleID] ON [dbo].[AlcoholProducts] ([StyleID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholProducts_RegionID' AND object_id = OBJECT_ID(N'[dbo].[AlcoholProducts]'))
    CREATE INDEX [IX_AlcoholProducts_RegionID] ON [dbo].[AlcoholProducts] ([RegionID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholCount_AlcoholID' AND object_id = OBJECT_ID(N'[dbo].[AlcoholCount]'))
    CREATE INDEX [IX_AlcoholCount_AlcoholID] ON [dbo].[AlcoholCount] ([AlcoholID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholCount_LocationID' AND object_id = OBJECT_ID(N'[dbo].[AlcoholCount]'))
    CREATE INDEX [IX_AlcoholCount_LocationID] ON [dbo].[AlcoholCount] ([LocationID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholCount_wantStatusID' AND object_id = OBJECT_ID(N'[dbo].[AlcoholCount]'))
    CREATE INDEX [IX_AlcoholCount_wantStatusID] ON [dbo].[AlcoholCount] ([wantStatusID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholRating_AlcoholID' AND object_id = OBJECT_ID(N'[dbo].[AlcoholRating]'))
    CREATE INDEX [IX_AlcoholRating_AlcoholID] ON [dbo].[AlcoholRating] ([AlcoholID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholValue_AlcoholID' AND object_id = OBJECT_ID(N'[dbo].[AlcoholValue]'))
    CREATE INDEX [IX_AlcoholValue_AlcoholID] ON [dbo].[AlcoholValue] ([AlcoholID]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_AlcoholValue_StoreID' AND object_id = OBJECT_ID(N'[dbo].[AlcoholValue]'))
    CREATE INDEX [IX_AlcoholValue_StoreID] ON [dbo].[AlcoholValue] ([StoreID]);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholType_AlcoholCategory_CategoryID')
    ALTER TABLE [dbo].[AlcoholType] ADD CONSTRAINT [FK_AlcoholType_AlcoholCategory_CategoryID] FOREIGN KEY ([CategoryID]) REFERENCES [dbo].[AlcoholCategory] ([ID]) ON DELETE SET NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholStyle_AlcoholType_TypeID')
    ALTER TABLE [dbo].[AlcoholStyle] ADD CONSTRAINT [FK_AlcoholStyle_AlcoholType_TypeID] FOREIGN KEY ([TypeID]) REFERENCES [dbo].[AlcoholType] ([ID]) ON DELETE SET NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholProducts_AlcoholCategory_CategoryID')
    ALTER TABLE [dbo].[AlcoholProducts] ADD CONSTRAINT [FK_AlcoholProducts_AlcoholCategory_CategoryID] FOREIGN KEY ([CategoryID]) REFERENCES [dbo].[AlcoholCategory] ([ID]) ON DELETE SET NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholProducts_AlcoholType_TypeID')
    ALTER TABLE [dbo].[AlcoholProducts] ADD CONSTRAINT [FK_AlcoholProducts_AlcoholType_TypeID] FOREIGN KEY ([TypeID]) REFERENCES [dbo].[AlcoholType] ([ID]) ON DELETE SET NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholProducts_AlcoholStyle_StyleID')
    ALTER TABLE [dbo].[AlcoholProducts] ADD CONSTRAINT [FK_AlcoholProducts_AlcoholStyle_StyleID] FOREIGN KEY ([StyleID]) REFERENCES [dbo].[AlcoholStyle] ([ID]) ON DELETE SET NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholProducts_AlcoholRegion_RegionID')
    ALTER TABLE [dbo].[AlcoholProducts] ADD CONSTRAINT [FK_AlcoholProducts_AlcoholRegion_RegionID] FOREIGN KEY ([RegionID]) REFERENCES [dbo].[AlcoholRegion] ([ID]) ON DELETE SET NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholCount_AlcoholProducts_AlcoholID')
    ALTER TABLE [dbo].[AlcoholCount] ADD CONSTRAINT [FK_AlcoholCount_AlcoholProducts_AlcoholID] FOREIGN KEY ([AlcoholID]) REFERENCES [dbo].[AlcoholProducts] ([ID]) ON DELETE CASCADE;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholCount_AlcoholLocation_LocationID')
    ALTER TABLE [dbo].[AlcoholCount] ADD CONSTRAINT [FK_AlcoholCount_AlcoholLocation_LocationID] FOREIGN KEY ([LocationID]) REFERENCES [dbo].[AlcoholLocation] ([ID]) ON DELETE SET NULL;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholRating_AlcoholProducts_AlcoholID')
    ALTER TABLE [dbo].[AlcoholRating] ADD CONSTRAINT [FK_AlcoholRating_AlcoholProducts_AlcoholID] FOREIGN KEY ([AlcoholID]) REFERENCES [dbo].[AlcoholProducts] ([ID]) ON DELETE CASCADE;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholValue_AlcoholProducts_AlcoholID')
    ALTER TABLE [dbo].[AlcoholValue] ADD CONSTRAINT [FK_AlcoholValue_AlcoholProducts_AlcoholID] FOREIGN KEY ([AlcoholID]) REFERENCES [dbo].[AlcoholProducts] ([ID]) ON DELETE CASCADE;
""");

            migrationBuilder.Sql("""
IF NOT EXISTS (SELECT 1 FROM [dbo].[AlcoholProducts])
   AND EXISTS (SELECT 1 FROM [dbo].[AlcoholItems])
BEGIN
    INSERT INTO [dbo].[AlcoholCategory] ([Category])
    SELECT DISTINCT LTRIM(RTRIM([Category]))
    FROM [dbo].[AlcoholItems] i
    WHERE NULLIF(LTRIM(RTRIM(i.[Category])), N'') IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM [dbo].[AlcoholCategory] c
          WHERE c.[Category] = LTRIM(RTRIM(i.[Category]))
      );

    INSERT INTO [dbo].[AlcoholLocation] ([Location])
    SELECT DISTINCT COALESCE(NULLIF(LTRIM(RTRIM([Location])), N''), N'No location')
    FROM [dbo].[AlcoholItems] i
    WHERE NOT EXISTS (
          SELECT 1 FROM [dbo].[AlcoholLocation] l
          WHERE l.[Location] = COALESCE(NULLIF(LTRIM(RTRIM(i.[Location])), N''), N'No location')
      );

    INSERT INTO [dbo].[AlcoholType] ([Type], [CategoryID])
    SELECT DISTINCT LTRIM(RTRIM(i.[Type])), c.[ID]
    FROM [dbo].[AlcoholItems] i
    LEFT JOIN [dbo].[AlcoholCategory] c ON c.[Category] = LTRIM(RTRIM(i.[Category]))
    WHERE NULLIF(LTRIM(RTRIM(i.[Type])), N'') IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM [dbo].[AlcoholType] t
          WHERE t.[Type] = LTRIM(RTRIM(i.[Type]))
            AND ISNULL(t.[CategoryID], -1) = ISNULL(c.[ID], -1)
      );

    INSERT INTO [dbo].[AlcoholStyle] ([Name], [TypeID])
    SELECT DISTINCT LTRIM(RTRIM(i.[Style])), t.[ID]
    FROM [dbo].[AlcoholItems] i
    LEFT JOIN [dbo].[AlcoholCategory] c ON c.[Category] = LTRIM(RTRIM(i.[Category]))
    LEFT JOIN [dbo].[AlcoholType] t
        ON t.[Type] = LTRIM(RTRIM(i.[Type]))
       AND ISNULL(t.[CategoryID], -1) = ISNULL(c.[ID], -1)
    WHERE NULLIF(LTRIM(RTRIM(i.[Style])), N'') IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM [dbo].[AlcoholStyle] s
          WHERE s.[Name] = LTRIM(RTRIM(i.[Style]))
            AND ISNULL(s.[TypeID], -1) = ISNULL(t.[ID], -1)
      );

    INSERT INTO [dbo].[AlcoholRegion] ([Region], [Country])
    SELECT DISTINCT LTRIM(RTRIM(i.[Region])), NULLIF(LTRIM(RTRIM(i.[Country])), N'')
    FROM [dbo].[AlcoholItems] i
    WHERE NULLIF(LTRIM(RTRIM(i.[Region])), N'') IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM [dbo].[AlcoholRegion] r
          WHERE r.[Region] = LTRIM(RTRIM(i.[Region]))
            AND ISNULL(r.[Country], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Country])), N''), N'')
      );

    ;WITH ProductSource AS (
        SELECT
            LTRIM(RTRIM(i.[Name])) AS [Product],
            c.[ID] AS [CategoryID],
            t.[ID] AS [TypeID],
            s.[ID] AS [StyleID],
            r.[ID] AS [RegionID],
            NULLIF(LTRIM(RTRIM(i.[Producer])), N'') AS [Producer],
            NULLIF(LTRIM(RTRIM(i.[Variety])), N'') AS [Variety],
            NULLIF(LTRIM(RTRIM(i.[Color])), N'') AS [Color],
            NULLIF(LTRIM(RTRIM(i.[Country])), N'') AS [Country],
            NULLIF(LTRIM(RTRIM(i.[VintageOrYear])), N'') AS [VintageOrYear],
            NULLIF(LTRIM(RTRIM(i.[Size])), N'') AS [Size],
            MIN(NULLIF(LTRIM(RTRIM(i.[Notes])), N'')) AS [Notes],
            MIN(NULLIF(LTRIM(RTRIM(i.[SourceSheet])), N'')) AS [SourceSheet],
            MIN(NULLIF(LTRIM(RTRIM(i.[SourceRowLabel])), N'')) AS [SourceRowLabel]
        FROM [dbo].[AlcoholItems] i
        LEFT JOIN [dbo].[AlcoholCategory] c ON c.[Category] = LTRIM(RTRIM(i.[Category]))
        LEFT JOIN [dbo].[AlcoholType] t
            ON t.[Type] = LTRIM(RTRIM(i.[Type]))
           AND ISNULL(t.[CategoryID], -1) = ISNULL(c.[ID], -1)
        LEFT JOIN [dbo].[AlcoholStyle] s
            ON s.[Name] = LTRIM(RTRIM(i.[Style]))
           AND ISNULL(s.[TypeID], -1) = ISNULL(t.[ID], -1)
        LEFT JOIN [dbo].[AlcoholRegion] r
            ON r.[Region] = LTRIM(RTRIM(i.[Region]))
           AND ISNULL(r.[Country], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Country])), N''), N'')
        WHERE NULLIF(LTRIM(RTRIM(i.[Name])), N'') IS NOT NULL
        GROUP BY
            LTRIM(RTRIM(i.[Name])),
            c.[ID],
            t.[ID],
            s.[ID],
            r.[ID],
            NULLIF(LTRIM(RTRIM(i.[Producer])), N''),
            NULLIF(LTRIM(RTRIM(i.[Variety])), N''),
            NULLIF(LTRIM(RTRIM(i.[Color])), N''),
            NULLIF(LTRIM(RTRIM(i.[Country])), N''),
            NULLIF(LTRIM(RTRIM(i.[VintageOrYear])), N''),
            NULLIF(LTRIM(RTRIM(i.[Size])), N'')
    )
    INSERT INTO [dbo].[AlcoholProducts] (
        [Product],
        [CategoryID],
        [TypeID],
        [StyleID],
        [RegionID],
        [Producer],
        [Variety],
        [Color],
        [Country],
        [VintageOrYear],
        [Size],
        [Notes],
        [SourceSheet],
        [SourceRowLabel]
    )
    SELECT
        [Product],
        [CategoryID],
        [TypeID],
        [StyleID],
        [RegionID],
        [Producer],
        [Variety],
        [Color],
        [Country],
        [VintageOrYear],
        [Size],
        [Notes],
        [SourceSheet],
        [SourceRowLabel]
    FROM ProductSource;

    ;WITH ItemMatches AS (
        SELECT
            p.[ID] AS [AlcoholID],
            l.[ID] AS [LocationID],
            CAST(COALESCE(i.[QuantityOnHand], 0) AS decimal(10,2)) AS [Qty],
            CAST(CASE WHEN i.[StatusID] IN ('H', 'W') THEN i.[StatusID] ELSE 'H' END AS char(1)) AS [StatusID],
            NULLIF(LTRIM(RTRIM(i.[Notes])), N'') AS [Notes]
        FROM [dbo].[AlcoholItems] i
        LEFT JOIN [dbo].[AlcoholCategory] c ON c.[Category] = LTRIM(RTRIM(i.[Category]))
        LEFT JOIN [dbo].[AlcoholType] t
            ON t.[Type] = LTRIM(RTRIM(i.[Type]))
           AND ISNULL(t.[CategoryID], -1) = ISNULL(c.[ID], -1)
        LEFT JOIN [dbo].[AlcoholStyle] s
            ON s.[Name] = LTRIM(RTRIM(i.[Style]))
           AND ISNULL(s.[TypeID], -1) = ISNULL(t.[ID], -1)
        LEFT JOIN [dbo].[AlcoholRegion] r
            ON r.[Region] = LTRIM(RTRIM(i.[Region]))
           AND ISNULL(r.[Country], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Country])), N''), N'')
        INNER JOIN [dbo].[AlcoholProducts] p
            ON p.[Product] = LTRIM(RTRIM(i.[Name]))
           AND ISNULL(p.[CategoryID], -1) = ISNULL(c.[ID], -1)
           AND ISNULL(p.[TypeID], -1) = ISNULL(t.[ID], -1)
           AND ISNULL(p.[StyleID], -1) = ISNULL(s.[ID], -1)
           AND ISNULL(p.[RegionID], -1) = ISNULL(r.[ID], -1)
           AND ISNULL(p.[Producer], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Producer])), N''), N'')
           AND ISNULL(p.[Variety], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Variety])), N''), N'')
           AND ISNULL(p.[Color], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Color])), N''), N'')
           AND ISNULL(p.[Country], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Country])), N''), N'')
           AND ISNULL(p.[VintageOrYear], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[VintageOrYear])), N''), N'')
           AND ISNULL(p.[Size], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Size])), N''), N'')
        INNER JOIN [dbo].[AlcoholLocation] l
            ON l.[Location] = COALESCE(NULLIF(LTRIM(RTRIM(i.[Location])), N''), N'No location')
    )
    INSERT INTO [dbo].[AlcoholCount] ([AlcoholID], [LocationID], [Qty], [wantStatusID], [Notes])
    SELECT [AlcoholID], [LocationID], SUM([Qty]), [StatusID], MIN([Notes])
    FROM ItemMatches
    GROUP BY [AlcoholID], [LocationID], [StatusID];

    ;WITH ProductMatches AS (
        SELECT
            i.[Rating],
            i.[Price],
            p.[ID] AS [AlcoholID]
        FROM [dbo].[AlcoholItems] i
        LEFT JOIN [dbo].[AlcoholCategory] c ON c.[Category] = LTRIM(RTRIM(i.[Category]))
        LEFT JOIN [dbo].[AlcoholType] t
            ON t.[Type] = LTRIM(RTRIM(i.[Type]))
           AND ISNULL(t.[CategoryID], -1) = ISNULL(c.[ID], -1)
        LEFT JOIN [dbo].[AlcoholStyle] s
            ON s.[Name] = LTRIM(RTRIM(i.[Style]))
           AND ISNULL(s.[TypeID], -1) = ISNULL(t.[ID], -1)
        LEFT JOIN [dbo].[AlcoholRegion] r
            ON r.[Region] = LTRIM(RTRIM(i.[Region]))
           AND ISNULL(r.[Country], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Country])), N''), N'')
        INNER JOIN [dbo].[AlcoholProducts] p
            ON p.[Product] = LTRIM(RTRIM(i.[Name]))
           AND ISNULL(p.[CategoryID], -1) = ISNULL(c.[ID], -1)
           AND ISNULL(p.[TypeID], -1) = ISNULL(t.[ID], -1)
           AND ISNULL(p.[StyleID], -1) = ISNULL(s.[ID], -1)
           AND ISNULL(p.[RegionID], -1) = ISNULL(r.[ID], -1)
           AND ISNULL(p.[Producer], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Producer])), N''), N'')
           AND ISNULL(p.[Variety], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Variety])), N''), N'')
           AND ISNULL(p.[Color], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Color])), N''), N'')
           AND ISNULL(p.[Country], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Country])), N''), N'')
           AND ISNULL(p.[VintageOrYear], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[VintageOrYear])), N''), N'')
           AND ISNULL(p.[Size], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Size])), N''), N'')
    )
    INSERT INTO [dbo].[AlcoholRating] ([AlcoholID], [Rating])
    SELECT DISTINCT [AlcoholID], CAST([Rating] AS decimal(6,2))
    FROM ProductMatches
    WHERE [Rating] IS NOT NULL;

    ;WITH ProductMatches AS (
        SELECT
            i.[Rating],
            i.[Price],
            p.[ID] AS [AlcoholID]
        FROM [dbo].[AlcoholItems] i
        LEFT JOIN [dbo].[AlcoholCategory] c ON c.[Category] = LTRIM(RTRIM(i.[Category]))
        LEFT JOIN [dbo].[AlcoholType] t
            ON t.[Type] = LTRIM(RTRIM(i.[Type]))
           AND ISNULL(t.[CategoryID], -1) = ISNULL(c.[ID], -1)
        LEFT JOIN [dbo].[AlcoholStyle] s
            ON s.[Name] = LTRIM(RTRIM(i.[Style]))
           AND ISNULL(s.[TypeID], -1) = ISNULL(t.[ID], -1)
        LEFT JOIN [dbo].[AlcoholRegion] r
            ON r.[Region] = LTRIM(RTRIM(i.[Region]))
           AND ISNULL(r.[Country], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Country])), N''), N'')
        INNER JOIN [dbo].[AlcoholProducts] p
            ON p.[Product] = LTRIM(RTRIM(i.[Name]))
           AND ISNULL(p.[CategoryID], -1) = ISNULL(c.[ID], -1)
           AND ISNULL(p.[TypeID], -1) = ISNULL(t.[ID], -1)
           AND ISNULL(p.[StyleID], -1) = ISNULL(s.[ID], -1)
           AND ISNULL(p.[RegionID], -1) = ISNULL(r.[ID], -1)
           AND ISNULL(p.[Producer], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Producer])), N''), N'')
           AND ISNULL(p.[Variety], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Variety])), N''), N'')
           AND ISNULL(p.[Color], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Color])), N''), N'')
           AND ISNULL(p.[Country], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Country])), N''), N'')
           AND ISNULL(p.[VintageOrYear], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[VintageOrYear])), N''), N'')
           AND ISNULL(p.[Size], N'') = ISNULL(NULLIF(LTRIM(RTRIM(i.[Size])), N''), N'')
    )
    INSERT INTO [dbo].[AlcoholValue] ([AlcoholID], [Price])
    SELECT DISTINCT [AlcoholID], CAST([Price] AS money)
    FROM ProductMatches
    WHERE [Price] IS NOT NULL;
END;
""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholValue_AlcoholProducts_AlcoholID')
    ALTER TABLE [dbo].[AlcoholValue] DROP CONSTRAINT [FK_AlcoholValue_AlcoholProducts_AlcoholID];

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholRating_AlcoholProducts_AlcoholID')
    ALTER TABLE [dbo].[AlcoholRating] DROP CONSTRAINT [FK_AlcoholRating_AlcoholProducts_AlcoholID];

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholCount_AlcoholLocation_LocationID')
    ALTER TABLE [dbo].[AlcoholCount] DROP CONSTRAINT [FK_AlcoholCount_AlcoholLocation_LocationID];

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholCount_AlcoholProducts_AlcoholID')
    ALTER TABLE [dbo].[AlcoholCount] DROP CONSTRAINT [FK_AlcoholCount_AlcoholProducts_AlcoholID];

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholProducts_AlcoholRegion_RegionID')
    ALTER TABLE [dbo].[AlcoholProducts] DROP CONSTRAINT [FK_AlcoholProducts_AlcoholRegion_RegionID];

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholProducts_AlcoholStyle_StyleID')
    ALTER TABLE [dbo].[AlcoholProducts] DROP CONSTRAINT [FK_AlcoholProducts_AlcoholStyle_StyleID];

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholProducts_AlcoholType_TypeID')
    ALTER TABLE [dbo].[AlcoholProducts] DROP CONSTRAINT [FK_AlcoholProducts_AlcoholType_TypeID];

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholProducts_AlcoholCategory_CategoryID')
    ALTER TABLE [dbo].[AlcoholProducts] DROP CONSTRAINT [FK_AlcoholProducts_AlcoholCategory_CategoryID];

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholStyle_AlcoholType_TypeID')
    ALTER TABLE [dbo].[AlcoholStyle] DROP CONSTRAINT [FK_AlcoholStyle_AlcoholType_TypeID];

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_AlcoholType_AlcoholCategory_CategoryID')
    ALTER TABLE [dbo].[AlcoholType] DROP CONSTRAINT [FK_AlcoholType_AlcoholCategory_CategoryID];

IF OBJECT_ID(N'[dbo].[AlcoholLocation]', N'U') IS NOT NULL
    DROP TABLE [dbo].[AlcoholLocation];
""");
        }
    }
}
