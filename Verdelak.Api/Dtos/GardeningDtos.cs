namespace Verdelak.Api.Dtos;

public record GardenSeedDto(
    int Id,
    string Name,
    string? Description,
    DateTime? PlantDate,
    bool Indoor,
    DateTime? SecondPlantDate,
    string? Notes,
    GardenSeedInventoryDto? Inventory
);

public record GardenSeedUpsertDto(
    string Name,
    string? Description,
    DateTime? PlantDate,
    bool Indoor,
    DateTime? SecondPlantDate,
    string? Notes
);

public record GardenSeedInventoryDto(int SeedId, short Qty, bool Reorder);

public record GardenSeedInventoryUpsertDto(short Qty, bool Reorder);

public record GardenSeedTrayDto(int Id, string TrayName, GardenSeedTrayDimensionDto? Dimensions);

public record GardenSeedTrayUpsertDto(string TrayName);

public record GardenSeedTrayDimensionDto(int Id, int TrayId, short SlotsWide, short SlotsDeep);

public record GardenSeedTrayDimensionUpsertDto(int TrayId, short SlotsWide, short SlotsDeep);

public record GardenSeedTrayPlantDto(
    int Id,
    int TrayId,
    int TraySlotId,
    int SeedId,
    string? SeedName,
    short Year,
    DateTime PlantDate,
    bool Success,
    bool Planning
);

public record GardenSeedTrayPlantUpsertDto(
    int TrayId,
    int TraySlotId,
    int SeedId,
    short Year,
    DateTime PlantDate,
    bool Success,
    bool Planning
);

public record GardenPlotDto(int Id, string GardenName, string? Description, GardenPlotDimensionDto? Dimensions);

public record GardenPlotUpsertDto(string GardenName, string? Description);

public record GardenPlotDimensionDto(int Id, short TraySlotsWide, short SlotsDeep, string? Notes);

public record GardenPlotDimensionUpsertDto(short TraySlotsWide, short SlotsDeep, string? Notes);

public record GardenPlotPlantDto(
    int Id,
    int GardenPlotId,
    int TraySlotId,
    int SeedId,
    string? SeedName,
    short Year,
    DateTime? PlantDate,
    bool Success,
    short? Qty,
    bool Planning
);

public record GardenPlotPlantUpsertDto(
    int GardenPlotId,
    int TraySlotId,
    int SeedId,
    short Year,
    DateTime? PlantDate,
    bool Success,
    short? Qty,
    bool Planning
);

public record GardenNoteDto(int Id, int GardenPlotId, string? Note, DateTime Date, short? Year);

public record GardenNoteUpsertDto(int GardenPlotId, string? Note, DateTime Date, short? Year);
public record GardenHarvestDto(
    int Id,
    int GardenPlotId,
    string? GardenPlotName,
    int SeedId,
    string? SeedName,
    DateTime HarvestDate,
    short? Year,
    decimal? Quantity,
    string? Notes
);

public record GardenHarvestUpsertDto(
    int GardenPlotId,
    int SeedId,
    DateTime HarvestDate,
    short? Year,
    decimal? Quantity,
    string? Notes
);

public record GardenHarvestReportDto(
    short? Year,
    int TotalCount,
    decimal TotalQuantity,
    IReadOnlyList<GardenHarvestMonthlySummaryDto> MonthlySummaries,
    IReadOnlyList<GardenHarvestCropSummaryDto> CropSummaries,
    IReadOnlyList<GardenHarvestAreaSummaryDto> AreaSummaries,
    IReadOnlyList<GardenHarvestDto> RecentHarvests
);

public record GardenHarvestMonthlySummaryDto(short? Year, int Month, string MonthName, int Count, decimal TotalQuantity, DateTime? LatestDate);

public record GardenHarvestCropSummaryDto(int SeedId, string SeedName, int Count, decimal TotalQuantity, DateTime? LatestDate);

public record GardenHarvestAreaSummaryDto(int GardenPlotId, string GardenPlotName, int Count, decimal TotalQuantity, DateTime? LatestDate);

public record GardenYearComparisonDto(
    short Year,
    short CompareYear,
    GardenYearSeasonSummaryDto Current,
    GardenYearSeasonSummaryDto Previous,
    GardenYearSeasonDeltaDto Delta,
    IReadOnlyList<GardenYearCropComparisonDto> CropComparisons,
    IReadOnlyList<GardenYearAreaComparisonDto> AreaComparisons
);

public record GardenYearSeasonSummaryDto(
    short Year,
    int CropCount,
    int TrayCells,
    int TrayStarted,
    int TrayPlanned,
    int BedCells,
    int BedPlanted,
    int BedPlanned,
    int SuccessfulPlantings,
    short PlannedQuantity,
    int HarvestEntries,
    decimal HarvestQuantity
);

public record GardenYearSeasonDeltaDto(
    int CropCount,
    int TrayCells,
    int BedCells,
    int SuccessfulPlantings,
    short PlannedQuantity,
    int HarvestEntries,
    decimal HarvestQuantity
);

public record GardenYearCropComparisonDto(
    int SeedId,
    string SeedName,
    int CurrentTrayCells,
    int PreviousTrayCells,
    int CurrentBedCells,
    int PreviousBedCells,
    short CurrentPlannedQuantity,
    short PreviousPlannedQuantity,
    decimal CurrentHarvestQuantity,
    decimal PreviousHarvestQuantity
);

public record GardenYearAreaComparisonDto(
    int GardenPlotId,
    string GardenPlotName,
    int CurrentBedCells,
    int PreviousBedCells,
    short CurrentPlannedQuantity,
    short PreviousPlannedQuantity,
    decimal CurrentHarvestQuantity,
    decimal PreviousHarvestQuantity
);
public record GardenNoteReportDto(
    short? Year,
    int TotalCount,
    IReadOnlyList<GardenNoteMonthlySummaryDto> MonthlySummaries,
    IReadOnlyList<GardenNoteAreaSummaryDto> AreaSummaries,
    IReadOnlyList<GardenNoteDto> RecentNotes
);

public record GardenNoteMonthlySummaryDto(short? Year, int Month, string MonthName, int Count, DateTime? LatestDate);

public record GardenNoteAreaSummaryDto(int GardenPlotId, string GardenPlotName, int Count, DateTime? LatestDate);
public record GardenSeedImportDto(string Csv, bool UpdateExisting);

public record GardenSeedImportResultDto(
    int Created,
    int Updated,
    int Skipped,
    IReadOnlyList<string> Errors,
    IReadOnlyList<GardenSeedImportRowResultDto> Rows);

public record GardenSeedImportRowResultDto(int RowNumber, string? Name, string Action, string Message);

public record GardenYearCopyRequestDto(short FromYear, short ToYear, int? ScopeId, bool OverwriteExisting);

public record GardenYearCopyResultDto(int Copied, int Skipped, int DeletedExisting);

public record GardenYearCopyPreviewDto(
    int SourceCount,
    int ExistingTargetCount,
    int WillCopy,
    int WillSkip,
    int WillDelete
);






