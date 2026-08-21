namespace Verdelak.Api.Dtos;

public record SoftwareLookupDto(int Id, string Name);

public record SoftwareItemDto(
    int Id,
    string Title,
    string StatusID,
    int PlatformId,
    string Platform,
    int? LocationId,
    string? Location,
    string? Publisher,
    string? Developer,
    string? VersionEdition,
    string? MediaType,
    string? SerialLicenseKeyNotes,
    bool HasBox,
    bool HasManual,
    bool HasDisc,
    string? Notes);

public record UpsertSoftwareItemDto(
    string Title,
    string? StatusID,
    int? PlatformId,
    int? LocationId,
    string? Publisher,
    string? Developer,
    string? VersionEdition,
    string? MediaType,
    string? SerialLicenseKeyNotes,
    bool? HasBox,
    bool? HasManual,
    bool? HasDisc,
    string? Notes);

public record SoftwareReportSummaryDto(
    int OwnedCount,
    int WantedCount,
    int UnknownStatusCount,
    IEnumerable<SoftwareReportBucketDto> ByPlatform,
    IEnumerable<SoftwareReportBucketDto> ByLocation);

public record SoftwareReportBucketDto(
    int? Id,
    string Name,
    int OwnedCount,
    int WantedCount,
    int UnknownStatusCount);

public record SoftwareBulkImportRequestDto(
    string Text,
    int? DefaultPlatformId,
    int? DefaultLocationId,
    string? DefaultStatusID,
    bool HasHeader,
    IEnumerable<SoftwareBulkImportRowDecisionDto>? RowDecisions = null);

public record SoftwareBulkImportPreviewDto(
    int TotalRows,
    int ReadyCount,
    int SkipCount,
    int ErrorCount,
    IEnumerable<SoftwareBulkImportPreviewRowDto> Rows);

public record SoftwareBulkImportPreviewRowDto(
    int RowNumber,
    string RawText,
    string? Title,
    string StatusID,
    int? PlatformId,
    string? Platform,
    int? LocationId,
    string? Location,
    string Action,
    int? ExistingId,
    IEnumerable<SoftwareBulkImportMatchDto> Matches,
    IEnumerable<string> Messages);

public record SoftwareBulkImportMatchDto(
    int Id,
    string Title,
    string StatusID,
    int PlatformId,
    string Platform,
    int? LocationId,
    string? Location,
    string MatchType);

public record SoftwareBulkImportRowDecisionDto(
    int RowNumber,
    string Action,
    int? ExistingId);

public record SoftwareBulkImportCommitResultDto(
    int CreatedCount,
    int UpdatedCount,
    int SkippedCount,
    int ErrorCount,
    IEnumerable<SoftwareBulkImportPreviewRowDto> Rows);

