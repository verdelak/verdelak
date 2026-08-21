using System.ComponentModel.DataAnnotations.Schema;

namespace Verdelak.Api.Models;

[Table("MagazinesSeries")]
public class MagazineSeries
{
    public int ID { get; set; }
    public string Title { get; set; } = string.Empty;

    public List<Magazine> Magazines { get; set; } = new();
}

[Table("Magazines")]
public class Magazine
{
    public int ID { get; set; }
    public short? Number { get; set; }
    public short? Month { get; set; }
    public short? Year { get; set; }
    public string? Season { get; set; }
    public string? Title { get; set; }
    public bool Special { get; set; }
    public bool Alternate { get; set; }
    public string StatusID { get; set; } = "H";
    public string? Info { get; set; }
    public int SeriesId { get; set; }
    public string? CoverID { get; set; }

    public MagazineSeries? Series { get; set; }
}
