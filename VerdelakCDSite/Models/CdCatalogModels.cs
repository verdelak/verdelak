namespace VerdelakCDSite.Models;

public sealed class CdCatalogViewModel
{
    public PublicAppearanceSettings Appearance { get; init; } = PublicAppearanceSettings.CdSiteDefault;

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
    public PublicAppearanceSettings Appearance { get; init; } = PublicAppearanceSettings.CdSiteDefault;

    public AlbumDetail? Album { get; init; }

    public string? ErrorMessage { get; init; }
}

public sealed class PublicAppearanceSettings
{
    public static PublicAppearanceSettings CdSiteDefault { get; } = new()
    {
        BrandName = "Verdelak CD Collection",
        Tagline = "Browse the collection by band and read CD reviews.",
        PrimaryColor = "#0d6efd",
        AccentColor = "#6f42c1"
    };

    public static PublicAppearanceSettings DinoSiteDefault { get; } = new()
    {
        BrandName = "Verdelak Dino Archive",
        Tagline = "Browse published dinosaurs by name, taxonomy, and discovery notes.",
        PrimaryColor = "#198754",
        AccentColor = "#0f766e"
    };

    public static PublicAppearanceSettings PersonalSiteDefault { get; } = new()
    {
        BrandName = "Verdelak",
        Tagline = "Resume, writing, and personal projects.",
        PrimaryColor = "#2563eb",
        AccentColor = "#0f766e"
    };

    public static PublicAppearanceSettings FilmReviewSiteDefault { get; } = new()
    {
        BrandName = "Verdelak Film Review",
        Tagline = "Movie notes, ratings, and review writing.",
        PrimaryColor = "#7c3aed",
        AccentColor = "#be123c"
    };

    public string BrandName { get; init; } = "Verdelak CD Collection";

    public string Tagline { get; init; } = "Browse the collection by band and read CD reviews.";

    public string PrimaryColor { get; init; } = "#0d6efd";

    public string AccentColor { get; init; } = "#6f42c1";

    public string? LogoUrl { get; init; }

    public string? HeroImageUrl { get; init; }

    public string? FaviconUrl { get; init; }
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
