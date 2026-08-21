using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public interface IGoogleBooksLookupService
{
    Task<IReadOnlyList<BarcodeLookupCandidate>> LookupIsbnAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken);
}
