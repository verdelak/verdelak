namespace Verdelak.Api.Models;

public class MiniCompany
{
    public int ID { get; set; }
    public string Company { get; set; } = string.Empty;

    public List<MiniSystem> Systems { get; set; } = [];
}

public class MiniSystem
{
    public int ID { get; set; }
    public string System { get; set; } = string.Empty;
    public int CompanyID { get; set; }

    public MiniCompany? Company { get; set; }
    public List<MiniSeries> Series { get; set; } = [];
}

public class MiniSeries
{
    public int ID { get; set; }
    public string Series { get; set; } = string.Empty;
    public int SystemID { get; set; }

    public MiniSystem? System { get; set; }
    public List<Miniature> Miniatures { get; set; } = [];
}

public class Miniature
{
    public int ID { get; set; }
    public string MiniName { get; set; } = string.Empty;
    public string? Num { get; set; }
    public int? SeriesID { get; set; }
    public string? RarityID { get; set; }
    public string? Subset { get; set; }
    public string? Size { get; set; }
    public string? Type { get; set; }

    public MiniSeries? Series { get; set; }
    public List<MiniStatus> Statuses { get; set; } = [];
    public List<MiniValue> Values { get; set; } = [];
}

public class MiniStatus
{
    public int ID { get; set; }
    public int MiniID { get; set; }
    public string StatusID { get; set; } = "H";
    public int Qty { get; set; }

    public Miniature? Miniature { get; set; }
}

public class MiniSystemRelease
{
    public int ID { get; set; }
    public int SystemID { get; set; }
    public string ReleaseName { get; set; } = string.Empty;
    public short? Year { get; set; }

    public MiniSystem? System { get; set; }
}

public class MiniValue
{
    public int ID { get; set; }
    public int MiniID { get; set; }
    public int? StoredID { get; set; }
    public decimal Price { get; set; }

    public Miniature? Miniature { get; set; }
}
