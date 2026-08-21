using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public interface IOpenFoodFactsLookupService
{
    Task<IReadOnlyList<BarcodeLookupCandidate>> LookupBarcodeAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken);
}
