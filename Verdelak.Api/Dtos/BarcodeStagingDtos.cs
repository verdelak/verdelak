namespace Verdelak.Api.Dtos;

public sealed class BarcodeStagingItemDto
{
    public int Id { get; set; }
    public string Upc { get; set; } = string.Empty;
    public string NormalizedCode { get; set; } = string.Empty;
    public string CodeType { get; set; } = "Unknown";
    public string Source { get; set; } = "Manual";
    public string? BatchName { get; set; }
    public string ItemType { get; set; } = "Unknown";
    public string Status { get; set; } = "New";
    public string? SuggestedTitle { get; set; }
    public string? SuggestedCreator { get; set; }
    public string? SuggestedFormat { get; set; }
    public string? SuggestedYear { get; set; }
    public string? LookupProvider { get; set; }
    public decimal? Confidence { get; set; }
    public string? Notes { get; set; }
    public string? ImportedEntityType { get; set; }
    public int? ImportedEntityId { get; set; }
    public DateTime? ImportedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}

public sealed class BarcodeStagingCreateRequest
{
    public string? BatchName { get; set; }
    public string? Source { get; set; }
    public IReadOnlyList<string> Upcs { get; set; } = [];
}

public sealed class BarcodeStagingUpdateRequest
{
    public string ItemType { get; set; } = "Unknown";
    public string Status { get; set; } = "New";
    public string? SuggestedTitle { get; set; }
    public string? SuggestedCreator { get; set; }
    public string? SuggestedFormat { get; set; }
    public string? SuggestedYear { get; set; }
    public string? LookupProvider { get; set; }
    public decimal? Confidence { get; set; }
    public string? Notes { get; set; }
}

public sealed class BarcodeStagingBatchUpdateRequest
{
    public IReadOnlyList<int> Ids { get; set; } = [];
    public string? ItemType { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
}

public sealed class BarcodeStagingBatchLookupRequest
{
    public IReadOnlyList<int> Ids { get; set; } = [];
    public string? BatchName { get; set; }
    public string? Source { get; set; }
    public string Provider { get; set; } = "Auto";
    public bool RetryMissingOnly { get; set; }
    public bool FallbackProvidersOnly { get; set; }
}

public sealed class BarcodeStagingBatchResultDto
{
    public int RequestedCount { get; set; }
    public int UpdatedCount { get; set; }
    public int LookupAttemptedCount { get; set; }
    public int MatchedCount { get; set; }
    public int NeedsReviewCount { get; set; }
    public IReadOnlyList<string> Messages { get; set; } = [];
}

public sealed class BarcodeStagingDuplicateGroupDto
{
    public string NormalizedCode { get; set; } = string.Empty;
    public string CodeType { get; set; } = "Unknown";
    public int Count { get; set; }
    public IReadOnlyList<BarcodeStagingItemDto> Items { get; set; } = [];
}

public sealed class BarcodeStagingCleanupRequest
{
    public int OlderThanDays { get; set; } = 30;
    public IReadOnlyList<string> Statuses { get; set; } = ["Imported", "Rejected"];
    public string? BatchName { get; set; }
    public string? Source { get; set; }
}

public sealed class BarcodeStagingCleanupResultDto
{
    public int MatchedCount { get; set; }
    public int DeletedCount { get; set; }
    public DateTime CutoffUtc { get; set; }
    public IReadOnlyList<BarcodeStagingItemDto> Items { get; set; } = [];
}

public sealed class BarcodeImportValidationRequest
{
    public IReadOnlyList<int> Ids { get; set; } = [];
    public string? BatchName { get; set; }
}

public sealed class BarcodeImportCommitRequest
{
    public IReadOnlyList<int> Ids { get; set; } = [];
    public string? BatchName { get; set; }
}

public sealed class BarcodeImportValidationRowDto
{
    public BarcodeStagingItemDto Item { get; set; } = new();
    public bool CanImport { get; set; }
    public string Severity { get; set; } = "Ready";
    public IReadOnlyList<string> Messages { get; set; } = [];
}

public sealed class BarcodeImportValidationPreviewDto
{
    public int TotalCount { get; set; }
    public int ReadyCount { get; set; }
    public int WarningCount { get; set; }
    public int BlockedCount { get; set; }
    public IReadOnlyList<BarcodeImportValidationRowDto> Rows { get; set; } = [];
}

public sealed class BarcodeImportCommitResultDto
{
    public int RequestedCount { get; set; }
    public int ImportedCount { get; set; }
    public int SkippedCount { get; set; }
    public IReadOnlyList<string> Messages { get; set; } = [];
}

public sealed class BarcodeBatchReportDto
{
    public string BatchName { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public int NewCount { get; set; }
    public int MatchedCount { get; set; }
    public int NeedsReviewCount { get; set; }
    public int ApprovedCount { get; set; }
    public int ImportedCount { get; set; }
    public int RejectedCount { get; set; }
    public int ReadyToImportCount { get; set; }
    public int DuplicateCodeCount { get; set; }
    public int BookCount { get; set; }
    public int CdCount { get; set; }
    public int DvdCount { get; set; }
    public int OtherTypeCount { get; set; }
    public int ImportedBookCount { get; set; }
    public int ImportedCdCount { get; set; }
    public int ImportedDvdCount { get; set; }
    public int ImportedOtherTypeCount { get; set; }
    public int CandidateCount { get; set; }
    public int SelectedCandidateCount { get; set; }
    public int NoCandidateCount { get; set; }
    public int LowConfidenceCount { get; set; }
    public string ProviderMatchSummary { get; set; } = string.Empty;
    public string ProviderFailureSummary { get; set; } = string.Empty;
    public string SelectedProviderSummary { get; set; } = string.Empty;
    public DateTime FirstStagedAtUtc { get; set; }
    public DateTime LastUpdatedAtUtc { get; set; }
    public DateTime? LastImportedAtUtc { get; set; }
}

public sealed class BarcodeImportHistoryRowDto
{
    public int Id { get; set; }
    public string Upc { get; set; } = string.Empty;
    public string NormalizedCode { get; set; } = string.Empty;
    public string CodeType { get; set; } = "Unknown";
    public string Source { get; set; } = "Manual";
    public string? BatchName { get; set; }
    public string ItemType { get; set; } = "Unknown";
    public string Status { get; set; } = "Imported";
    public string? SuggestedTitle { get; set; }
    public string? SuggestedCreator { get; set; }
    public string? SuggestedFormat { get; set; }
    public string? SuggestedYear { get; set; }
    public string? LookupProvider { get; set; }
    public decimal? Confidence { get; set; }
    public string? ImportedEntityType { get; set; }
    public int? ImportedEntityId { get; set; }
    public DateTime ImportedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
public sealed class BarcodeLookupCandidateDto
{
    public int Id { get; set; }
    public int BarcodeStagingItemId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string? ExternalId { get; set; }
    public string? Title { get; set; }
    public string? Creator { get; set; }
    public string? Publisher { get; set; }
    public string? PublishDate { get; set; }
    public string? Format { get; set; }
    public string? CoverImageUrl { get; set; }
    public decimal? Confidence { get; set; }
    public bool Selected { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}





