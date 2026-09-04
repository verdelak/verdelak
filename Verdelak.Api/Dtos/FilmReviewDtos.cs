namespace Verdelak.Api.Dtos;

public record PublicFilmReviewCatalogDto(
    string? SearchTerm,
    string? Format,
    bool IncludeWishlist,
    int TotalCount,
    int OwnedCount,
    int WishlistCount,
    IReadOnlyList<string> Formats,
    IReadOnlyList<PublicFilmReviewItemDto> Items);

public record PublicFilmReviewItemDto(
    int Id,
    string Title,
    string? Creator,
    string Format,
    string WantStatusID,
    string? ReleaseYear,
    string? Source,
    string? Notes);
