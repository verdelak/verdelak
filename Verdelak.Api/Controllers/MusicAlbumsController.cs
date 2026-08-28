using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Services;

namespace Verdelak.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MusicAlbumsController(VerdelakDbContext context, IMetalArchivesLookupService metalArchivesLookupService) : ControllerBase
    {
        private static readonly string[] Formats = ["CD", "Tape", "Vinyl", "MP3"];
        private const string DefaultFolderImportRootPath = @"Z:\Rips";
        private readonly VerdelakDbContext _context = context;

        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ArtistWithAlbumsDto>>> GetAlbums([FromQuery] string? format)
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
                .Select(artist => new ArtistWithAlbumsDto
                {
                    ID = artist.ID,
                    Artist = artist.Band,
                    Albums = artist.Albums
                        .Where(album => IsOwned(album) && (normalizedFormat is null || GetAlbumFormat(album) == normalizedFormat))
                        .OrderBy(album => album.Title)
                        .Select(album => new AlbumSummaryDto
                        {
                            ID = album.ID,
                            Title = album.Title,
                            Format = GetAlbumFormat(album)
                        })
                        .ToList()
                })
                .Where(artist => artist.Albums.Count > 0)
                .ToList();
        }

        [AllowAnonymous]
        [HttpGet("want-list")]
        public async Task<ActionResult<IEnumerable<MusicWantListItemDto>>> GetWantList()
        {
            var albums = await _context.Albums
                .Include(album => album.Band)
                .Include(album => album.Info)
                .Include(album => album.Status)
                .Where(album => album.Status != null && album.Status.WantStatusID == "W")
                .ToListAsync();

            return albums
                .Select(album => new MusicWantListItemDto
                {
                    ID = album.ID,
                    Artist = album.Band?.Band ?? "(Unknown)",
                    Title = album.Title,
                    Format = GetAlbumFormat(album)
                })
                .OrderBy(item => item.Artist)
                .ThenBy(item => item.Title)
                .ToList();
        }

        [Authorize]
        [HttpGet("metal-archives/search")]
        public async Task<ActionResult<IEnumerable<MetalArchivesBandSearchResultDto>>> SearchMetalArchivesBands(
            [FromQuery] string band,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(band))
            {
                return BadRequest("Band name is required.");
            }

            try
            {
                return Ok(await metalArchivesLookupService.SearchBandsAsync(band, cancellationToken));
            }
            catch (HttpRequestException ex)
            {
                return Problem($"Metal Archives search failed: {ex.Message}");
            }
        }

        [Authorize]
        [HttpGet("metal-archives/{metalArchivesBandId}/missing-releases")]
        public async Task<ActionResult<MusicMetalArchivesComparisonDto>> CompareMetalArchivesBand(
            string metalArchivesBandId,
            [FromQuery] string bandName,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(metalArchivesBandId) || string.IsNullOrWhiteSpace(bandName))
            {
                return BadRequest("Metal Archives band id and band name are required.");
            }

            IReadOnlyList<MetalArchivesReleaseDto> releases;
            try
            {
                releases = await metalArchivesLookupService.GetDiscographyAsync(metalArchivesBandId, cancellationToken);
            }
            catch (HttpRequestException ex)
            {
                return Problem($"Metal Archives discography lookup failed: {ex.Message}");
            }

            return new MusicMetalArchivesComparisonDto(
                new MetalArchivesBandSearchResultDto(metalArchivesBandId, bandName, string.Empty, string.Empty, $"https://www.metal-archives.com/bands/_/{metalArchivesBandId}"),
                await CompareReleasesToLocalCollectionAsync(bandName, releases, cancellationToken));
        }

        [Authorize]
        [HttpPost("metal-archives/manual-compare")]
        public async Task<ActionResult<MusicMetalArchivesComparisonDto>> CompareManualMetalArchivesReleases(
            MusicMetalArchivesManualCompareRequest request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.ArtistName))
            {
                return BadRequest("Artist name is required.");
            }

            if (request.Releases.Count == 0)
            {
                return BadRequest("Paste at least one release to compare.");
            }

            var releases = request.Releases
                .Where(release => !string.IsNullOrWhiteSpace(release.Title))
                .Where(release => release.ReleaseType.Equals("Full-length", StringComparison.OrdinalIgnoreCase)
                    || release.ReleaseType.Equals("EP", StringComparison.OrdinalIgnoreCase))
                .OrderBy(release => release.Year ?? int.MaxValue)
                .ThenBy(release => release.Title)
                .ToList();

            return new MusicMetalArchivesComparisonDto(
                new MetalArchivesBandSearchResultDto("manual", request.ArtistName.Trim(), string.Empty, string.Empty, string.Empty),
                await CompareReleasesToLocalCollectionAsync(request.ArtistName, releases, cancellationToken));
        }

        [Authorize(Roles = "Admin,Contributor")]
        [HttpPost("metal-archives/add-wants")]
        public async Task<ActionResult<MusicMetalArchivesAddWantResultDto>> AddMetalArchivesWants(
            MusicMetalArchivesAddWantRequest request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.ArtistName))
            {
                return BadRequest("Artist name is required.");
            }

            if (request.Releases.Count == 0)
            {
                return BadRequest("Select at least one release.");
            }

            var artistName = request.ArtistName.Trim();
            var artistKey = NormalizeComparisonText(artistName);
            var artists = await _context.MusicArtist.ToListAsync(cancellationToken);
            var artist = artists.FirstOrDefault(artist => NormalizeComparisonText(artist.Band) == artistKey);
            if (artist is null)
            {
                artist = new MusicArtist { Band = artistName };
                _context.MusicArtist.Add(artist);
                await _context.SaveChangesAsync(cancellationToken);
            }

            var existing = await _context.Albums
                .Include(album => album.Status)
                .Where(album => album.ArtistID == artist.ID)
                .ToListAsync(cancellationToken);
            var existingKeys = existing
                .Select(album => NormalizeComparisonText(album.Title))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var created = 0;
            var skipped = 0;
            var messages = new List<string>();
            foreach (var release in request.Releases)
            {
                var title = release.Title.Trim();
                if (string.IsNullOrWhiteSpace(title) || existingKeys.Contains(NormalizeComparisonText(title)))
                {
                    skipped++;
                    messages.Add($"Skipped existing release: {title}");
                    continue;
                }

                var album = new MusicAlbum
                {
                    ArtistID = artist.ID,
                    Title = title,
                    Info = new MusicAlbumInfo
                    {
                        Format = "CD",
                        ReleaseDate = release.Year is null ? null : new DateTime(release.Year.Value, 1, 1),
                        InfoText = $"Wanted from Metal Archives. Type: {release.ReleaseType}. URL: {release.Url}",
                        AdditionalInfo = release.MetalArchivesId is null ? null : $"Metal Archives release id: {release.MetalArchivesId}"
                    },
                    Status = new MusicAlbumStatus
                    {
                        FormatID = "CD",
                        WantStatusID = "W"
                    }
                };

                _context.Albums.Add(album);
                existingKeys.Add(NormalizeComparisonText(title));
                created++;
                messages.Add($"Added wanted release: {title}");
            }

            await _context.SaveChangesAsync(cancellationToken);
            return new MusicMetalArchivesAddWantResultDto(created, skipped, messages);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("folder-import")]
        public async Task<ActionResult<MusicFolderImportResultDto>> ImportFromFolder(
            MusicFolderImportRequest request,
            CancellationToken cancellationToken)
        {
            var rootPath = await ResolveFolderImportRootPathAsync(request.RootPath, cancellationToken);

            if (!Directory.Exists(rootPath))
            {
                return BadRequest($"Music folder was not found: {rootPath}");
            }

            var root = new DirectoryInfo(rootPath);
            DirectoryInfo[] artistDirectories;
            try
            {
                artistDirectories = root.GetDirectories();
            }
            catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
            {
                return BadRequest($"Unable to read music folder: {ex.Message}");
            }

            var rows = new List<MusicFolderImportRowDto>();
            var messages = new List<string>();
            var skippedFolders = 0;
            var albumFoldersScanned = 0;
            var artistsCreated = 0;
            var albumsCreated = 0;
            var existingAlbums = 0;
            var databaseOnlyAlbums = 0;

            var artists = await _context.MusicArtist
                .Include(artist => artist.Albums)
                    .ThenInclude(album => album.Status)
                .Include(artist => artist.Albums)
                    .ThenInclude(album => album.Info)
                .ToListAsync(cancellationToken);

            var artistsByKey = artists
                .GroupBy(artist => NormalizeComparisonText(artist.Band))
                .Where(group => !string.IsNullOrWhiteSpace(group.Key))
                .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);

            var albumKeysByArtist = artists
                .GroupBy(artist => NormalizeComparisonText(artist.Band))
                .Where(group => !string.IsNullOrWhiteSpace(group.Key))
                .ToDictionary(
                    group => group.Key,
                    group => group
                        .SelectMany(artist => artist.Albums)
                        .Select(album => NormalizeComparisonText(album.Title))
                        .Where(key => !string.IsNullOrWhiteSpace(key))
                        .ToHashSet(StringComparer.OrdinalIgnoreCase),
                    StringComparer.OrdinalIgnoreCase);
            var scannedAlbumKeysByArtist = new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);

            foreach (var artistDirectory in artistDirectories.OrderBy(directory => directory.Name))
            {
                var artistName = artistDirectory.Name.Trim();
                var artistKey = NormalizeComparisonText(artistName);
                if (string.IsNullOrWhiteSpace(artistName) || string.IsNullOrWhiteSpace(artistKey))
                {
                    skippedFolders++;
                    messages.Add($"Skipped artist folder with no usable name: {artistDirectory.FullName}");
                    continue;
                }

                DirectoryInfo[] albumDirectories;
                try
                {
                    albumDirectories = artistDirectory.GetDirectories();
                }
                catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
                {
                    skippedFolders++;
                    messages.Add($"Skipped {artistName}: {ex.Message}");
                    continue;
                }

                if (albumDirectories.Length == 0)
                {
                    skippedFolders++;
                    messages.Add($"Skipped {artistName}: no album folders found.");
                    continue;
                }

                var artistExists = artistsByKey.TryGetValue(artistKey, out var artist);
                var artistAlbumKeys = albumKeysByArtist.GetValueOrDefault(artistKey) ?? new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                if (!scannedAlbumKeysByArtist.TryGetValue(artistKey, out var scannedAlbumKeys))
                {
                    scannedAlbumKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    scannedAlbumKeysByArtist[artistKey] = scannedAlbumKeys;
                }

                if (!artistExists && request.ApplyChanges)
                {
                    artist = new MusicArtist { Band = artistName };
                    _context.MusicArtist.Add(artist);
                    artistsByKey[artistKey] = artist;
                    albumKeysByArtist[artistKey] = artistAlbumKeys;
                    artistsCreated++;
                }
                else if (!artistExists)
                {
                    artistsCreated++;
                }

                foreach (var albumDirectory in albumDirectories.OrderBy(directory => directory.Name))
                {
                    var albumName = albumDirectory.Name.Trim();
                    var albumKey = NormalizeComparisonText(albumName);
                    if (string.IsNullOrWhiteSpace(albumName) || string.IsNullOrWhiteSpace(albumKey))
                    {
                        skippedFolders++;
                        messages.Add($"Skipped album folder with no usable name: {albumDirectory.FullName}");
                        continue;
                    }

                    albumFoldersScanned++;
                    var relativePath = Path.GetRelativePath(root.FullName, albumDirectory.FullName);

                    if (!scannedAlbumKeys.Add(albumKey))
                    {
                        skippedFolders++;
                        messages.Add($"Duplicate folder skipped for {artistName}: {albumName}");
                        rows.Add(new MusicFolderImportRowDto(
                            artistName,
                            albumName,
                            relativePath,
                            "DuplicateFolder",
                            artist?.ID,
                            null));
                        continue;
                    }

                    if (artistAlbumKeys.Contains(albumKey))
                    {
                        existingAlbums++;
                        var matchedAlbum = artist?.Albums.FirstOrDefault(album => NormalizeComparisonText(album.Title) == albumKey);
                        rows.Add(new MusicFolderImportRowDto(
                            artistName,
                            albumName,
                            relativePath,
                            "Existing",
                            artist?.ID,
                            matchedAlbum?.ID));
                        continue;
                    }

                    albumsCreated++;
                    artistAlbumKeys.Add(albumKey);

                    if (request.ApplyChanges)
                    {
                        var album = new MusicAlbum
                        {
                            Title = albumName,
                            ArtistID = artist?.ID ?? 0,
                            Band = artist,
                            Info = new MusicAlbumInfo
                            {
                                Format = "CD",
                                InfoText = $"Imported from folder scan: {relativePath}"
                            },
                            Status = new MusicAlbumStatus
                            {
                                FormatID = "CD",
                                WantStatusID = "H"
                            }
                        };
                        _context.Albums.Add(album);
                    }

                    rows.Add(new MusicFolderImportRowDto(
                        artistName,
                        albumName,
                        relativePath,
                        request.ApplyChanges
                            ? (artistExists ? "CreatedAlbum" : "CreatedArtistAndAlbum")
                            : (artistExists ? "WouldCreateAlbum" : "WouldCreateArtistAndAlbum"),
                        artist?.ID,
                        null));
                }
            }

            foreach (var artist in artists.OrderBy(artist => artist.Band))
            {
                var artistKey = NormalizeComparisonText(artist.Band);
                if (string.IsNullOrWhiteSpace(artistKey))
                {
                    continue;
                }

                scannedAlbumKeysByArtist.TryGetValue(artistKey, out var scannedAlbumKeys);
                foreach (var album in artist.Albums
                    .Where(album => IsOwned(album) && GetAlbumFormat(album) == "CD")
                    .OrderBy(album => album.Title))
                {
                    var albumKey = NormalizeComparisonText(album.Title);
                    if (string.IsNullOrWhiteSpace(albumKey) || scannedAlbumKeys?.Contains(albumKey) == true)
                    {
                        continue;
                    }

                    databaseOnlyAlbums++;
                    rows.Add(new MusicFolderImportRowDto(
                        artist.Band,
                        album.Title,
                        string.Empty,
                        "DatabaseOnly",
                        artist.ID,
                        album.ID));
                }
            }

            if (request.ApplyChanges)
            {
                await _context.SaveChangesAsync(cancellationToken);
            }

            return new MusicFolderImportResultDto(
                root.FullName,
                request.ApplyChanges,
                artistDirectories.Length,
                albumFoldersScanned,
                artistsCreated,
                albumsCreated,
                existingAlbums,
                databaseOnlyAlbums,
                skippedFolders,
                rows,
                messages);
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<AlbumWithReviewsDto>> GetAlbum(int id)
        {
            var album = await _context.Albums
                .Include(a => a.Reviews)
                    .ThenInclude(r => r.Reviewer)
                .Include(a => a.Band)
                .Include(a => a.Info) // ?? Include the album info
                .FirstOrDefaultAsync(a => a.ID == id);

            if (album == null) return NotFound();

            return new AlbumWithReviewsDto
            {
                ID = album.ID,
                Title = album.Title,
                Artist = new ArtistDto
                {
                    ID = album.Band?.ID ?? 0,
                    Artist = album.Band?.Band ?? "(Unknown)"
                },
                Reviews = album.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new ReviewDto
                    {
                        ID = r.ID,
                        AlbumID = r.AlbumID,
                        ReviewerID = r.Reviewer!.ID,
                        Rating = r.Rating,
                        Text = r.Text ?? "",
                        CreatedAt = r.CreatedAt
                    }).ToList(),

                InfoText = album.Info?.InfoText,
                AdditionalInfo = album.Info?.AdditionalInfo,
                ReleaseDate = album.Info?.ReleaseDate,
                Format = GetAlbumFormat(album)
            };
        }

        [Authorize(Roles = "Admin,Contributor")]
        [HttpPut("{id}/info")]
        public async Task<IActionResult> UpdateAlbumInfo(int id, [FromBody] AlbumInfoDto info)
        {
            var albumInfo = await _context.MusicAlbumInfos.FirstOrDefaultAsync(i => i.AlbumID == id);
            if (albumInfo == null)
            {
                albumInfo = new MusicAlbumInfo
                {
                    AlbumID = id
                };
                _context.MusicAlbumInfos.Add(albumInfo);
            }

            albumInfo.ReleaseDate = info.ReleaseDate;
            albumInfo.InfoText = info.InfoText;
            albumInfo.AdditionalInfo = info.AdditionalInfo;
            albumInfo.Format = NormalizeFormat(info.Format) ?? "CD";

            var album = await _context.Albums
                .Include(a => a.Status)
                .FirstOrDefaultAsync(a => a.ID == id);

            if (album is not null)
            {
                album.Status ??= new MusicAlbumStatus { AlbumID = id, WantStatusID = "H" };
                album.Status.FormatID = FormatToCode(albumInfo.Format);
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Admin,Contributor")]
        [HttpPost]
        public async Task<ActionResult<AlbumWithReviewsDto>> CreateAlbum([FromBody] MusicAlbumSaveDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                return BadRequest("Album title is required.");
            }

            var artist = await _context.MusicArtist.FindAsync(dto.ArtistID);

            if (artist is null)
            {
                return BadRequest("Artist is required.");
            }

            var album = new MusicAlbum
            {
                Title = dto.Title.Trim(),
                ArtistID = dto.ArtistID,
                Info = new MusicAlbumInfo
                {
                    ReleaseDate = dto.ReleaseDate,
                    InfoText = dto.InfoText,
                    AdditionalInfo = dto.AdditionalInfo,
                    Format = NormalizeFormat(dto.Format) ?? "CD"
                },
                Status = new MusicAlbumStatus
                {
                    FormatID = FormatToCode(NormalizeFormat(dto.Format) ?? "CD"),
                    WantStatusID = "H"
                }
            };

            _context.Albums.Add(album);
            await _context.SaveChangesAsync();

            return await GetAlbum(album.ID);
        }

        [Authorize(Roles = "Admin,Contributor")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAlbum(int id, [FromBody] MusicAlbumSaveDto dto)
        {
            var album = await _context.Albums
                .Include(a => a.Info)
                .Include(a => a.Status)
                .FirstOrDefaultAsync(a => a.ID == id);

            if (album is null)
            {
                return NotFound();
            }

            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                return BadRequest("Album title is required.");
            }

            var artistExists = await _context.MusicArtist.AnyAsync(artist => artist.ID == dto.ArtistID);

            if (!artistExists)
            {
                return BadRequest("Artist is required.");
            }

            album.Title = dto.Title.Trim();
            album.ArtistID = dto.ArtistID;

            album.Info ??= new MusicAlbumInfo { AlbumID = id };
            album.Info.ReleaseDate = dto.ReleaseDate;
            album.Info.InfoText = dto.InfoText;
            album.Info.AdditionalInfo = dto.AdditionalInfo;
            album.Info.Format = NormalizeFormat(dto.Format) ?? "CD";
            album.Status ??= new MusicAlbumStatus { AlbumID = id, WantStatusID = "H" };
            album.Status.FormatID = FormatToCode(album.Info.Format);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [Authorize(Roles = "Admin,Contributor")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAlbum(int id)
        {
            var album = await _context.Albums
                .Include(a => a.Reviews)
                .Include(a => a.Info)
                .FirstOrDefaultAsync(a => a.ID == id);

            if (album is null)
            {
                return NotFound();
            }

            if (album.Reviews.Count > 0)
            {
                return BadRequest("Cannot delete a music item with reviews.");
            }

            _context.Albums.Remove(album);
            await _context.SaveChangesAsync();

            return NoContent();
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
                _ => Formats.FirstOrDefault(value => value.Equals(format.Trim(), StringComparison.OrdinalIgnoreCase))
            };
        }

        private static string NormalizeComparisonText(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var chars = value
                .Trim()
                .ToUpperInvariant()
                .Where(char.IsLetterOrDigit)
                .ToArray();
            return new string(chars);
        }

        private static bool IsOwned(MusicAlbum album)
        {
            return album.Status?.WantStatusID?.Trim().Equals("W", StringComparison.OrdinalIgnoreCase) != true;
        }

        private static string GetAlbumFormat(MusicAlbum album)
        {
            return NormalizeFormat(album.Status?.FormatID) ?? NormalizeFormat(album.Info?.Format) ?? "CD";
        }

        private static string FormatToCode(string format)
        {
            return NormalizeFormat(format) switch
            {
                "Tape" => "TA",
                "Vinyl" => "VI",
                "MP3" => "MP",
                _ => "CD"
            };
        }

        private async Task<string> ResolveFolderImportRootPathAsync(string? requestedRootPath, CancellationToken cancellationToken)
        {
            if (!string.IsNullOrWhiteSpace(requestedRootPath))
            {
                return requestedRootPath.Trim();
            }

            var setting = await _context.AppSettings
                .AsNoTracking()
                .SingleOrDefaultAsync(item => item.Key == AdminSettingsController.MusicFolderImporterSettingsKey, cancellationToken);
            if (setting is null || string.IsNullOrWhiteSpace(setting.ValueJson))
            {
                return DefaultFolderImportRootPath;
            }

            try
            {
                var settings = JsonSerializer.Deserialize<MusicFolderImporterSettingsDto>(setting.ValueJson);
                return string.IsNullOrWhiteSpace(settings?.RootPath)
                    ? DefaultFolderImportRootPath
                    : settings.RootPath.Trim();
            }
            catch (JsonException)
            {
                return DefaultFolderImportRootPath;
            }
        }

        private async Task<IReadOnlyList<MusicMetalArchivesReleaseComparisonDto>> CompareReleasesToLocalCollectionAsync(
            string bandName,
            IReadOnlyList<MetalArchivesReleaseDto> releases,
            CancellationToken cancellationToken)
        {
            var bandKey = NormalizeComparisonText(bandName);
            var localAlbums = await _context.Albums
                .AsNoTracking()
                .Include(album => album.Band)
                .Include(album => album.Status)
                .ToListAsync(cancellationToken);
            localAlbums = localAlbums
                .Where(album => NormalizeComparisonText(album.Band?.Band) == bandKey)
                .ToList();

            var localByTitle = localAlbums
                .GroupBy(album => NormalizeComparisonText(album.Title))
                .ToDictionary(group => group.Key, group => group.ToList());

            return releases.Select(release =>
            {
                var key = NormalizeComparisonText(release.Title);
                localByTitle.TryGetValue(key, out var matches);
                var match = matches?.FirstOrDefault();
                if (match is null)
                {
                    return new MusicMetalArchivesReleaseComparisonDto(
                        release.MetalArchivesId,
                        release.Title,
                        release.ReleaseType,
                        release.Year,
                        release.Url,
                        "Missing",
                        null,
                        null,
                        null,
                        true);
                }

                var status = match.Status?.WantStatusID?.Trim().Equals("W", StringComparison.OrdinalIgnoreCase) == true
                    ? "Wanted"
                    : "Owned";

                return new MusicMetalArchivesReleaseComparisonDto(
                    release.MetalArchivesId,
                    release.Title,
                    release.ReleaseType,
                    release.Year,
                    release.Url,
                    status,
                    match.Title,
                    match.ID,
                    status == "Wanted" ? "Already on want list." : "Already owned.",
                    false);
            }).ToList();
        }
    }



}

