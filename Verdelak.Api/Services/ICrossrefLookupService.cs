using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public interface ICrossrefLookupService
{
    Task<IReadOnlyList<BarcodeLookupCandidate>> LookupIsbnAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken);
}
