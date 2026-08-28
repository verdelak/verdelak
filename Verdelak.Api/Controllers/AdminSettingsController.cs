using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/admin/settings")]
public class AdminSettingsController(VerdelakDbContext context) : ControllerBase
{
    private const string FishReportThresholdsKey = "Fish.ReportThresholds";
    private const string ShoppingCategoriesKey = "Shopping.Categories";
    private const string RecipeLookupSettingsKey = "Recipe.LookupSettings";
    public const string AlcoholLookupSettingsKey = "Alcohol.LookupSettings";
    private const string FinanceTrackerSettingsKey = "Finance.TrackerSettings";
    private const string ExternalSitesSettingsKey = "ExternalSites.Settings";
    private const string MainAppearanceSettingsKey = "Appearance.Main";
    private const string CdSiteAppearanceSettingsKey = "Appearance.CdSite";
    private const string DinoSiteAppearanceSettingsKey = "Appearance.DinoSite";
    private const string BlogAppearanceSettingsKey = "Appearance.Blog";
    private const string FilmReviewAppearanceSettingsKey = "Appearance.FilmReview";
    public const string SteamImporterSettingsKey = "Imports.Steam";
    public const string BoardGameGeekImporterSettingsKey = "Imports.BoardGameGeek";
    public const string MusicFolderImporterSettingsKey = "Imports.MusicFolders";
    public const string BarcodeLookupSettingsKey = "Barcode.LookupSettings";
    private static readonly string[] DefaultAlcoholCategories = ["Absinthe", "Beer", "Cider", "Mead", "Wine", "Liquor", "Mixes", "Drinks"];
    private static readonly string[] DefaultAlcoholLocations = ["Refrigerator", "Wine Rack", "Pantry", "Basement", "Turtle Room", "Kitchen", "Closet"];
    private static readonly string[] DefaultSoftwarePlatforms = ["PC", "Windows", "Mac", "Linux", "DOS", "Console", "Mobile", "Web"];
    private static readonly string[] DefaultSoftwareLocations = ["GOG", "Steam", "EA", "Epic Games", "Microsoft", "Local"];

    [HttpGet("fish-report-thresholds")]
    public async Task<ActionResult<FishReportThresholdsDto>> GetFishReportThresholds(CancellationToken cancellationToken)
    {
        return await ReadFishReportThresholds(cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("fish-report-thresholds")]
    public async Task<ActionResult<FishReportThresholdsDto>> UpdateFishReportThresholds(
        FishReportThresholdsDto dto,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(dto);
        var valueJson = JsonSerializer.Serialize(normalized);
        var setting = await context.AppSettings.SingleOrDefaultAsync(item => item.Key == FishReportThresholdsKey, cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = FishReportThresholdsKey };
            context.AppSettings.Add(setting);
        }

        setting.ValueJson = valueJson;
        setting.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return normalized;
    }

    [HttpGet("shopping-categories")]
    public async Task<ActionResult<ShoppingCategoriesDto>> GetShoppingCategories(CancellationToken cancellationToken)
    {
        return await ReadShoppingCategories(cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("shopping-categories")]
    public async Task<ActionResult<ShoppingCategoriesDto>> UpdateShoppingCategories(
        ShoppingCategoriesDto dto,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(dto);
        var setting = await context.AppSettings.SingleOrDefaultAsync(item => item.Key == ShoppingCategoriesKey, cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = ShoppingCategoriesKey };
            context.AppSettings.Add(setting);
        }

        setting.ValueJson = JsonSerializer.Serialize(normalized);
        setting.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return normalized;
    }

    [HttpGet("recipe-lookups")]
    public async Task<ActionResult<RecipeLookupSettingsDto>> GetRecipeLookups(CancellationToken cancellationToken)
    {
        return await ReadRecipeLookups(cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("recipe-lookups")]
    public async Task<ActionResult<RecipeLookupSettingsDto>> UpdateRecipeLookups(
        RecipeLookupSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(dto);
        var setting = await context.AppSettings.SingleOrDefaultAsync(item => item.Key == RecipeLookupSettingsKey, cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = RecipeLookupSettingsKey };
            context.AppSettings.Add(setting);
        }

        foreach (var tagName in normalized.Tags)
        {
            var slug = BlogController.Slugify(tagName);
            var existingTag = await context.RecipeTags.FirstOrDefaultAsync(tag => tag.Slug == slug, cancellationToken);
            if (existingTag is null)
            {
                context.RecipeTags.Add(new RecipeTag { Name = tagName, Slug = slug });
            }
            else
            {
                existingTag.Name = tagName;
            }
        }

        setting.ValueJson = JsonSerializer.Serialize(normalized);
        setting.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return normalized;
    }

    [HttpGet("alcohol-lookups")]
    public async Task<ActionResult<AlcoholLookupSettingsDto>> GetAlcoholLookups(CancellationToken cancellationToken)
    {
        return await ReadAlcoholLookups(cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("alcohol-lookups")]
    public async Task<ActionResult<AlcoholLookupSettingsDto>> UpdateAlcoholLookups(
        AlcoholLookupSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(dto);
        var setting = await context.AppSettings.SingleOrDefaultAsync(item => item.Key == AlcoholLookupSettingsKey, cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = AlcoholLookupSettingsKey };
            context.AppSettings.Add(setting);
        }

        setting.ValueJson = JsonSerializer.Serialize(normalized);
        setting.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return normalized;
    }

