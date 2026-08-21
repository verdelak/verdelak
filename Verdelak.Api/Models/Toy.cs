using System.ComponentModel.DataAnnotations.Schema;

namespace Verdelak.Api.Models;

[Table("ToyCompany")]
public class ToyCompany
{
    public int ID { get; set; }
    public string Name { get; set; } = string.Empty;

    public List<ToyLine> Lines { get; set; } = new();
}

[Table("ToyLine")]
public class ToyLine
{
    public int ID { get; set; }
    public string Name { get; set; } = string.Empty;
    public int? CompanyID { get; set; }

    public ToyCompany? Company { get; set; }
    public List<ToyFigure> Figures { get; set; } = new();
    public List<ToyLineSeries> LineSeries { get; set; } = new();
}

[Table("ToySeries")]
public class ToySeries
{
    public int ID { get; set; }
    public string Name { get; set; } = string.Empty;

    public List<ToyFigure> Figures { get; set; } = new();
    public List<ToyLineSeries> LineSeries { get; set; } = new();
}

[Table("ToyLineSeries")]
public class ToyLineSeries
{
    public int LineID { get; set; }
    public int SeriesID { get; set; }

    public ToyLine? Line { get; set; }
    public ToySeries? Series { get; set; }
}

[Table("ToyFigures")]
public class ToyFigure
{
    public int ID { get; set; }
    public string Name { get; set; } = string.Empty;
    public short Qty { get; set; }
    public int LineID { get; set; }
    public int? SeriesID { get; set; }
    public bool InBox { get; set; }
    public string? StatusID { get; set; }

    public ToyLine? Line { get; set; }
    public ToySeries? Series { get; set; }
}
