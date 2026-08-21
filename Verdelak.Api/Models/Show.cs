namespace Verdelak.Api.Models;

public class ShowSeries
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? SortTitle { get; set; }
    public string? Notes { get; set; }
    public bool WantToWatch { get; set; }
    public bool WantToRewatch { get; set; }
    public int? LegacyShowsToWatchId { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }

    public List<ShowSeason> Seasons { get; set; } = [];
    public List<ShowBoxSet> BoxSets { get; set; } = [];
}

public class ShowSeason
{
    public int Id { get; set; }
    public int ShowSeriesId { get; set; }
    public int? SeasonNumber { get; set; }
    public string SeasonLabel { get; set; } = string.Empty;
    public string StatusID { get; set; } = "H";
    public string? Format { get; set; }
    public bool IsWatched { get; set; }
    public bool WantToWatch { get; set; }
    public bool WantToRewatch { get; set; }
    public DateOnly? LastWatchedDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }

    public ShowSeries? Series { get; set; }
    public List<ShowBoxSetSeason> BoxSetSeasons { get; set; } = [];
}

public class ShowBoxSet
{
    public int Id { get; set; }
    public int ShowSeriesId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string StatusID { get; set; } = "H";
    public string? Format { get; set; }
    public bool IsCompleteSeries { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }

    public ShowSeries? Series { get; set; }
    public List<ShowBoxSetSeason> Seasons { get; set; } = [];
}

public class ShowBoxSetSeason
{
    public int ShowBoxSetId { get; set; }
    public int ShowSeasonId { get; set; }

    public ShowBoxSet? BoxSet { get; set; }
    public ShowSeason? Season { get; set; }
}
