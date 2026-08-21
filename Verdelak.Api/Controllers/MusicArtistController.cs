using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

[ApiController]
[Route("api/artists")]
public class MusicArtistsController : ControllerBase
{
    private readonly VerdelakDbContext _context;

    public MusicArtistsController(VerdelakDbContext context)
    {
        _context = context;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MusicArtist>>> GetArtists()
    {
        return await _context.MusicArtist.Include(a => a.Albums).ToListAsync();
    }


    [AllowAnonymous]
    [HttpGet("summary")]
    public async Task<ActionResult<IEnumerable<ArtistDto>>> GetArtistSummaries()
    {
        return await _context.MusicArtist
            .Select(a => new ArtistDto
            {
                ID = a.ID,
                Artist = a.Band
            })
            .OrderBy(a => a.Artist)
            .ToListAsync();
    }

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<ActionResult<ArtistWithAlbumsDto>> GetArtist(int id)
    {
        var artist = await _context.MusicArtist
            .Include(a => a.Albums)
                .ThenInclude(album => album.Info)
            .Include(a => a.Albums)
                .ThenInclude(album => album.Status)
            .Where(a => a.ID == id)
            .FirstOrDefaultAsync();

        if (artist == null) return NotFound();

        return new ArtistWithAlbumsDto
        {
            ID = artist.ID,
            Artist = artist.Band,
            Albums = artist.Albums
                .Where(IsOwned)
                .OrderBy(al => al.Title)
                .Select(al => new AlbumSummaryDto
                {
                    ID = al.ID,
                    Title = al.Title,
                    Format = GetAlbumFormat(al)
                })
                .ToList()
        };
    }

    [AllowAnonymous]
    [HttpGet("full")]
    public async Task<ActionResult<IEnumerable<ArtistWithAlbumsDto>>> GetFullList([FromQuery] string? format)
    {
        var normalizedFormat = NormalizeFormat(format);

        var artists = await _context.MusicArtist
            .Include(a => a.Albums)
                .ThenInclude(album => album.Info)
            .Include(a => a.Albums)
                .ThenInclude(album => album.Status)
            .OrderBy(a => a.Band)
            .ToListAsync();

        return artists
            .Select(a => new ArtistWithAlbumsDto
            {
                ID = a.ID,
                Artist = a.Band,
                Albums = a.Albums
                    .Where(album => IsOwned(album) && (normalizedFormat is null || GetAlbumFormat(album) == normalizedFormat))
                    .OrderBy(al => al.Title)
                    .Select(al => new AlbumSummaryDto
                    {
                        ID = al.ID,
                        Title = al.Title,
                        Format = GetAlbumFormat(al)
                    })
                    .ToList()
            })
            .Where(artist => normalizedFormat is null || artist.Albums.Count > 0)
            .ToList();
    }

    [AllowAnonymous]
    [HttpGet("catalog")]
    public async Task<ActionResult<CdCatalogPageDto>> GetCatalog(
        [FromQuery] string? format = "CD",
        [FromQuery] string? band = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 24)
    {
        var normalizedFormat = NormalizeFormat(format);
        var requestedPageSize = Math.Clamp(pageSize, 1, 100);

        var rows = await _context.Albums
            .AsNoTracking()
            .Where(album => album.Status == null
                || album.Status.WantStatusID == null
                || album.Status.WantStatusID.Trim().ToUpper() != "W")
            .Select(album => new CatalogAlbumRow
            {
                AlbumID = album.ID,
                Title = album.Title,
                ArtistID = album.ArtistID,
                Artist = album.Band == null ? string.Empty : album.Band.Band,
                StatusFormat = album.Status == null ? null : album.Status.FormatID,
                InfoFormat = album.Info == null ? null : album.Info.Format
            })
            .ToListAsync();

        var artists = rows
            .Select(row => new
            {
                Row = row,
                Format = GetAlbumFormat(row.StatusFormat, row.InfoFormat)
            })
            .Where(item => normalizedFormat is null || item.Format == normalizedFormat)
            .GroupBy(item => new { item.Row.ArtistID, item.Row.Artist })
            .Select(group => new ArtistWithAlbumsDto
            {
                ID = group.Key.ArtistID,
                Artist = group.Key.Artist,
                Albums = group
                    .OrderBy(item => item.Row.Title)
                    .Select(item => new AlbumSummaryDto
                    {
                        ID = item.Row.AlbumID,
                        Title = item.Row.Title,
                        Format = item.Format
                    })
                    .ToList()
            })
            .Where(artist => artist.Albums.Count > 0)
            .OrderBy(artist => artist.Artist)
            .ToList();

        var artistIndex = BuildArtistIndex(artists);

        if (!string.IsNullOrWhiteSpace(band))
        {
            artists = artists
                .Where(artist => artist.Artist.Contains(band, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        var totalArtistCount = artists.Count;
        var totalAlbumCount = artists.Sum(artist => artist.Albums.Count);
        var totalPages = Math.Max(1, (int)Math.Ceiling((double)totalArtistCount / requestedPageSize));
        var pageNumber = Math.Clamp(page, 1, totalPages);

        return new CdCatalogPageDto
        {
            SearchTerm = band,
            Artists = artists
                .Skip((pageNumber - 1) * requestedPageSize)
                .Take(requestedPageSize)
                .ToList(),
            ArtistIndex = artistIndex,
            TotalArtistCount = totalArtistCount,
            TotalAlbumCount = totalAlbumCount,
            PageNumber = pageNumber,
            PageSize = requestedPageSize
        };
    }

    private sealed class CatalogAlbumRow
    {
        public int AlbumID { get; init; }
        public string Title { get; init; } = string.Empty;
        public int ArtistID { get; init; }
        public string Artist { get; init; } = string.Empty;
        public string? StatusFormat { get; init; }
        public string? InfoFormat { get; init; }
    }

    private static List<ArtistLetterGroupDto> BuildArtistIndex(IReadOnlyList<ArtistWithAlbumsDto> artists)
    {
        var groups = new List<ArtistLetterGroupDto>
        {
            new()
            {
                Key = "number",
                Label = "#",
                Artists = artists
                    .Where(artist => !string.IsNullOrWhiteSpace(artist.Artist) && char.IsDigit(artist.Artist.TrimStart()[0]))
                    .OrderBy(artist => artist.Artist)
                    .Select(artist => new ArtistIndexItemDto { ID = artist.ID, Artist = artist.Artist })
                    .ToList()
            }
        };

        groups.AddRange(Enumerable.Range('A', 26).Select(letter =>
        {
            var label = ((char)letter).ToString();

            return new ArtistLetterGroupDto
            {
                Key = label.ToLowerInvariant(),
                Label = label,
                Artists = artists
                    .Where(artist => artist.Artist.StartsWith(label, StringComparison.OrdinalIgnoreCase))
                    .OrderBy(artist => artist.Artist)
                    .Select(artist => new ArtistIndexItemDto { ID = artist.ID, Artist = artist.Artist })
                    .ToList()
            };
        }));

        return groups;
    }

    private static string? NormalizeFormat(string? format)
    {
        if (string.IsNullOrWhiteSpace(format) || format.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return format.Trim().ToUpperInvariant() switch
        {
            "CD" or "CDS" => "CD",
            "TA" or "T" or "TAPE" or "TAPES" => "Tape",
            "VI" or "V" or "LP" or "VINYL" or "RECORD" or "RECORDS" => "Vinyl",
            "MP" or "MP3" or "MP3S" or "DIGITAL" => "MP3",
            _ => format.Trim()
        };
    }

    private static bool IsOwned(MusicAlbum album)
    {
        return album.Status?.WantStatusID?.Trim().Equals("W", StringComparison.OrdinalIgnoreCase) != true;
    }

    private static string GetAlbumFormat(MusicAlbum album)
    {
        return NormalizeFormat(album.Status?.FormatID) ?? NormalizeFormat(album.Info?.Format) ?? "CD";
    }

    private static string GetAlbumFormat(string? statusFormat, string? infoFormat)
    {
        return NormalizeFormat(statusFormat) ?? NormalizeFormat(infoFormat) ?? "CD";
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost]
    public async Task<ActionResult<MusicArtist>> CreateArtist([FromBody] MusicArtist artist)
    {
        if (string.IsNullOrWhiteSpace(artist.Band))
            return BadRequest("Artist name cannot be empty");

        _context.MusicArtist.Add(artist);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetArtist), new { id = artist.ID }, artist);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateArtist(int id, [FromBody] MusicArtist artist)
    {
        if (id != artist.ID)
            return BadRequest();

        var existing = await _context.MusicArtist.FindAsync(id);
        if (existing == null)
            return NotFound();

        existing.Band = artist.Band;
        // Bio is NotMapped, so you might store it elsewhere or ignore here

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteArtist(int id)
    {
        var artist = await _context.MusicArtist
            .Include(a => a.Albums)
            .FirstOrDefaultAsync(a => a.ID == id);

        if (artist == null)
            return NotFound();

        if (artist.Albums.Any())
            return BadRequest("Cannot delete an artist with existing albums.");

        _context.MusicArtist.Remove(artist);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [AllowAnonymous]
    [HttpGet("{id}/bio")]
    public async Task<ActionResult<string>> GetBio(int id)
    {
        var bio = await _context.MusicArtistBios.FindAsync(id);
        return bio?.BioText ?? string.Empty;
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost("{id}/bio")]
    public async Task<IActionResult> SetBio(int id, [FromBody] string bioText)
    {
        var existing = await _context.MusicArtistBios.FindAsync(id);
        if (existing != null)
        {
            existing.BioText = bioText;
            existing.LastUpdated = DateTime.UtcNow;
        }
        else
        {
            _context.MusicArtistBios.Add(new MusicArtistBio
            {
                ArtistID = id,
                BioText = bioText,
                LastUpdated = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }


}

