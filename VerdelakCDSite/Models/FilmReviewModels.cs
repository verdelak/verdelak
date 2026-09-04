namespace VerdelakCDSite.Models;

public sealed class FilmReviewIndexViewModel
{
    public PublicAppearanceSettings Appearance { get; init; } = PublicAppearanceSettings.FilmReviewSiteDefault;

    public string? SearchTerm { get; init; }

    public string? Format { get; init; }

    public bool IncludeWishlist { get; init; } = true;

    public string ApiBaseUrl { get; init; } = string.Empty;

    public string? ErrorMessage { get; init; }

    public PublicFilmReviewCatalog Catalog { get; init; } = new();

    public bool HasSearch => !string.IsNullOrWhiteSpace(SearchTerm);

    public bool HasFormat => !string.IsNullOrWhiteSpace(Format);

    public int ShowingCount => Catalog.Items.Count;
}

public sealed class FilmReviewDetailViewModel
{
    public PublicAppearanceSettings Appearance { get; init; } = PublicAppearanceSettings.FilmReviewSiteDefault;

    public PublicFilmReviewItem? Film { get; init; }

    public string? ErrorMessage { get; init; }
}

public sealed class PublicFilmReviewCatalog
{
    public string? SearchTerm { get; init; }

    public string? Format { get; init; }

    public bool IncludeWishlist { get; init; } = true;

    public int TotalCount { get; init; }

    public int OwnedCount { get; init; }

    public int WishlistCount { get; init; }

    public IReadOnlyList<string> Formats { get; init; } = [];

    public IReadOnlyList<PublicFilmReviewItem> Items { get; init; } = [];
}

public sealed class PublicFilmReviewItem
{
    public int Id { get; init; }

    public string Title { get; init; } = string.Empty;

    public string? Creator { get; init; }

    public string Format { get; init; } = "DVD";

    public string WantStatusID { get; init; } = "H";

    public string? ReleaseYear { get; init; }

    public string? Source { get; init; }

    public string? Notes { get; init; }

    public bool IsWishlist => string.Equals(WantStatusID, "W", StringComparison.OrdinalIgnoreCase);

    public string StatusLabel => IsWishlist ? "Wanted" : "Owned";
}
