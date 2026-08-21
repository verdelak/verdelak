using System.ComponentModel.DataAnnotations.Schema;

namespace Verdelak.Api.Models;

[Table("ComicSeries")]
public class ComicSeries
{
    public int ID { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Notes { get; set; }

    public List<ComicIssue> Issues { get; set; } = new();
}

[Table("ComicIssue")]
public class ComicIssue
{
    public int ID { get; set; }
    public int SeriesID { get; set; }
    public short? IssueNumber { get; set; }
    public bool isSpecial { get; set; }
    public string? Name { get; set; }
    public short? IssueMonth { get; set; }
    public string? IssueYear { get; set; }
    public bool isGraphicNovel { get; set; }
    public bool isVariant { get; set; }
    public string? Notes { get; set; }

    public ComicSeries? Series { get; set; }
    public List<ComicStatus> Statuses { get; set; } = new();
    public List<ComicValue> Values { get; set; } = new();
}

[Table("ComicStatus")]
public class ComicStatus
{
    public int ID { get; set; }
    public int IssueID { get; set; }
    public decimal? Rating { get; set; }
    public string StatusID { get; set; } = "H";

    public ComicIssue? Issue { get; set; }
}

[Table("ComicValue")]
public class ComicValue
{
    public int ID { get; set; }
    public int IssueID { get; set; }
    public int StoredID { get; set; }
    public decimal Price { get; set; }

    public ComicIssue? Issue { get; set; }
}
