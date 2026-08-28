namespace Verdelak.Api.Dtos;

public record FishReportThresholdsDto(
    int WaterTestDueDays,
    int OverdueCriticalDays,
    int WaterTestCriticalDays,
    int LowProductPercent,
    int ExpiringSoonDays
);

public record ShoppingCategoriesDto(IReadOnlyList<string> Categories);

public record RecipeLookupSettingsDto(
    IReadOnlyList<string> Categories,
    IReadOnlyList<string> Cuisines,
    IReadOnlyList<string> Tags
);

public record AlcoholLookupSettingsDto(
    IReadOnlyList<string> Categories,
    IReadOnlyList<string> Locations
);

public record BarcodeLookupProviderSettingDto(
    string Provider,
    bool Enabled,
    int Priority
);

public record BarcodeLookupSettingsDto(
    IReadOnlyList<BarcodeLookupProviderSettingDto> Providers
);

public record FinanceTrackerSettingsDto(
    IReadOnlyList<string> AccountCategories,
    IReadOnlyList<string> BillCategories,
    IReadOnlyList<string> DonationMethods,
    int YearCloseMonth,
    int YearCloseDay,
    int DefaultReportYear,
    int DefaultReportMonth
);

public record ExternalSiteSettingDto(
    string Key,
    string Label,
    string? LocalUrl,
    string? ProductionUrl,
    bool IsActive,
    bool OpenInNewTab,
    int SortOrder
);

public record ExternalSitesSettingsDto(
    string EnvironmentName,
    IReadOnlyList<ExternalSiteSettingDto> Sites
);

public record MainAppearanceSettingsDto(
    string BrandName,
    string Tagline,
    string PrimaryColor,
    string AccentColor,
    string? LogoUrl,
    string? HeroImageUrl,
    string? FaviconUrl
);

public record SteamImporterSettingsDto(
    string? ApiKey,
    string? SteamId,
    bool IncludePlayedFreeGames,
    bool IncludeAppInfo
);

public record BoardGameGeekImporterSettingsDto(
    string? Username,
    bool IncludeOwned,
    bool IncludeWishlist,
    bool IncludeExpansions
);

public record MusicFolderImporterSettingsDto(
    string RootPath
);

public record SoftwarePlatformUsageDto(
    int Id,
    int ItemCount
);

public record SoftwareLocationUsageDto(
    int Id,
    int ItemCount
);

public record SoftwareDefaultsSeedResultDto(
    int PlatformsCreated,
    int LocationsCreated
);
