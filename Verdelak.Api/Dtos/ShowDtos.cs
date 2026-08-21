namespace Verdelak.Api.Dtos;

public record ShowSeriesSummaryDto(
    int Id,
    string Title,
    string? SortTitle,
    string? Notes,
    bool WantToWatch,
    bool WantToRewatch,
    int OwnedSeasonCount,
    int WantedSeasonCount,
    int WatchedSeasonCount,
    int SeasonCount,
    int? LegacyShowsToWatchId);

public record ShowOwnershipGapDto(
    int SeasonId,
    string SeasonLabel,
    bool IsDirectlyOwned,
    bool IsOwnedByBoxSet,
    bool IsWanted,
    string? Format,
    IEnumerable<string> OwnedBoxSetNames);

public record ShowSeasonDto(
    int Id,
    int ShowSeriesId,
    int? SeasonNumber,
    string SeasonLabel,
    string StatusID,
    string? Format,
    bool IsOwnedByBoxSet,
    IEnumerable<string> OwnedBoxSetNames,
    bool IsWatched,
    bool WantToWatch,
    bool WantToRewatch,
    DateOnly? LastWatchedDate,
    string? Notes);

public record ShowBoxSetDto(
    int Id,
    int ShowSeriesId,
    string Name,
    string StatusID,
    string? Format,
    bool IsCompleteSeries,
    string? Notes,
    IEnumerable<int> SeasonIds,
    IEnumerable<string> SeasonLabels);

public record ShowSeriesDetailDto(
    int Id,
    string Title,
    string? SortTitle,
    string? Notes,
    bool WantToWatch,
    bool WantToRewatch,
    int? LegacyShowsToWatchId,
    IEnumerable<ShowSeasonDto> Seasons,
    IEnumerable<ShowBoxSetDto> BoxSets,
    IEnumerable<ShowOwnershipGapDto> OwnershipGaps);

public record UpsertShowSeriesDto(
    string Title,
    string? SortTitle,
    string? Notes,
    bool? WantToWatch,
    bool? WantToRewatch);

public record UpsertShowSeasonDto(
    int? SeasonNumber,
    string? SeasonLabel,
    string? StatusID,
    string? Format,
    bool? IsWatched,
    bool? WantToWatch,
    bool? WantToRewatch,
    DateOnly? LastWatchedDate,
    string? Notes);

public record BulkAddShowSeasonsDto(
    int StartSeason,
    int EndSeason,
    string? StatusID,
    string? Format,
    bool? WantToWatch,
    bool? WantToRewatch,
    string? Notes);

public record UpsertShowBoxSetDto(
    string Name,
    string? StatusID,
    string? Format,
    bool? IsCompleteSeries,
    IEnumerable<int>? SeasonIds,
    int? StartSeason,
    int? EndSeason,
    string? Notes);

public record CreateShowGoalItemsDto(
    int Year,
    IEnumerable<int>? SeasonIds,
    string? PlanningWindowType,
    DateTime? TargetStartDate,
    DateTime? TargetEndDate,
    string? ScheduleSurfaceMode);

public record CreateShowGoalItemsResultDto(
    int PlanId,
    int Year,
    int CreatedCount,
    int SkippedDuplicateCount,
    string SectionTitle);

public record ShowSeasonReportDto(
    int SeriesId,
    string SeriesTitle,
    int? SeasonId,
    int? SeasonNumber,
    string SeasonLabel,
    string? StatusID,
    string? Format,
    bool IsDirectlyOwned,
    bool IsOwnedByBoxSet,
    bool IsWanted,
    bool IsMissing,
    bool IsWatched,
    bool WantToWatch,
    bool WantToRewatch,
    IEnumerable<string> OwnedBoxSetNames,
    IEnumerable<int> ScheduledGoalYears);

public record ShowReportSummaryDto(
    int WantedSeasonCount,
    int MissingSeasonCount,
    int NoSeasonDetailCount,
    int WatchCandidateCount,
    int RewatchCandidateCount,
    int ScheduledGoalSeasonCount);


