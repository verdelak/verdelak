using Verdelak.Api.Dtos;

namespace Verdelak.Api.Services;

public interface IGuitarTheoryService
{
    GuitarExplorerOptionsDto GetOptions();
    GuitarExplorerResultDto Generate(GuitarExplorerRequestDto request);
}
