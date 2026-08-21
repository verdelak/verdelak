using Verdelak.Api.Dtos;

namespace Verdelak.Api.Services;

public interface IMetalArchivesLookupService
{
    Task<IReadOnlyList<MetalArchivesBandSearchResultDto>> SearchBandsAsync(
        string bandName,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<MetalArchivesReleaseDto>> GetDiscographyAsync(
        string metalArchivesBandId,
        CancellationToken cancellationToken);
}
