using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public interface IWikidataLookupService
{
    Task<IReadOnlyList<BarcodeLookupCandidate>> LookupBarcodeAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken);
}
