using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Models;

public class ExternalImportBatch
{
    public int Id { get; set; }

    [MaxLength(50)]
    public string Source { get; set; } = "Manual";

    [MaxLength(50)]
    public string TargetArea { get; set; } = "Software";

    [MaxLength(100)]
    public string BatchName { get; set; } = string.Empty;

    [MaxLength(30)]
    public string Status { get; set; } = "Open";

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<ExternalImportStagingItem> Items { get; set; } = [];
}

public class ExternalImportStagingItem
{
    public int Id { get; set; }

    public int BatchId { get; set; }

    public ExternalImportBatch? Batch { get; set; }

    [MaxLength(50)]
    public string Source { get; set; } = "Manual";

    [MaxLength(50)]
    public string TargetArea { get; set; } = "Software";

    [MaxLength(150)]
    public string? ExternalId { get; set; }

    [MaxLength(250)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? PlatformName { get; set; }

    [MaxLength(100)]
    public string? LocationName { get; set; }

    [MaxLength(250)]
    public string? Publisher { get; set; }

    [MaxLength(250)]
    public string? Developer { get; set; }

    [MaxLength(250)]
    public string? VersionEdition { get; set; }

    [MaxLength(100)]
    public string? MediaType { get; set; }

    [MaxLength(500)]
    public string? ArtworkUrl { get; set; }

    [MaxLength(30)]
    public string Status { get; set; } = "Staged";

    [MaxLength(30)]
    public string MatchStatus { get; set; } = "NotChecked";

    [MaxLength(30)]
    public string SelectedAction { get; set; } = "Import";

    [MaxLength(50)]
    public string? MatchedEntityType { get; set; }

    public int? MatchedEntityId { get; set; }

    [MaxLength(250)]
    public string? MatchedTitle { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public string? RawJson { get; set; }

    [MaxLength(50)]
    public string? ImportedEntityType { get; set; }

    public int? ImportedEntityId { get; set; }

    public DateTime? ImportedAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }
}
