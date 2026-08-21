using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;
using Verdelak.Api.Services;

namespace Verdelak.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/external-imports")]
public class ExternalImportsController(
    VerdelakDbContext context,
    ISteamLibraryImportService steamLibraryImportService,
    IBoardGameGeekImportService boardGameGeekImportService) : ControllerBase
{
    private const string SoftwareTarget = "Software";
    private const string BoardGamesTarget = "BoardGames";

    [HttpGet("batches")]
    public async Task<ActionResult<IEnumerable<ExternalImportBatchDto>>> GetBatches(
        [FromQuery] string? source,
        [FromQuery] string? targetArea,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var query = context.ExternalImportBatches
            .AsNoTracking()
            .Include(batch => batch.Items)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(source))
        {
            query = query.Where(batch => batch.Source == source.Trim());
        }

        if (!string.IsNullOrWhiteSpace(targetArea))
        {
            query = query.Where(batch => batch.TargetArea == targetArea.Trim());
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(batch => batch.Status == status.Trim());
        }

        return await query
            .OrderByDescending(batch => batch.CreatedAtUtc)
            .Select(batch => ToDto(batch))
            .ToListAsync(cancellationToken);
    }

    [HttpGet("items")]
    public async Task<ActionResult<IEnumerable<ExternalImportStagingItemDto>>> GetItems(
        [FromQuery] int? batchId,
        [FromQuery] string? source,
        [FromQuery] string? targetArea,
        [FromQuery] string? status,
        [FromQuery] string? matchStatus,
        CancellationToken cancellationToken)
    {
        var query = context.ExternalImportStagingItems.AsNoTracking();

        if (batchId is not null)
        {
            query = query.Where(item => item.BatchId == batchId);
        }

        if (!string.IsNullOrWhiteSpace(source))
        {
            query = query.Where(item => item.Source == source.Trim());
        }

        if (!string.IsNullOrWhiteSpace(targetArea))
        {
            query = query.Where(item => item.TargetArea == targetArea.Trim());
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(item => item.Status == status.Trim());
        }

        if (!string.IsNullOrWhiteSpace(matchStatus))
        {
            query = query.Where(item => item.MatchStatus == matchStatus.Trim());
        }

        return await query
            .OrderByDescending(item => item.CreatedAtUtc)
            .ThenBy(item => item.Title)
            .Take(1000)
            .Select(item => ToDto(item))
            .ToListAsync(cancellationToken);
    }

    [HttpPost("batches")]
    public async Task<ActionResult<ExternalImportBatchDto>> StageBatch(
        ExternalImportStageBatchRequest request,
        CancellationToken cancellationToken)
    {
        var source = NormalizeChoice(request.Source, "Manual");
        var targetArea = NormalizeChoice(request.TargetArea, SoftwareTarget);
        var rows = request.Items
            .Where(item => !string.IsNullOrWhiteSpace(item.Title))
            .GroupBy(item => new
            {
                ExternalId = NormalizeText(item.ExternalId),
                Title = NormalizeComparisonText(item.Title),
                Source = source,
                TargetArea = targetArea
            })
            .Select(group => group.First())
            .ToList();

        if (rows.Count == 0)
        {
            return BadRequest("At least one staged item with a title is required.");
        }

        var now = DateTime.UtcNow;
        var batch = new ExternalImportBatch
        {
            Source = source,
            TargetArea = targetArea,
            BatchName = string.IsNullOrWhiteSpace(request.BatchName)
                ? $"{source} import {now:yyyy-MM-dd HH:mm}"
                : request.BatchName.Trim(),
            Notes = Trim(request.Notes),
            CreatedAtUtc = now
        };

        batch.Items = rows.Select(row => new ExternalImportStagingItem
        {
            Source = source,
            TargetArea = targetArea,
            ExternalId = Trim(row.ExternalId),
            Title = row.Title.Trim(),
            PlatformName = Trim(row.PlatformName),
            LocationName = Trim(row.LocationName),
            Publisher = Trim(row.Publisher),
            Developer = Trim(row.Developer),
            VersionEdition = Trim(row.VersionEdition),
            MediaType = Trim(row.MediaType),
            ArtworkUrl = Trim(row.ArtworkUrl),
            Notes = Trim(row.Notes),
            RawJson = string.IsNullOrWhiteSpace(row.RawJson) ? JsonSerializer.Serialize(row) : row.RawJson,
            CreatedAtUtc = now
        }).ToList();

        context.ExternalImportBatches.Add(batch);
        await context.SaveChangesAsync(cancellationToken);
        await PreviewBatchInternal(batch.Id, true, cancellationToken);

        var saved = await context.ExternalImportBatches
            .AsNoTracking()
            .Include(item => item.Items)
            .SingleAsync(item => item.Id == batch.Id, cancellationToken);

        return CreatedAtAction(nameof(GetBatches), new { id = batch.Id }, ToDto(saved));
    }

    [HttpPost("steam/stage")]
    public async Task<ActionResult<SteamImportStageResultDto>> StageSteamLibrary(
        SteamImportStageRequest request,
        CancellationToken cancellationToken)
    {
        var settings = await ReadSteamImporterSettings(cancellationToken);
        if (string.IsNullOrWhiteSpace(settings.ApiKey) || string.IsNullOrWhiteSpace(settings.SteamId))
        {
            return BadRequest("Steam API key and SteamID64 are required in Admin import settings.");
        }

        IReadOnlyList<SteamOwnedGameDto> games;
        try
        {
            games = await steamLibraryImportService.GetOwnedGamesAsync(
                settings.ApiKey,
                settings.SteamId,
                request.IncludePlayedFreeGames || settings.IncludePlayedFreeGames,
                settings.IncludeAppInfo,
                cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            return Problem($"Steam owned-games lookup failed: {ex.Message}");
        }

        if (games.Count == 0)
        {
            return BadRequest("Steam did not return any owned games. Check the SteamID64, API key, and profile game-details privacy.");
        }

        var now = DateTime.UtcNow;
        var batch = new ExternalImportBatch
        {
            Source = "Steam",
            TargetArea = SoftwareTarget,
            BatchName = string.IsNullOrWhiteSpace(request.BatchName)
                ? $"Steam import {now:yyyy-MM-dd HH:mm}"
                : request.BatchName.Trim(),
            Notes = $"Imported from Steam Web API for SteamID64 {settings.SteamId}.",
            CreatedAtUtc = now
        };

        batch.Items = games.Select(game => new ExternalImportStagingItem
        {
            Source = "Steam",
            TargetArea = SoftwareTarget,
            ExternalId = game.AppId.ToString(),
            Title = game.Name,
            PlatformName = "PC",
            LocationName = "Steam",
            MediaType = "Digital",
            ArtworkUrl = game.LogoUrl ?? game.IconUrl,
            Notes = game.PlaytimeForever > 0
                ? $"Steam playtime: {game.PlaytimeForever} minute(s)."
                : null,
            RawJson = JsonSerializer.Serialize(game),
            CreatedAtUtc = now
        }).ToList();

        context.ExternalImportBatches.Add(batch);
        await context.SaveChangesAsync(cancellationToken);
        var preview = await PreviewBatchInternal(batch.Id, true, cancellationToken);
        var saved = await context.ExternalImportBatches
            .AsNoTracking()
            .SingleAsync(item => item.Id == batch.Id, cancellationToken);

        return new SteamImportStageResultDto(
            saved.Id,
            saved.BatchName,
            preview.TotalCount,
            preview.Items);
    }

    [HttpPost("boardgamegeek/stage")]
    public async Task<ActionResult<BoardGameGeekImportStageResultDto>> StageBoardGameGeekCollection(
        BoardGameGeekImportStageRequest request,
        CancellationToken cancellationToken)
    {
        var settings = await ReadBoardGameGeekImporterSettings(cancellationToken);
        var username = string.IsNullOrWhiteSpace(request.Username) ? settings.Username : request.Username.Trim();
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest("BoardGameGeek username is required.");
        }

        var includeOwned = request.IncludeOwned || (!request.IncludeOwned && !request.IncludeWishlist);
        var includeWishlist = request.IncludeWishlist;
        var includeExpansions = request.IncludeExpansions;

        IReadOnlyList<BoardGameGeekCollectionItemDto> games;
        try
        {
            games = await boardGameGeekImportService.GetCollectionAsync(
                username,
                includeOwned,
                includeWishlist,
                includeExpansions,
                cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            return BadRequest($"BoardGameGeek collection lookup failed: {ex.Message}");
        }

        if (games.Count == 0)
        {
            return BadRequest("BoardGameGeek did not return any collection items. Check the username and collection privacy.");
        }

        var now = DateTime.UtcNow;
        var batch = new ExternalImportBatch
        {
            Source = "BoardGameGeek",
            TargetArea = BoardGamesTarget,
            BatchName = string.IsNullOrWhiteSpace(request.BatchName)
                ? $"BoardGameGeek import {now:yyyy-MM-dd HH:mm}"
                : request.BatchName.Trim(),
            Notes = $"Imported from BoardGameGeek XML API2 for user {username}.",
            CreatedAtUtc = now
        };

        batch.Items = games.Select(game => new ExternalImportStagingItem
        {
            Source = "BoardGameGeek",
            TargetArea = BoardGamesTarget,
            ExternalId = game.ObjectId,
            Title = game.Name,
            VersionEdition = game.YearPublished is null ? null : game.YearPublished.ToString(),
            MediaType = game.IsExpansion ? "Expansion" : "Board Game",
            ArtworkUrl = game.ImageUrl ?? game.ThumbnailUrl,
            Notes = BuildBoardGameGeekStageNotes(game),
            RawJson = JsonSerializer.Serialize(game),
            CreatedAtUtc = now
        }).ToList();

        context.ExternalImportBatches.Add(batch);
        await context.SaveChangesAsync(cancellationToken);
        var preview = await PreviewBatchInternal(batch.Id, true, cancellationToken);
        var saved = await context.ExternalImportBatches
            .AsNoTracking()
            .SingleAsync(item => item.Id == batch.Id, cancellationToken);

        return new BoardGameGeekImportStageResultDto(
            saved.Id,
            saved.BatchName,
            preview.TotalCount,
            preview.Items);
    }

    [HttpPut("items/{id:int}")]
    public async Task<ActionResult<ExternalImportStagingItemDto>> UpdateItem(
        int id,
        ExternalImportUpdateItemRequest request,
        CancellationToken cancellationToken)
    {
        var item = await context.ExternalImportStagingItems.FindAsync([id], cancellationToken);
        if (item is null)
        {
            return NotFound();
        }

        item.PlatformName = Trim(request.PlatformName);
        item.LocationName = Trim(request.LocationName);
        item.Publisher = Trim(request.Publisher);
        item.Developer = Trim(request.Developer);
        item.VersionEdition = Trim(request.VersionEdition);
        item.MediaType = Trim(request.MediaType);
        item.SelectedAction = NormalizeAction(request.SelectedAction);
        item.Notes = Trim(request.Notes);
        item.UpdatedAtUtc = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        await PreviewBatchInternal(item.BatchId, true, cancellationToken);

        var saved = await context.ExternalImportStagingItems.AsNoTracking().SingleAsync(row => row.Id == id, cancellationToken);
        return ToDto(saved);
    }

    [HttpPost("batches/{batchId:int}/preview")]
    public async Task<ActionResult<ExternalImportPreviewResultDto>> PreviewBatch(
        int batchId,
        CancellationToken cancellationToken)
    {
        return await PreviewBatchInternal(batchId, true, cancellationToken);
    }

    [HttpPost("commit")]
    public async Task<ActionResult<ExternalImportCommitResultDto>> Commit(
        ExternalImportCommitRequest request,
        CancellationToken cancellationToken)
    {
        var query = context.ExternalImportStagingItems.AsQueryable();
        if (request.Ids.Count > 0)
        {
            var ids = request.Ids.Distinct().ToList();
            query = query.Where(item => ids.Contains(item.Id));
        }
        else if (request.BatchId is not null)
        {
            query = query.Where(item => item.BatchId == request.BatchId);
        }
        else
        {
            query = query.Where(item => item.Status == "Staged");
        }

        if (request.ImportOnlySelected)
        {
            query = query.Where(item => item.SelectedAction == "Import");
        }

        var items = await query
            .OrderBy(item => item.BatchId)
            .ThenBy(item => item.Title)
            .ToListAsync(cancellationToken);

        var imported = 0;
        var skipped = 0;
        var messages = new List<string>();
        foreach (var item in items)
        {
            if (item.TargetArea.Equals(BoardGamesTarget, StringComparison.OrdinalIgnoreCase))
            {
                if (item.Status == "Imported" || item.SelectedAction != "Import")
                {
                    skipped++;
                    messages.Add($"{item.Title}: skipped.");
                    continue;
                }

                var importedGame = await ImportBoardGame(item, cancellationToken);
                item.Status = "Imported";
                item.SelectedAction = "Imported";
                item.ImportedEntityType = BoardGamesTarget;
                item.ImportedEntityId = importedGame.GameID;
                item.ImportedAtUtc = DateTime.UtcNow;
                item.UpdatedAtUtc = DateTime.UtcNow;
                imported++;
                messages.Add($"{item.Title}: imported as Board Game #{importedGame.GameID}.");
                continue;
            }

            if (!item.TargetArea.Equals(SoftwareTarget, StringComparison.OrdinalIgnoreCase))
            {
                skipped++;
                messages.Add($"{item.Title}: skipped because {item.TargetArea} commit is not implemented yet.");
                continue;
            }

            if (item.Status == "Imported" || item.SelectedAction != "Import")
            {
                skipped++;
                messages.Add($"{item.Title}: skipped.");
                continue;
            }

            var platform = await ResolvePlatform(item.PlatformName, cancellationToken);
            if (platform is null)
            {
                skipped++;
                item.MatchStatus = "MissingPlatform";
                item.UpdatedAtUtc = DateTime.UtcNow;
                messages.Add($"{item.Title}: skipped because platform is missing from Admin Settings.");
                continue;
            }

            var location = await ResolveLocation(item.LocationName, cancellationToken);
            var software = new Software
            {
                Title = item.Title.Trim(),
                StatusID = "H",
                Platform = platform,
                Location = location,
                Publisher = Trim(item.Publisher),
                Developer = Trim(item.Developer),
                VersionEdition = Trim(item.VersionEdition),
                MediaType = Trim(item.MediaType) ?? "Digital",
                HasBox = false,
                HasManual = false,
                HasDisc = false,
                Notes = BuildSoftwareImportNotes(item, location is null && !string.IsNullOrWhiteSpace(item.LocationName))
            };

            context.Software.Add(software);
            await context.SaveChangesAsync(cancellationToken);

            item.Status = "Imported";
            item.SelectedAction = "Imported";
            item.ImportedEntityType = SoftwareTarget;
            item.ImportedEntityId = software.ID;
            item.ImportedAtUtc = DateTime.UtcNow;
            item.UpdatedAtUtc = DateTime.UtcNow;
            imported++;
            messages.Add($"{item.Title}: imported as Software #{software.ID}.");
        }

        await context.SaveChangesAsync(cancellationToken);
        await CloseFullyImportedBatches(items.Select(item => item.BatchId).Distinct().ToList(), cancellationToken);

        return new ExternalImportCommitResultDto(imported, skipped, messages);
    }

    private async Task<ExternalImportPreviewResultDto> PreviewBatchInternal(
        int batchId,
        bool persist,
        CancellationToken cancellationToken)
    {
        var items = await context.ExternalImportStagingItems
            .Where(item => item.BatchId == batchId)
            .OrderBy(item => item.Title)
            .ToListAsync(cancellationToken);

        if (items.Count == 0)
        {
            return new ExternalImportPreviewResultDto(0, 0, 0, 0, 0, []);
        }

        var targetArea = items.Select(item => item.TargetArea).Distinct(StringComparer.OrdinalIgnoreCase).SingleOrDefault();
        if (string.Equals(targetArea, BoardGamesTarget, StringComparison.OrdinalIgnoreCase))
        {
            var games = await context.Games.AsNoTracking().ToListAsync(cancellationToken);
            foreach (var item in items)
            {
                ApplyBoardGameMatch(item, games);
            }
        }
        else
        {
            var platformNames = await context.SoftwarePlatforms.AsNoTracking().Select(item => item.Platform).ToListAsync(cancellationToken);
            var platformSet = platformNames.ToHashSet(StringComparer.OrdinalIgnoreCase);
            var software = await context.Software
                .AsNoTracking()
                .Include(item => item.Platform)
                .Include(item => item.Location)
                .ToListAsync(cancellationToken);

            foreach (var item in items)
            {
                ApplyMatch(item, software, platformSet);
            }
        }

        if (persist)
        {
            await context.SaveChangesAsync(cancellationToken);
        }

        return new ExternalImportPreviewResultDto(
            items.Count,
            items.Count(item => item.MatchStatus == "MissingFromDatabase"),
            items.Count(item => item.MatchStatus is "OwnedElsewhere" or "PossibleDuplicate" or "OwnedOnSteamOnly" or "OwnedOnGogOnly" or "OwnedOnBoth"),
            items.Count(item => item.MatchStatus is "AlreadyInDatabase" or "OwnedOnBoth"),
            items.Count(item => item.MatchStatus == "MissingPlatform"),
            items.Select(ToDto).ToList());
    }

    private static void ApplyBoardGameMatch(
        ExternalImportStagingItem item,
        IReadOnlyList<Game> games)
    {
        if (item.Status == "Imported")
        {
            item.MatchStatus = "AlreadyImported";
            return;
        }

        var titleKey = NormalizeComparisonText(item.Title);
        var match = games.FirstOrDefault(game => NormalizeComparisonText(game.Title) == titleKey);
        if (match is null)
        {
            item.MatchStatus = "MissingFromDatabase";
            item.SelectedAction = item.SelectedAction == "Review" ? "Import" : NormalizeAction(item.SelectedAction);
            item.MatchedEntityType = null;
            item.MatchedEntityId = null;
            item.MatchedTitle = null;
            item.UpdatedAtUtc = DateTime.UtcNow;
            return;
        }

        item.MatchedEntityType = BoardGamesTarget;
        item.MatchedEntityId = match.GameID;
        item.MatchedTitle = match.Title;
        item.MatchStatus = "AlreadyInDatabase";
        item.SelectedAction = "Ignore";
        item.UpdatedAtUtc = DateTime.UtcNow;
    }

    private static void ApplyMatch(
        ExternalImportStagingItem item,
        IReadOnlyList<Software> software,
        ISet<string> platformNames)
    {
        if (item.Status == "Imported")
        {
            item.MatchStatus = "AlreadyImported";
            return;
        }

        if (string.IsNullOrWhiteSpace(item.PlatformName) || !platformNames.Contains(item.PlatformName.Trim()))
        {
            item.MatchStatus = "MissingPlatform";
            item.SelectedAction = "Review";
            item.UpdatedAtUtc = DateTime.UtcNow;
            return;
        }

        var titleKey = NormalizeComparisonText(item.Title);
        var platformKey = NormalizeComparisonText(item.PlatformName);
        var locationKey = NormalizeComparisonText(item.LocationName);
        var sourceKey = NormalizeProviderLocation(item.Source, item.LocationName);
        var matches = software
            .Where(row => NormalizeComparisonText(row.Title) == titleKey)
            .ToList();

        if (matches.Count == 0)
        {
            item.MatchStatus = "MissingFromDatabase";
            item.SelectedAction = item.SelectedAction == "Review" ? "Import" : NormalizeAction(item.SelectedAction);
            item.MatchedEntityType = null;
            item.MatchedEntityId = null;
            item.MatchedTitle = null;
            item.UpdatedAtUtc = DateTime.UtcNow;
            return;
        }

        var samePlatformMatches = string.IsNullOrWhiteSpace(platformKey)
            ? matches
            : matches.Where(row => NormalizeComparisonText(row.Platform?.Platform) == platformKey).ToList();
        if (samePlatformMatches.Count == 0)
        {
            var platformMismatch = matches.First();
            item.MatchedEntityType = SoftwareTarget;
            item.MatchedEntityId = platformMismatch.ID;
            item.MatchedTitle = $"{platformMismatch.Title} ({platformMismatch.Platform?.Platform ?? "Unknown platform"})";
            item.MatchStatus = "PossibleDuplicate";
            item.SelectedAction = "Review";
            item.UpdatedAtUtc = DateTime.UtcNow;
            return;
        }

        var providerLocations = samePlatformMatches
            .Select(row => NormalizeProviderLocation(null, row.Location?.Location))
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var sameLocation = samePlatformMatches.FirstOrDefault(row => NormalizeComparisonText(row.Location?.Location) == locationKey);
        var match = sameLocation ?? samePlatformMatches.First();
        item.MatchedEntityType = SoftwareTarget;
        item.MatchedEntityId = match.ID;
        item.MatchedTitle = match.Title;
        item.MatchStatus = SoftwareMatchStatus(sourceKey, providerLocations, sameLocation is not null, string.IsNullOrWhiteSpace(item.LocationName));
        item.SelectedAction = (item.MatchStatus is "AlreadyInDatabase" or "OwnedOnBoth")
            || (!string.IsNullOrWhiteSpace(sourceKey) && providerLocations.Contains(sourceKey))
            ? "Ignore"
            : NormalizeAction(item.SelectedAction);
        item.Notes = AppendMatchNote(item.Notes, providerLocations);
        item.UpdatedAtUtc = DateTime.UtcNow;
    }

    private async Task<SoftwarePlatform?> ResolvePlatform(string? platformName, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(platformName))
        {
            return null;
        }

        var normalized = platformName.Trim();
        return await context.SoftwarePlatforms.FirstOrDefaultAsync(
            item => item.Platform == normalized,
            cancellationToken);
    }

    private async Task<SoftwareLocation?> ResolveLocation(string? locationName, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(locationName))
        {
            return null;
        }

        var normalized = locationName.Trim();
        return await context.SoftwareLocations.FirstOrDefaultAsync(
            item => item.Location == normalized,
            cancellationToken);
    }

    private async Task<SteamImporterSettingsDto> ReadSteamImporterSettings(CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == AdminSettingsController.SteamImporterSettingsKey, cancellationToken);
        if (setting is null || string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            return new SteamImporterSettingsDto(null, null, true, true);
        }

        try
        {
            return JsonSerializer.Deserialize<SteamImporterSettingsDto>(setting.ValueJson) ?? new SteamImporterSettingsDto(null, null, true, true);
        }
        catch (JsonException)
        {
            return new SteamImporterSettingsDto(null, null, true, true);
        }
    }

    private async Task<BoardGameGeekImporterSettingsDto> ReadBoardGameGeekImporterSettings(CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == AdminSettingsController.BoardGameGeekImporterSettingsKey, cancellationToken);
        if (setting is null || string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            return new BoardGameGeekImporterSettingsDto(null, true, false, false);
        }

        try
        {
            return JsonSerializer.Deserialize<BoardGameGeekImporterSettingsDto>(setting.ValueJson)
                ?? new BoardGameGeekImporterSettingsDto(null, true, false, false);
        }
        catch (JsonException)
        {
            return new BoardGameGeekImporterSettingsDto(null, true, false, false);
        }
    }

    private async Task<Game> ImportBoardGame(ExternalImportStagingItem item, CancellationToken cancellationToken)
    {
        BoardGameGeekCollectionItemDto? imported = null;
        if (!string.IsNullOrWhiteSpace(item.RawJson))
        {
            try
            {
                imported = JsonSerializer.Deserialize<BoardGameGeekCollectionItemDto>(item.RawJson);
            }
            catch (JsonException)
            {
                imported = null;
            }
        }

        var game = new Game
        {
            Title = item.Title.Trim(),
            IsExpansion = string.Equals(item.MediaType, "Expansion", StringComparison.OrdinalIgnoreCase) || imported?.IsExpansion == true,
            BGG_Rating = imported?.AverageRating,
            Owns = imported?.Owns ?? true,
            Wishlist = imported?.Wishlist ?? false,
            Notes = BuildBoardGameImportNotes(item, imported)
        };

        context.Games.Add(game);
        await context.SaveChangesAsync(cancellationToken);
        return game;
    }

    private async Task CloseFullyImportedBatches(IReadOnlyList<int> batchIds, CancellationToken cancellationToken)
    {
        var batches = await context.ExternalImportBatches
            .Include(batch => batch.Items)
            .Where(batch => batchIds.Contains(batch.Id))
            .ToListAsync(cancellationToken);

        foreach (var batch in batches)
        {
            if (batch.Items.Count > 0 && batch.Items.All(item => item.Status == "Imported" || item.SelectedAction == "Ignore"))
            {
                batch.Status = "Completed";
                batch.UpdatedAtUtc = DateTime.UtcNow;
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    private static ExternalImportBatchDto ToDto(ExternalImportBatch batch) =>
        new(
            batch.Id,
            batch.Source,
            batch.TargetArea,
            batch.BatchName,
            batch.Status,
            batch.Notes,
            batch.Items.Count,
            batch.Items.Count(item => item.SelectedAction == "Import" && item.Status != "Imported"),
            batch.Items.Count(item => item.Status == "Imported"),
            batch.CreatedAtUtc,
            batch.UpdatedAtUtc);

    private static ExternalImportStagingItemDto ToDto(ExternalImportStagingItem item) =>
        new(
            item.Id,
            item.BatchId,
            item.Source,
            item.TargetArea,
            item.ExternalId,
            item.Title,
            item.PlatformName,
            item.LocationName,
            item.Publisher,
            item.Developer,
            item.VersionEdition,
            item.MediaType,
            item.ArtworkUrl,
            item.Status,
            item.MatchStatus,
            item.SelectedAction,
            item.MatchedEntityType,
            item.MatchedEntityId,
            item.MatchedTitle,
            item.Notes,
            item.ImportedEntityType,
            item.ImportedEntityId,
            item.ImportedAtUtc,
            item.CreatedAtUtc,
            item.UpdatedAtUtc);

    private static string BuildSoftwareImportNotes(ExternalImportStagingItem item, bool unknownLocation)
    {
        var lines = new List<string> { $"Imported from {item.Source} staging." };
        if (!string.IsNullOrWhiteSpace(item.ExternalId))
        {
            lines.Add($"External ID: {item.ExternalId}");
        }

        if (!string.IsNullOrWhiteSpace(item.ArtworkUrl))
        {
            lines.Add($"Artwork: {item.ArtworkUrl}");
        }

        if (unknownLocation)
        {
            lines.Add($"Original source location was not in Admin Settings: {item.LocationName}");
        }

        if (!string.IsNullOrWhiteSpace(item.Notes))
        {
            lines.Add(item.Notes.Trim());
        }

        return string.Join(Environment.NewLine, lines);
    }

    private static string BuildBoardGameGeekStageNotes(BoardGameGeekCollectionItemDto item)
    {
        var lines = new List<string>();
        if (item.YearPublished is not null)
        {
            lines.Add($"Published: {item.YearPublished}");
        }

        lines.Add(item.Owns ? "BGG status: Owned." : "BGG status: Not owned.");
        if (item.Wishlist)
        {
            lines.Add("BGG status: Wishlist.");
        }

        if (item.NumPlays is not null)
        {
            lines.Add($"BGG plays: {item.NumPlays}");
        }

        if (item.UserRating is not null)
        {
            lines.Add($"Your BGG rating: {item.UserRating}");
        }

        if (item.AverageRating is not null)
        {
            lines.Add($"BGG average rating: {item.AverageRating}");
        }

        return string.Join(Environment.NewLine, lines);
    }

    private static string BuildBoardGameImportNotes(ExternalImportStagingItem item, BoardGameGeekCollectionItemDto? imported)
    {
        var lines = new List<string> { $"Imported from {item.Source} staging." };
        if (!string.IsNullOrWhiteSpace(item.ExternalId))
        {
            lines.Add($"BoardGameGeek ID: {item.ExternalId}");
            lines.Add($"BoardGameGeek URL: https://boardgamegeek.com/boardgame/{item.ExternalId}");
        }

        if (!string.IsNullOrWhiteSpace(item.ArtworkUrl))
        {
            lines.Add($"Artwork: {item.ArtworkUrl}");
        }

        if (!string.IsNullOrWhiteSpace(item.VersionEdition))
        {
            lines.Add($"Published: {item.VersionEdition}");
        }

        if (imported?.NumPlays is not null)
        {
            lines.Add($"BGG plays: {imported.NumPlays}");
        }

        if (!string.IsNullOrWhiteSpace(item.Notes))
        {
            lines.Add(item.Notes.Trim());
        }

        return string.Join(Environment.NewLine, lines);
    }

    private static string NormalizeChoice(string? value, string fallback) =>
        string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();

    private static string NormalizeAction(string? value)
    {
        var normalized = value?.Trim();
        return normalized switch
        {
            "Ignore" or "Review" or "Import" or "Imported" => normalized,
            _ => "Import"
        };
    }

    private static string? Trim(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string NormalizeText(string? value) => value?.Trim() ?? string.Empty;

    private static string SoftwareMatchStatus(
        string sourceKey,
        ISet<string> providerLocations,
        bool sameLocation,
        bool missingSourceLocation)
    {
        var hasSteam = providerLocations.Contains("Steam");
        var hasGog = providerLocations.Contains("GOG");

        if (hasSteam && hasGog)
        {
            return "OwnedOnBoth";
        }

        if (hasSteam)
        {
            return "OwnedOnSteamOnly";
        }

        if (hasGog)
        {
            return "OwnedOnGogOnly";
        }

        return sameLocation || missingSourceLocation ? "AlreadyInDatabase" : "OwnedElsewhere";
    }

    private static string NormalizeProviderLocation(string? source, string? location)
    {
        var value = string.IsNullOrWhiteSpace(location) ? source : location;
        var normalized = NormalizeComparisonText(value);
        return normalized switch
        {
            "STEAM" => "Steam",
            "GOG" or "GOODOLDGAMES" => "GOG",
            "EPIC" or "EPICGAMES" or "EPICGAMESSTORE" => "Epic",
            "EA" or "EADESKTOP" or "ORIGIN" => "EA",
            "MICROSOFT" or "MICROSOFTSTORE" or "XBOX" => "Microsoft",
            "LOCAL" or "DISC" or "PHYSICAL" => "Local",
            _ => string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim()
        };
    }

    private static string? AppendMatchNote(string? notes, ISet<string> providerLocations)
    {
        if (providerLocations.Count == 0)
        {
            return notes;
        }

        var summary = $"Matched existing software locations: {string.Join(", ", providerLocations.OrderBy(value => value))}.";
        if (notes?.Contains("Matched existing software locations:", StringComparison.OrdinalIgnoreCase) == true)
        {
            return notes;
        }

        return string.IsNullOrWhiteSpace(notes) ? summary : $"{notes.Trim()}{Environment.NewLine}{summary}";
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
}