    [HttpGet("barcode-lookups")]
    public async Task<ActionResult<BarcodeLookupSettingsDto>> GetBarcodeLookups(CancellationToken cancellationToken)
    {
        return await ReadBarcodeLookups(cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("barcode-lookups")]
    public async Task<ActionResult<BarcodeLookupSettingsDto>> UpdateBarcodeLookups(
        BarcodeLookupSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(dto);
        var setting = await context.AppSettings.SingleOrDefaultAsync(item => item.Key == BarcodeLookupSettingsKey, cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = BarcodeLookupSettingsKey };
            context.AppSettings.Add(setting);
        }

        setting.ValueJson = JsonSerializer.Serialize(normalized);
        setting.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return normalized;
    }

    [HttpGet("finance-tracker")]
    public async Task<ActionResult<FinanceTrackerSettingsDto>> GetFinanceTrackerSettings(CancellationToken cancellationToken)
    {
        return await ReadFinanceTrackerSettings(cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("finance-tracker")]
    public async Task<ActionResult<FinanceTrackerSettingsDto>> UpdateFinanceTrackerSettings(
        FinanceTrackerSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(dto);
        var setting = await context.AppSettings.SingleOrDefaultAsync(item => item.Key == FinanceTrackerSettingsKey, cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = FinanceTrackerSettingsKey };
            context.AppSettings.Add(setting);
        }

        setting.ValueJson = JsonSerializer.Serialize(normalized);
        setting.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return normalized;
    }

    [HttpGet("external-sites")]
    public async Task<ActionResult<ExternalSitesSettingsDto>> GetExternalSites(CancellationToken cancellationToken)
    {
        return await ReadExternalSites(cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("external-sites")]
    public async Task<ActionResult<ExternalSitesSettingsDto>> UpdateExternalSites(
        ExternalSitesSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(dto);
        var setting = await context.AppSettings.SingleOrDefaultAsync(item => item.Key == ExternalSitesSettingsKey, cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = ExternalSitesSettingsKey };
            context.AppSettings.Add(setting);
        }

        setting.ValueJson = JsonSerializer.Serialize(normalized);
        setting.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return normalized;
    }

    [HttpGet("main-appearance")]
    public async Task<ActionResult<MainAppearanceSettingsDto>> GetMainAppearance(CancellationToken cancellationToken)
    {
        return await ReadMainAppearance(cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("main-appearance")]
    public async Task<ActionResult<MainAppearanceSettingsDto>> UpdateMainAppearance(
        MainAppearanceSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(dto);
        var setting = await context.AppSettings.SingleOrDefaultAsync(item => item.Key == MainAppearanceSettingsKey, cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = MainAppearanceSettingsKey };
            context.AppSettings.Add(setting);
        }

        setting.ValueJson = JsonSerializer.Serialize(normalized);
        setting.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return normalized;
    }

    [HttpGet("cd-site-appearance")]
    public async Task<ActionResult<MainAppearanceSettingsDto>> GetCdSiteAppearance(CancellationToken cancellationToken)
    {
        return await ReadAppearance(CdSiteAppearanceSettingsKey, CdSiteAppearanceDefaults(), cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("cd-site-appearance")]
    public async Task<ActionResult<MainAppearanceSettingsDto>> UpdateCdSiteAppearance(
        MainAppearanceSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(dto, CdSiteAppearanceDefaults());
        var setting = await context.AppSettings.SingleOrDefaultAsync(item => item.Key == CdSiteAppearanceSettingsKey, cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = CdSiteAppearanceSettingsKey };
            context.AppSettings.Add(setting);
        }

        setting.ValueJson = JsonSerializer.Serialize(normalized);
        setting.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return normalized;
    }

    [HttpGet("dino-site-appearance")]
    public async Task<ActionResult<MainAppearanceSettingsDto>> GetDinoSiteAppearance(CancellationToken cancellationToken)
    {
        return await ReadAppearance(DinoSiteAppearanceSettingsKey, DinoSiteAppearanceDefaults(), cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("dino-site-appearance")]
    public async Task<ActionResult<MainAppearanceSettingsDto>> UpdateDinoSiteAppearance(
        MainAppearanceSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(dto, DinoSiteAppearanceDefaults());
        var setting = await context.AppSettings.SingleOrDefaultAsync(item => item.Key == DinoSiteAppearanceSettingsKey, cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = DinoSiteAppearanceSettingsKey };
            context.AppSettings.Add(setting);
        }

        setting.ValueJson = JsonSerializer.Serialize(normalized);
        setting.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return normalized;
    }

    [HttpGet("blog-appearance")]
    public async Task<ActionResult<MainAppearanceSettingsDto>> GetBlogAppearance(CancellationToken cancellationToken)
    {
        return await ReadAppearance(BlogAppearanceSettingsKey, BlogAppearanceDefaults(), cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("blog-appearance")]
    public async Task<ActionResult<MainAppearanceSettingsDto>> UpdateBlogAppearance(
        MainAppearanceSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(dto, BlogAppearanceDefaults());
        var setting = await context.AppSettings.SingleOrDefaultAsync(item => item.Key == BlogAppearanceSettingsKey, cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = BlogAppearanceSettingsKey };
            context.AppSettings.Add(setting);
        }

        setting.ValueJson = JsonSerializer.Serialize(normalized);
        setting.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return normalized;
    }

