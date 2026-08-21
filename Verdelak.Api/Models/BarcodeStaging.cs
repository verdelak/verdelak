using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Models;

public class BarcodeStagingItem
{
    public int Id { get; set; }

    [MaxLength(64)]
    public string Upc { get; set; } = string.Empty;

    [MaxLength(64)]
    public string NormalizedCode { get; set; } = string.Empty;

    [MaxLength(25)]
    public string CodeType { get; set; } = "Unknown";

    [MaxLength(25)]
    public string Source { get; set; } = "Manual";

    [MaxLength(50)]
    public string? BatchName { get; set; }

    [MaxLength(25)]
    public string ItemType { get; set; } = "Unknown";

    [MaxLength(25)]
    public string Status { get; set; } = "New";

    [MaxLength(250)]
    public string? SuggestedTitle { get; set; }

    [MaxLength(250)]
    public string? SuggestedCreator { get; set; }

    [MaxLength(100)]
    public string? SuggestedFormat { get; set; }

    [MaxLength(25)]
    public string? SuggestedYear { get; set; }

    [MaxLength(100)]
    public string? LookupProvider { get; set; }

    public decimal? Confidence { get; set; }

    public string? Notes { get; set; }

    public string? RawLookupJson { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }

    [MaxLength(50)]
    public string? ImportedEntityType { get; set; }

    public int? ImportedEntityId { get; set; }

    public DateTime? ImportedAtUtc { get; set; }

    public ICollection<BarcodeLookupCandidate> LookupCandidates { get; set; } = [];
}

public class BarcodeLookupCandidate
{
    public int Id { get; set; }

    public int BarcodeStagingItemId { get; set; }

    public BarcodeStagingItem? BarcodeStagingItem { get; set; }

    [MaxLength(100)]
    public string Provider { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ExternalId { get; set; }

    [MaxLength(250)]
    public string? Title { get; set; }

    [MaxLength(250)]
    public string? Creator { get; set; }

    [MaxLength(250)]
    public string? Publisher { get; set; }

    [MaxLength(50)]
    public string? PublishDate { get; set; }

    [MaxLength(100)]
    public string? Format { get; set; }

    [MaxLength(500)]
    public string? CoverImageUrl { get; set; }

    public decimal? Confidence { get; set; }

    public string? RawJson { get; set; }

    public bool Selected { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
