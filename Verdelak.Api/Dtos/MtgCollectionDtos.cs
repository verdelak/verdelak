namespace Verdelak.Api.Dtos;

public record MtgLookupDto(string Id, string Name);

public record MtgReportBucketDto(
    string Name,
    int RowCount,
    int OwnedCount,
    int WantedCount,
    int Copies,
    int FoilCopies,
    decimal EstimatedValue,
    int MissingImageCount);

public record MtgCleanupBucketDto(
    string Key,
    string Label,
    int Count,
    string Detail,
    string Tone);

public record MtgDuplicateClusterDto(
    string Key,
    string Label,
    string Name,
    string SetCode,
    string CollectorNumber,
    string WantStatusID,
    string? Condition,
    string? Language,
    string? Location,
    int RowCount,
    int Copies,
    string Locations);

public record MtgCollectionReportDto(
    int TotalRows,
    int TotalCopies,
    int TotalFoilCopies,
    int WantedRows,
    decimal EstimatedValue,
    int MissingImageRows,
    int MissingScryfallRows,
    int WeakPrintingRows,
    int MissingIdentityRows,
    int ZeroCopyOwnedRows,
    int MissingLocationRows,
    int CleanupIssueRows,
    int DuplicateClusterCount,
    IReadOnlyList<MtgReportBucketDto> SetBreakdown,
    IReadOnlyList<MtgReportBucketDto> ColorBreakdown,
    IReadOnlyList<MtgReportBucketDto> RarityBreakdown,
    IReadOnlyList<MtgReportBucketDto> LocationBreakdown,
    IReadOnlyList<MtgCleanupBucketDto> CleanupBuckets,
    IReadOnlyList<MtgDuplicateClusterDto> DuplicateClusters);

public record MtgCollectionItemDto(
    int Id,
    int CardId,
    string Name,
    string? ManaCost,
    string? Colors,
    string? ColorIdentity,
    string? TypeLine,
    string? OracleText,
    int PrintingId,
    string SetCode,
    string? SetName,
    string CollectorNumber,
    string? Rarity,
    string? Artist,
    string? ImageUrl,
    string? ScryfallId,
    string? Finishes,
    short Quantity,
    short FoilQuantity,
    string WantStatusID,
    string? Condition,
    string? Language,
    string? Location,
    string? Notes,
    decimal? EstimatedValue);

public record UpsertMtgCollectionItemDto(
    int? CardId,
    string Name,
    string? ManaCost,
    string? Colors,
    string? ColorIdentity,
    string? TypeLine,
    string? OracleText,
    int? PrintingId,
    string? SetCode,
    string? SetName,
    string? CollectorNumber,
    string? Rarity,
    string? Artist,
    string? ImageUrl,
    string? ScryfallId,
    string? Finishes,
    short? Quantity,
    short? FoilQuantity,
    string? WantStatusID,
    string? Condition,
    string? Language,
    string? Location,
    string? Notes,
    decimal? EstimatedValue);
