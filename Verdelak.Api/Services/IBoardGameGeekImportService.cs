using Verdelak.Api.Dtos;

namespace Verdelak.Api.Services;

public interface IBoardGameGeekImportService
{
    Task<IReadOnlyList<BoardGameGeekCollectionItemDto>> GetCollectionAsync(
        string username,
        bool includeOwned,
        bool includeWishlist,
        bool includeExpansions,
        CancellationToken cancellationToken);
}