    [HttpGet("film-review-appearance")]
    public async Task<ActionResult<MainAppearanceSettingsDto>> GetFilmReviewAppearance(CancellationToken cancellationToken)
    {
        return await ReadAppearance(FilmReviewAppearanceSettingsKey, FilmReviewAppearanceDefaults(), cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("film-review-appearance")]
    public async Task<ActionResult<MainAppearanceSettingsDto>> UpdateFilmReviewAppearance(
        MainAppearanceSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(dto, FilmReviewAppearanceDefaults());
        var setting = await context.AppSettings.SingleOrDefaultAsync(item => item.Key == FilmReviewAppearanceSettingsKey, cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = FilmReviewAppearanceSettingsKey };
            context.AppSettings.Add(setting);
        }

        setting.ValueJson = JsonSerializer.Serialize(normalized);
        setting.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return normalized;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("steam-importer")]
    public async Task<ActionResult<SteamImporterSettingsDto>> GetSteamImporterSettings(CancellationToken cancellationToken)
    {
        return await ReadSteamImporterSettings(cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("steam-importer")]
    public async Task<ActionResult<SteamImporterSettingsDto>> UpdateSteamImporterSettings(
        SteamImporterSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(dto);
        var setting = await context.AppSettings.SingleOrDefaultAsync(item => item.Key == SteamImporterSettingsKey, cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = SteamImporterSettingsKey };
            context.AppSettings.Add(setting);
        }

        setting.ValueJson = JsonSerializer.Serialize(normalized);
        setting.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return normalized;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("boardgamegeek-importer")]
    public async Task<ActionResult<BoardGameGeekImporterSettingsDto>> GetBoardGameGeekImporterSettings(CancellationToken cancellationToken)
    {
        return await ReadBoardGameGeekImporterSettings(cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("boardgamegeek-importer")]
    public async Task<ActionResult<BoardGameGeekImporterSettingsDto>> UpdateBoardGameGeekImporterSettings(
        BoardGameGeekImporterSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(dto);
        var setting = await context.AppSettings.SingleOrDefaultAsync(item => item.Key == BoardGameGeekImporterSettingsKey, cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = BoardGameGeekImporterSettingsKey };
            context.AppSettings.Add(setting);
        }

        setting.ValueJson = JsonSerializer.Serialize(normalized);
        setting.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return normalized;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("music-folder-importer")]
    public async Task<ActionResult<MusicFolderImporterSettingsDto>> GetMusicFolderImporterSettings(CancellationToken cancellationToken)
    {
        return await ReadMusicFolderImporterSettings(cancellationToken);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("music-folder-importer")]
    public async Task<ActionResult<MusicFolderImporterSettingsDto>> UpdateMusicFolderImporterSettings(
        MusicFolderImporterSettingsDto dto,
        CancellationToken cancellationToken)
    {
        var normalized = Normalize(dto);
        var setting = await context.AppSettings.SingleOrDefaultAsync(item => item.Key == MusicFolderImporterSettingsKey, cancellationToken);
        if (setting is null)
        {
            setting = new AppSetting { Key = MusicFolderImporterSettingsKey };
            context.AppSettings.Add(setting);
        }

        setting.ValueJson = JsonSerializer.Serialize(normalized);
        setting.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);
        return normalized;
    }

    [HttpGet("software-platforms")]
    public async Task<IEnumerable<SoftwareLookupDto>> GetSoftwarePlatforms(CancellationToken cancellationToken) =>
        await context.SoftwarePlatforms
            .AsNoTracking()
            .OrderBy(platform => platform.Platform)
            .Select(platform => new SoftwareLookupDto(platform.ID, platform.Platform))
            .ToListAsync(cancellationToken);

    [Authorize(Roles = "Admin")]
    [HttpPost("software/defaults")]
    public async Task<ActionResult<SoftwareDefaultsSeedResultDto>> SeedSoftwareDefaults(CancellationToken cancellationToken)
    {
        var platformsCreated = await AddMissingSoftwarePlatforms(DefaultSoftwarePlatforms, cancellationToken);
        var locationsCreated = await AddMissingSoftwareLocations(DefaultSoftwareLocations, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        return new SoftwareDefaultsSeedResultDto(platformsCreated, locationsCreated);
    }

    [HttpGet("software-platforms/{id:int}/usage")]
    public async Task<ActionResult<SoftwarePlatformUsageDto>> GetSoftwarePlatformUsage(int id, CancellationToken cancellationToken)
    {
        var exists = await context.SoftwarePlatforms.AnyAsync(platform => platform.ID == id, cancellationToken);
        if (!exists)
        {
            return NotFound();
        }

        var itemCount = await context.Software.CountAsync(item => item.PlatformID == id, cancellationToken);
        return new SoftwarePlatformUsageDto(id, itemCount);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("software-platforms")]
    public async Task<ActionResult<SoftwareLookupDto>> CreateSoftwarePlatform(SoftwareLookupDto dto, CancellationToken cancellationToken)
    {
        var name = NormalizeSoftwarePlatformName(dto.Name);
        if (name is null)
        {
            return BadRequest("Platform name is required.");
        }

        var existing = await context.SoftwarePlatforms
            .AsNoTracking()
            .FirstOrDefaultAsync(platform => platform.Platform == name, cancellationToken);
        if (existing is not null)
        {
            return Conflict("A software platform with that name already exists.");
        }

        var platform = new SoftwarePlatform { Platform = name };
        context.SoftwarePlatforms.Add(platform);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetSoftwarePlatforms), new SoftwareLookupDto(platform.ID, platform.Platform));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("software-platforms/{id:int}")]
    public async Task<ActionResult<SoftwareLookupDto>> UpdateSoftwarePlatform(
        int id,
        SoftwareLookupDto dto,
        CancellationToken cancellationToken)
    {
        var name = NormalizeSoftwarePlatformName(dto.Name);
        if (name is null)
        {
            return BadRequest("Platform name is required.");
        }

        var platform = await context.SoftwarePlatforms.SingleOrDefaultAsync(platform => platform.ID == id, cancellationToken);
        if (platform is null)
        {
            return NotFound();
        }

        var duplicate = await context.SoftwarePlatforms
            .AnyAsync(item => item.ID != id && item.Platform == name, cancellationToken);
        if (duplicate)
        {
            return Conflict("A software platform with that name already exists.");
        }

        platform.Platform = name;
        await context.SaveChangesAsync(cancellationToken);
        return new SoftwareLookupDto(platform.ID, platform.Platform);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("software-platforms/{id:int}")]
    public async Task<IActionResult> DeleteSoftwarePlatform(int id, CancellationToken cancellationToken)
    {
        var platform = await context.SoftwarePlatforms.SingleOrDefaultAsync(platform => platform.ID == id, cancellationToken);
        if (platform is null)
        {
            return NotFound();
        }

        var itemCount = await context.Software.CountAsync(item => item.PlatformID == id, cancellationToken);
        if (itemCount > 0)
        {
            return Conflict($"Cannot delete {platform.Platform}; {itemCount} software item(s) use this platform.");
        }

        context.SoftwarePlatforms.Remove(platform);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("software-locations")]
    public async Task<IEnumerable<SoftwareLookupDto>> GetSoftwareLocations(CancellationToken cancellationToken) =>
        await context.SoftwareLocations
            .AsNoTracking()
            .OrderBy(location => location.Location)
            .Select(location => new SoftwareLookupDto(location.ID, location.Location))
            .ToListAsync(cancellationToken);

    [HttpGet("software-locations/{id:int}/usage")]
    public async Task<ActionResult<SoftwareLocationUsageDto>> GetSoftwareLocationUsage(int id, CancellationToken cancellationToken)
    {
        var exists = await context.SoftwareLocations.AnyAsync(location => location.ID == id, cancellationToken);
        if (!exists)
        {
            return NotFound();
        }

        var itemCount = await context.Software.CountAsync(item => item.LocationID == id, cancellationToken);
        return new SoftwareLocationUsageDto(id, itemCount);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("software-locations")]
    public async Task<ActionResult<SoftwareLookupDto>> CreateSoftwareLocation(SoftwareLookupDto dto, CancellationToken cancellationToken)
    {
        var name = NormalizeSoftwareLookupName(dto.Name);
        if (name is null)
        {
            return BadRequest("Location name is required.");
        }

        var existing = await context.SoftwareLocations
            .AsNoTracking()
            .FirstOrDefaultAsync(location => location.Location == name, cancellationToken);
        if (existing is not null)
        {
            return Conflict("A software location with that name already exists.");
        }

        var location = new SoftwareLocation { Location = name };
        context.SoftwareLocations.Add(location);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetSoftwareLocations), new SoftwareLookupDto(location.ID, location.Location));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("software-locations/{id:int}")]
    public async Task<ActionResult<SoftwareLookupDto>> UpdateSoftwareLocation(
        int id,
        SoftwareLookupDto dto,
        CancellationToken cancellationToken)
    {
        var name = NormalizeSoftwareLookupName(dto.Name);
        if (name is null)
        {
            return BadRequest("Location name is required.");
        }

        var location = await context.SoftwareLocations.SingleOrDefaultAsync(location => location.ID == id, cancellationToken);
        if (location is null)
        {
            return NotFound();
        }

        var duplicate = await context.SoftwareLocations
            .AnyAsync(item => item.ID != id && item.Location == name, cancellationToken);
        if (duplicate)
        {
            return Conflict("A software location with that name already exists.");
        }

        location.Location = name;
        await context.SaveChangesAsync(cancellationToken);
        return new SoftwareLookupDto(location.ID, location.Location);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("software-locations/{id:int}")]
    public async Task<IActionResult> DeleteSoftwareLocation(int id, CancellationToken cancellationToken)
    {
        var location = await context.SoftwareLocations.SingleOrDefaultAsync(location => location.ID == id, cancellationToken);
        if (location is null)
        {
            return NotFound();
        }

        var itemCount = await context.Software.CountAsync(item => item.LocationID == id, cancellationToken);
        if (itemCount > 0)
        {
            return Conflict($"Cannot delete {location.Location}; {itemCount} software item(s) use this location.");
        }

        context.SoftwareLocations.Remove(location);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<FishReportThresholdsDto> ReadFishReportThresholds(CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == FishReportThresholdsKey, cancellationToken);
        if (setting is null || string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            return Defaults();
        }

        try
        {
            return Normalize(JsonSerializer.Deserialize<FishReportThresholdsDto>(setting.ValueJson) ?? Defaults());
        }
        catch (JsonException)
        {
            return Defaults();
        }
    }

    private static FishReportThresholdsDto Defaults() => new(7, 7, 14, 25, 30);

    private async Task<ShoppingCategoriesDto> ReadShoppingCategories(CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == ShoppingCategoriesKey, cancellationToken);
        if (setting is null || string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            return ShoppingCategoryDefaults();
        }

        try
        {
            return Normalize(JsonSerializer.Deserialize<ShoppingCategoriesDto>(setting.ValueJson) ?? ShoppingCategoryDefaults());
        }
        catch (JsonException)
        {
            return ShoppingCategoryDefaults();
        }
    }

    private static ShoppingCategoriesDto ShoppingCategoryDefaults() => new([
        "Grocery",
        "Pet",
        "Household",
        "Garden",
        "Canning",
        "Medical",
        "Other"
    ]);

    private async Task<RecipeLookupSettingsDto> ReadRecipeLookups(CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == RecipeLookupSettingsKey, cancellationToken);
        var stored = RecipeLookupDefaults();

        if (setting is not null && !string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            try
            {
                stored = Normalize(JsonSerializer.Deserialize<RecipeLookupSettingsDto>(setting.ValueJson) ?? RecipeLookupDefaults());
            }
            catch (JsonException)
            {
                stored = RecipeLookupDefaults();
            }
        }

        var categories = await context.Recipes
            .AsNoTracking()
            .Select(recipe => recipe.Category)
            .Distinct()
            .ToListAsync(cancellationToken);
        var cuisines = await context.Recipes
            .AsNoTracking()
            .Where(recipe => recipe.Cuisine != null && recipe.Cuisine != "")
            .Select(recipe => recipe.Cuisine!)
            .Distinct()
            .ToListAsync(cancellationToken);
        var tags = await context.RecipeTags
            .AsNoTracking()
            .Select(tag => tag.Name)
            .Distinct()
            .ToListAsync(cancellationToken);

        return new RecipeLookupSettingsDto(
            NormalizeList([.. stored.Categories, .. categories], RecipeLookupDefaults().Categories),
            NormalizeList([.. stored.Cuisines, .. cuisines], RecipeLookupDefaults().Cuisines),
            NormalizeList([.. stored.Tags, .. tags], RecipeLookupDefaults().Tags));
    }

    private static RecipeLookupSettingsDto RecipeLookupDefaults() => new(
        ["General", "Breakfast", "Lunch", "Dinner", "Dessert", "Snack", "Canning"],
        ["American", "Italian", "Mexican", "Asian", "Mediterranean"],
        ["Quick", "Freezer", "Favorite", "Vegetarian", "Spicy", "Holiday"]);

    private async Task<AlcoholLookupSettingsDto> ReadAlcoholLookups(CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == AlcoholLookupSettingsKey, cancellationToken);
        var stored = AlcoholLookupDefaults();

        if (setting is not null && !string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            try
            {
                stored = Normalize(JsonSerializer.Deserialize<AlcoholLookupSettingsDto>(setting.ValueJson) ?? AlcoholLookupDefaults());
            }
            catch (JsonException)
            {
                stored = AlcoholLookupDefaults();
            }
        }

        var categories = await context.AlcoholItems
            .AsNoTracking()
            .Select(item => item.Category)
            .Distinct()
            .ToListAsync(cancellationToken);
        var locations = await context.AlcoholItems
            .AsNoTracking()
            .Where(item => item.Location != null && item.Location != "")
            .Select(item => item.Location!)
            .Distinct()
            .ToListAsync(cancellationToken);

        return Normalize(stored with
        {
            Categories = NormalizeList([.. stored.Categories, .. categories], AlcoholLookupDefaults().Categories),
            Locations = NormalizeList([.. stored.Locations, .. locations], AlcoholLookupDefaults().Locations)
        });
    }

    public static AlcoholLookupSettingsDto AlcoholLookupDefaults() => new(DefaultAlcoholCategories, DefaultAlcoholLocations);

    private async Task<BarcodeLookupSettingsDto> ReadBarcodeLookups(CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == BarcodeLookupSettingsKey, cancellationToken);
        if (setting is null || string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            return BarcodeLookupDefaults();
        }

        try
        {
            return Normalize(JsonSerializer.Deserialize<BarcodeLookupSettingsDto>(setting.ValueJson) ?? BarcodeLookupDefaults());
        }
        catch (JsonException)
        {
            return BarcodeLookupDefaults();
        }
    }

    public static BarcodeLookupSettingsDto BarcodeLookupDefaults() => new([
        new("GoogleBooks", true, 10),
        new("OpenLibrary", true, 20),
        new("Crossref", true, 30),
        new("MusicBrainz", true, 40),
        new("UPCitemdb", true, 50),
        new("OpenFoodFacts", true, 60),
        new("Discogs", false, 70),
        new("Wikidata", true, 80)
    ]);

    private async Task<FinanceTrackerSettingsDto> ReadFinanceTrackerSettings(CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == FinanceTrackerSettingsKey, cancellationToken);
        var stored = FinanceTrackerDefaults();

        if (setting is not null && !string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            try
            {
                stored = Normalize(JsonSerializer.Deserialize<FinanceTrackerSettingsDto>(setting.ValueJson) ?? FinanceTrackerDefaults());
            }
            catch (JsonException)
            {
                stored = FinanceTrackerDefaults();
            }
        }

        var accountCategories = await context.FinanceAccountBalances
            .AsNoTracking()
            .Select(account => account.Category)
            .Distinct()
            .ToListAsync(cancellationToken);
        var billCategories = await context.FinanceRecurringBills
            .AsNoTracking()
            .Select(bill => bill.Category)
            .Distinct()
            .ToListAsync(cancellationToken);
        var donationMethods = await context.FinanceDonations
            .AsNoTracking()
            .Where(donation => donation.Method != null && donation.Method != "")
            .Select(donation => donation.Method!)
            .Distinct()
            .ToListAsync(cancellationToken);

        return Normalize(stored with
        {
            AccountCategories = NormalizeList([.. stored.AccountCategories, .. accountCategories], FinanceTrackerDefaults().AccountCategories),
            BillCategories = NormalizeList([.. stored.BillCategories, .. billCategories], FinanceTrackerDefaults().BillCategories),
            DonationMethods = NormalizeList([.. stored.DonationMethods, .. donationMethods], FinanceTrackerDefaults().DonationMethods)
        });
    }

    private static FinanceTrackerSettingsDto FinanceTrackerDefaults()
    {
        var now = DateTime.Today;
        return new FinanceTrackerSettingsDto(
            ["Checking", "Credit Card", "HSA", "IRA", "Retirement", "Savings"],
            ["Credit Card", "Household", "Insurance", "Medical", "Subscription", "Utilities"],
            ["Cash", "Check", "Credit Card", "Online", "Payroll", "Other"],
            5,
            1,
            now.Year,
            now.Month);
    }

    private async Task<ExternalSitesSettingsDto> ReadExternalSites(CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == ExternalSitesSettingsKey, cancellationToken);
        if (setting is null || string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            return ExternalSitesDefaults();
        }

        try
        {
            return Normalize(JsonSerializer.Deserialize<ExternalSitesSettingsDto>(setting.ValueJson) ?? ExternalSitesDefaults());
        }
        catch (JsonException)
        {
            return ExternalSitesDefaults();
        }
    }

    private static ExternalSitesSettingsDto ExternalSitesDefaults() => new("local", [
        new("bartender", "Bartender", null, null, true, true, 10),
        new("dino", "Dino", null, null, true, true, 20),
        new("cd", "CD", "http://localhost:5120", null, true, true, 30),
        new("personal", "Personal", null, null, true, true, 40),
        new("film-review", "Film Review", null, null, true, true, 50)
    ]);

    private async Task<MainAppearanceSettingsDto> ReadMainAppearance(CancellationToken cancellationToken)
    {
        return await ReadAppearance(MainAppearanceSettingsKey, MainAppearanceDefaults(), cancellationToken);
    }

    private async Task<MainAppearanceSettingsDto> ReadAppearance(
        string key,
        MainAppearanceSettingsDto defaults,
        CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == key, cancellationToken);
        if (setting is null || string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            return defaults;
        }

        try
        {
            return Normalize(JsonSerializer.Deserialize<MainAppearanceSettingsDto>(setting.ValueJson) ?? defaults, defaults);
        }
        catch (JsonException)
        {
            return defaults;
        }
    }

    private static MainAppearanceSettingsDto MainAppearanceDefaults() => new(
        "Verdelak",
        "Collections, schedules, and household systems",
        "#2563eb",
        "#0f766e",
        null,
        null,
        null);

    private static MainAppearanceSettingsDto CdSiteAppearanceDefaults() => new(
        "Verdelak CD Collection",
        "Browse the collection by band and read CD reviews.",
        "#0d6efd",
        "#6f42c1",
        null,
        null,
        null);

    private static MainAppearanceSettingsDto DinoSiteAppearanceDefaults() => new(
        "Verdelak Dino Archive",
        "Browse published dinosaurs by name, taxonomy, and discovery notes.",
        "#198754",
        "#0f766e",
        null,
        null,
        null);

    private static MainAppearanceSettingsDto BlogAppearanceDefaults() => new(
        "Verdelak Blog",
        "Notes, updates, and personal writing.",
        "#4f46e5",
        "#0f766e",
        null,
        null,
        null);

    private static MainAppearanceSettingsDto FilmReviewAppearanceDefaults() => new(
        "Verdelak Film Review",
        "Movie notes, ratings, and review writing.",
        "#7c3aed",
        "#be123c",
        null,
        null,
        null);

    public async Task<SteamImporterSettingsDto> ReadSteamImporterSettings(CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == SteamImporterSettingsKey, cancellationToken);
        if (setting is null || string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            return SteamImporterDefaults();
        }

        try
        {
            return Normalize(JsonSerializer.Deserialize<SteamImporterSettingsDto>(setting.ValueJson) ?? SteamImporterDefaults());
        }
        catch (JsonException)
        {
            return SteamImporterDefaults();
        }
    }

    private static SteamImporterSettingsDto SteamImporterDefaults() => new(null, null, true, true);

    public async Task<BoardGameGeekImporterSettingsDto> ReadBoardGameGeekImporterSettings(CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == BoardGameGeekImporterSettingsKey, cancellationToken);
        if (setting is null || string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            return BoardGameGeekImporterDefaults();
        }

        try
        {
            return Normalize(JsonSerializer.Deserialize<BoardGameGeekImporterSettingsDto>(setting.ValueJson) ?? BoardGameGeekImporterDefaults());
        }
        catch (JsonException)
        {
            return BoardGameGeekImporterDefaults();
        }
    }

    private static BoardGameGeekImporterSettingsDto BoardGameGeekImporterDefaults() => new(null, true, false, false);

    public async Task<MusicFolderImporterSettingsDto> ReadMusicFolderImporterSettings(CancellationToken cancellationToken)
    {
        var setting = await context.AppSettings
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Key == MusicFolderImporterSettingsKey, cancellationToken);
        if (setting is null || string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            return MusicFolderImporterDefaults();
        }

        try
        {
            return Normalize(JsonSerializer.Deserialize<MusicFolderImporterSettingsDto>(setting.ValueJson) ?? MusicFolderImporterDefaults());
        }
        catch (JsonException)
        {
            return MusicFolderImporterDefaults();
        }
    }

    private static MusicFolderImporterSettingsDto MusicFolderImporterDefaults() => new(@"Z:\Rips");

    private static FishReportThresholdsDto Normalize(FishReportThresholdsDto dto) => new(
        Clamp(dto.WaterTestDueDays, 0, 365),
        Clamp(dto.OverdueCriticalDays, 0, 365),
        Clamp(dto.WaterTestCriticalDays, 0, 365),
        Clamp(dto.LowProductPercent, 0, 100),
        Clamp(dto.ExpiringSoonDays, 0, 365)
    );

    private static ShoppingCategoriesDto Normalize(ShoppingCategoriesDto dto)
    {
        var categories = dto.Categories
            .Select(category => category.Trim())
            .Where(category => !string.IsNullOrWhiteSpace(category))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(category => category)
            .Take(100)
            .ToList();

        return new ShoppingCategoriesDto(categories.Count > 0 ? categories : ShoppingCategoryDefaults().Categories);
    }

    private static RecipeLookupSettingsDto Normalize(RecipeLookupSettingsDto dto) => new(
        NormalizeList(dto.Categories, RecipeLookupDefaults().Categories),
        NormalizeList(dto.Cuisines, RecipeLookupDefaults().Cuisines),
        NormalizeList(dto.Tags, RecipeLookupDefaults().Tags)
    );

    private static AlcoholLookupSettingsDto Normalize(AlcoholLookupSettingsDto dto) => new(
        NormalizeList(dto.Categories, AlcoholLookupDefaults().Categories),
        NormalizeList(dto.Locations, AlcoholLookupDefaults().Locations)
    );

    public static BarcodeLookupSettingsDto Normalize(BarcodeLookupSettingsDto dto)
    {
        var known = BarcodeLookupDefaults().Providers.ToDictionary(provider => provider.Provider, StringComparer.OrdinalIgnoreCase);
        var incoming = dto.Providers
            .Where(provider => known.ContainsKey(provider.Provider))
            .GroupBy(provider => provider.Provider, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .ToDictionary(provider => provider.Provider, StringComparer.OrdinalIgnoreCase);

        var ordered = BarcodeLookupDefaults().Providers
            .Select(defaultProvider => incoming.TryGetValue(defaultProvider.Provider, out var provider)
                ? new BarcodeLookupProviderSettingDto(defaultProvider.Provider, provider.Enabled, Clamp(provider.Priority, 1, 999))
                : defaultProvider)
            .OrderBy(provider => provider.Priority)
            .ThenBy(provider => provider.Provider)
            .ToList();

        var normalized = ordered
            .Select((provider, index) => provider with { Priority = (index + 1) * 10 })
            .ToList();

        return new BarcodeLookupSettingsDto(normalized);
    }

    private static FinanceTrackerSettingsDto Normalize(FinanceTrackerSettingsDto dto)
    {
        var fallback = FinanceTrackerDefaults();
        return new FinanceTrackerSettingsDto(
            NormalizeList(dto.AccountCategories, fallback.AccountCategories),
            NormalizeList(dto.BillCategories, fallback.BillCategories),
            NormalizeList(dto.DonationMethods, fallback.DonationMethods),
            Clamp(dto.YearCloseMonth, 1, 12),
            Clamp(dto.YearCloseDay, 1, 31),
            Clamp(dto.DefaultReportYear, 2000, 2100),
            Clamp(dto.DefaultReportMonth, 1, 12));
    }

    private static ExternalSitesSettingsDto Normalize(ExternalSitesSettingsDto dto)
    {
        var defaults = ExternalSitesDefaults().Sites.ToDictionary(site => site.Key, StringComparer.OrdinalIgnoreCase);
        var incoming = dto.Sites
            .Select(site => new ExternalSiteSettingDto(
                NormalizeKey(site.Key),
                TrimOrDefault(site.Label, site.Key),
                TrimUrl(site.LocalUrl),
                TrimUrl(site.ProductionUrl),
                site.IsActive,
                site.OpenInNewTab,
                Clamp(site.SortOrder, 1, 9999)))
            .Where(site => !string.IsNullOrWhiteSpace(site.Key) && !string.IsNullOrWhiteSpace(site.Label))
            .GroupBy(site => site.Key, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .ToDictionary(site => site.Key, StringComparer.OrdinalIgnoreCase);

        var merged = ExternalSitesDefaults().Sites
            .Select(defaultSite => incoming.TryGetValue(defaultSite.Key, out var site)
                ? site
                : defaultSite)
            .ToList();

        merged.AddRange(incoming.Values.Where(site => !defaults.ContainsKey(site.Key)));

        var environmentName = dto.EnvironmentName?.Trim().ToLowerInvariant() is "production" or "local"
            ? dto.EnvironmentName.Trim().ToLowerInvariant()
            : "local";

        return new ExternalSitesSettingsDto(
            environmentName,
            merged
                .OrderBy(site => site.SortOrder)
                .ThenBy(site => site.Label)
                .Take(50)
                .ToList());
    }

    private static MainAppearanceSettingsDto Normalize(MainAppearanceSettingsDto dto)
    {
        return Normalize(dto, MainAppearanceDefaults());
    }

    private static MainAppearanceSettingsDto Normalize(MainAppearanceSettingsDto dto, MainAppearanceSettingsDto fallback)
    {
        return new MainAppearanceSettingsDto(
            TrimOrDefault(dto.BrandName, fallback.BrandName),
            TrimOrDefault(dto.Tagline, fallback.Tagline),
            HexColorOrDefault(dto.PrimaryColor, fallback.PrimaryColor),
            HexColorOrDefault(dto.AccentColor, fallback.AccentColor),
            TrimUrl(dto.LogoUrl),
            TrimUrl(dto.HeroImageUrl),
            TrimUrl(dto.FaviconUrl));
    }

    private static SteamImporterSettingsDto Normalize(SteamImporterSettingsDto dto) => new(
        TrimOrNull(dto.ApiKey, 200),
        DigitsOrNull(dto.SteamId, 32),
        dto.IncludePlayedFreeGames,
        dto.IncludeAppInfo);

    private static BoardGameGeekImporterSettingsDto Normalize(BoardGameGeekImporterSettingsDto dto) => new(
        TrimOrNull(dto.Username, 80),
        dto.IncludeOwned || (!dto.IncludeOwned && !dto.IncludeWishlist),
        dto.IncludeWishlist,
        dto.IncludeExpansions);

    private static MusicFolderImporterSettingsDto Normalize(MusicFolderImporterSettingsDto dto)
    {
        var rootPath = dto.RootPath?.Trim();
        if (string.IsNullOrWhiteSpace(rootPath))
        {
            rootPath = MusicFolderImporterDefaults().RootPath;
        }

        return new MusicFolderImporterSettingsDto(rootPath.Length > 500 ? rootPath[..500] : rootPath);
    }

    private static IReadOnlyList<string> NormalizeList(IEnumerable<string> values, IReadOnlyList<string> fallback)
    {
        var normalized = values
            .Select(value => value.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(value => value)
            .Take(150)
            .ToList();

        return normalized.Count > 0 ? normalized : fallback;
    }

    private static int Clamp(int value, int min, int max) => Math.Min(max, Math.Max(min, value));

    private static string NormalizeKey(string? value)
    {
        var key = value?.Trim().ToLowerInvariant() ?? string.Empty;
        return key.Length > 50 ? key[..50] : key;
    }

    private static string TrimOrDefault(string? value, string fallback)
    {
        var text = value?.Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            text = fallback.Trim();
        }

        return text.Length > 100 ? text[..100] : text;
    }

    private static string? TrimUrl(string? value)
    {
        var url = value?.Trim();
        if (string.IsNullOrWhiteSpace(url))
        {
            return null;
        }

        return url.Length > 500 ? url[..500] : url;
    }

    private static string HexColorOrDefault(string? value, string fallback)
    {
        var color = value?.Trim();
        if (string.IsNullOrWhiteSpace(color) || color.Length != 7 || color[0] != '#')
        {
            return fallback;
        }

        return color.Skip(1).All(Uri.IsHexDigit) ? color.ToLowerInvariant() : fallback;
    }

    private static string? TrimOrNull(string? value, int maxLength)
    {
        var text = value?.Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        return text.Length > maxLength ? text[..maxLength] : text;
    }

    private static string? DigitsOrNull(string? value, int maxLength)
    {
        var digits = new string((value ?? string.Empty).Where(char.IsDigit).ToArray());
        if (string.IsNullOrWhiteSpace(digits))
        {
            return null;
        }

        return digits.Length > maxLength ? digits[..maxLength] : digits;
    }

    private async Task<int> AddMissingSoftwarePlatforms(IEnumerable<string> names, CancellationToken cancellationToken)
    {
        var existing = await context.SoftwarePlatforms
            .Select(platform => platform.Platform)
            .ToListAsync(cancellationToken);
        var existingSet = existing.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var created = 0;

        foreach (var name in names.Select(NormalizeSoftwarePlatformName).OfType<string>())
        {
            if (existingSet.Contains(name))
            {
                continue;
            }

            context.SoftwarePlatforms.Add(new SoftwarePlatform { Platform = name });
            existingSet.Add(name);
            created += 1;
        }

        return created;
    }

    private async Task<int> AddMissingSoftwareLocations(IEnumerable<string> names, CancellationToken cancellationToken)
    {
        var existing = await context.SoftwareLocations
            .Select(location => location.Location)
            .ToListAsync(cancellationToken);
        var existingSet = existing.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var created = 0;

        foreach (var name in names.Select(NormalizeSoftwareLookupName).OfType<string>())
        {
            if (existingSet.Contains(name))
            {
                continue;
            }

            context.SoftwareLocations.Add(new SoftwareLocation { Location = name });
            existingSet.Add(name);
            created += 1;
        }

        return created;
    }

    private static string? NormalizeSoftwarePlatformName(string? value)
    {
        return NormalizeSoftwareLookupName(value);
    }

    private static string? NormalizeSoftwareLookupName(string? value)
    {
        var name = value?.Trim();
        return string.IsNullOrWhiteSpace(name) ? null : name.Length > 50 ? name[..50] : name;
    }
}



