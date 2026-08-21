using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public interface IOpenLibraryLookupService
{
    Task<IReadOnlyList<BarcodeLookupCandidate>> LookupIsbnAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken);
}
