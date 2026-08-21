using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public interface IDiscogsLookupService
{
    Task<IReadOnlyList<BarcodeLookupCandidate>> LookupBarcodeAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken);
}
