namespace VerdelakCDSite.Models;

public sealed class CdCatalogViewModel
{
    public string? SearchTerm { get; init; }

    public string ApiBaseUrl { get; init; } = string.Empty;

    public string? ErrorMessage { get; init; }

    public IReadOnlyList<ArtistCatalogItem> Artists { get; init; } = [];

    public IReadOnlyList<ArtistLetterGroup> ArtistIndex { get; init; } = [];

    public int TotalArtistCount { get; init; }

    public int TotalAlbumCount { get; init; }

    public int PageNumber { get; init; } = 1;

    public int PageSize { get; init; } = 24;

    public int TotalPages => TotalArtistCount == 0 ? 1 : (int)Math.Ceiling((double)TotalArtistCount / PageSize);

    public bool HasSearch => !string.IsNullOrWhiteSpace(SearchTerm);

    public bool HasPreviousPage => PageNumber > 1;

    public bool HasNextPage => PageNumber < TotalPages;
}

public sealed class ArtistLetterGroup
{
    public required string Key { get; init; }

    public required string Label { get; init; }

    public IReadOnlyList<ArtistIndexItem> Artists { get; init; } = [];
}

public sealed class ArtistIndexItem
{
    public int Id { get; init; }

    public string Artist { get; init; } = string.Empty;
}

public sealed class CdCatalogPage
{
    public string? SearchTerm { get; init; }

    public IReadOnlyList<ArtistCatalogItem> Artists { get; init; } = [];

    public IReadOnlyList<ArtistLetterGroup> ArtistIndex { get; init; } = [];

    public int TotalArtistCount { get; init; }

    public int TotalAlbumCount { get; init; }

    public int PageNumber { get; init; } = 1;

    public int PageSize { get; init; } = 24;
}

public sealed class AlbumDetailViewModel
{
    public AlbumDetail? Album { get; init; }

    public string? ErrorMessage { get; init; }
}

public sealed class ArtistCatalogItem
{
    public int Id { get; init; }

    public string Artist { get; init; } = string.Empty;

    public IReadOnlyList<AlbumSummary> Albums { get; init; } = [];
}

public sealed class AlbumSummary
{
    public int Id { get; init; }

    public string Title { get; init; } = string.Empty;

    public string Format { get; init; } = "CD";
}

public sealed class AlbumDetail
{
    public int Id { get; init; }

    public string Title { get; init; } = string.Empty;

    public ArtistSummary Artist { get; init; } = new();

    public IReadOnlyList<ReviewSummary> Reviews { get; init; } = [];

    public DateTime? ReleaseDate { get; init; }

    public string? InfoText { get; init; }

    public string? AdditionalInfo { get; init; }
}

public sealed class ArtistSummary
{
    public int Id { get; init; }

    public string Artist { get; init; } = string.Empty;
}

public sealed class ReviewSummary
{
    public int Id { get; init; }

    public int AlbumId { get; init; }

    public int ReviewerId { get; init; }

    public int Rating { get; init; }

    public string Text { get; init; } = string.Empty;

    public DateTime CreatedAt { get; init; }
}
