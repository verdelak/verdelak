using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
public class MusicArtistBiosController : ControllerBase
{
    private readonly VerdelakDbContext _context;

    public MusicArtistBiosController(VerdelakDbContext context)
    {
        _context = context;
    }

    // GET: api/musicartistbios
    [HttpGet("{artistId}")]
    public async Task<ActionResult<string>> GetBio(int artistId)
    {
        var bio = await _context.MusicArtistBios
              .Where(b => b.ArtistID == artistId)
              .Select(b => new ArtistBioDto
              {
                  ArtistID = b.ArtistID,
                  BioText = b.BioText ?? string.Empty,
                  AdditionalInfo = b.AdditionalInfo ?? string.Empty,
                  LastUpdated = b.LastUpdated
              })
              .FirstOrDefaultAsync();

        return bio is null ? NotFound() : Ok(bio);
    }

    // POST: api/musicartistbios
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> UpsertBio([FromBody] ArtistBioDto dto)
    {
        Console.WriteLine("User is authenticated: " + User.Identity?.IsAuthenticated);
        Console.WriteLine("User role: " + User.FindFirst("role")?.Value);
        Console.WriteLine("User ID: " + User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

        var existing = await _context.MusicArtistBios.FindAsync(dto.ArtistID);

        if (existing != null)
        {
            existing.BioText = dto.BioText;
            existing.AdditionalInfo = dto.AdditionalInfo;
            existing.LastUpdated = DateTime.UtcNow;
        }
        else
        {
            var artistExists = await _context.MusicArtist.AnyAsync(a => a.ID == dto.ArtistID);
            if (!artistExists)
                return BadRequest("Artist does not exist.");

            var newBio = new MusicArtistBio
            {
                ArtistID = dto.ArtistID,
                BioText = dto.BioText,
                AdditionalInfo = dto.AdditionalInfo,
                LastUpdated = DateTime.UtcNow
            };
            _context.MusicArtistBios.Add(newBio);
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{artistId}")]
    public async Task<IActionResult> UpdateBio(int artistId, [FromBody] ArtistBioDto dto)
    {

        if (artistId != dto.ArtistID) return BadRequest("Mismatched artist ID.");

        var bio = await _context.MusicArtistBios.FindAsync(artistId);
        if (bio == null) return NotFound();

        bio.BioText = dto.BioText;
        bio.AdditionalInfo = dto.AdditionalInfo;
        bio.LastUpdated = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

}
