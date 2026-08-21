using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public interface IMusicBrainzLookupService
{
    Task<IReadOnlyList<BarcodeLookupCandidate>> LookupBarcodeAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken);
}
