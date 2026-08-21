using Verdelak.Api.Models;

namespace Verdelak.Api.Services;

public interface IUpcItemDbLookupService
{
    Task<IReadOnlyList<BarcodeLookupCandidate>> LookupBarcodeAsync(
        BarcodeStagingItem item,
        CancellationToken cancellationToken);
}
