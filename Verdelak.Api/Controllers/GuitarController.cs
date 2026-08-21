using Microsoft.AspNetCore.Mvc;
using Verdelak.Api.Dtos;
using Verdelak.Api.Services;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/guitar")]
public class GuitarController(IGuitarTheoryService theoryService) : ControllerBase
{
    [HttpGet("options")]
    public ActionResult<GuitarExplorerOptionsDto> GetOptions()
    {
        return theoryService.GetOptions();
    }

    [HttpPost("explore")]
    public ActionResult<GuitarExplorerResultDto> Explore(GuitarExplorerRequestDto request)
    {
        try
        {
            return theoryService.Generate(request);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
