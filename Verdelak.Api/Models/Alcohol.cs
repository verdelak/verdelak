namespace Verdelak.Api.Models;

public class AlcoholItem
{
    public int Id { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Producer { get; set; }
    public string? Style { get; set; }
    public string? Type { get; set; }
    public string? Variety { get; set; }
    public string? Color { get; set; }
    public string? Country { get; set; }
    public string? Region { get; set; }
    public string? VintageOrYear { get; set; }
    public string? Size { get; set; }
    public decimal? Price { get; set; }
    public decimal? Rating { get; set; }
    public decimal? QuantityOnHand { get; set; }
    public string? Location { get; set; }
    public string StatusID { get; set; } = "H";
    public string? Notes { get; set; }
    public string? SourceSheet { get; set; }
    public string? SourceRowLabel { get; set; }
}

public class AlcoholProduct
{
    public int ID { get; set; }
    public string Product { get; set; } = string.Empty;
    public int? CategoryID { get; set; }
    public int? TypeID { get; set; }
    public int? StyleID { get; set; }
    public int? RegionID { get; set; }
    public string? Producer { get; set; }
    public string? Variety { get; set; }
    public string? Color { get; set; }
    public string? Country { get; set; }
    public string? VintageOrYear { get; set; }
    public string? Size { get; set; }
    public string? Notes { get; set; }
    public string? SourceSheet { get; set; }
    public string? SourceRowLabel { get; set; }

    public AlcoholCategory? Category { get; set; }
    public AlcoholType? Type { get; set; }
    public AlcoholStyle? Style { get; set; }
    public AlcoholRegion? Region { get; set; }
    public List<AlcoholCount> Counts { get; set; } = [];
    public List<AlcoholRating> Ratings { get; set; } = [];
    public List<AlcoholValue> Values { get; set; } = [];
}

public class AlcoholCategory
{
    public int ID { get; set; }
    public string Category { get; set; } = string.Empty;

    public List<AlcoholProduct> Products { get; set; } = [];
    public List<AlcoholType> Types { get; set; } = [];
}

public class AlcoholType
{
    public int ID { get; set; }
    public string Type { get; set; } = string.Empty;
    public int? CategoryID { get; set; }

    public AlcoholCategory? Category { get; set; }
    public List<AlcoholProduct> Products { get; set; } = [];
    public List<AlcoholStyle> Styles { get; set; } = [];
}

public class AlcoholStyle
{
    public int ID { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? TypeID { get; set; }

    public AlcoholType? Type { get; set; }
    public List<AlcoholProduct> Products { get; set; } = [];
}

public class AlcoholRegion
{
    public int ID { get; set; }
    public string Region { get; set; } = string.Empty;
    public string? Country { get; set; }

    public List<AlcoholProduct> Products { get; set; } = [];
}

public class AlcoholLocation
{
    public int ID { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? Notes { get; set; }

    public List<AlcoholCount> Counts { get; set; } = [];
}

public class AlcoholCount
{
    public int ID { get; set; }
    public int AlcoholID { get; set; }
    public int? LocationID { get; set; }
    public decimal Qty { get; set; }
    public string StatusID { get; set; } = "H";
    public string? Notes { get; set; }

    public AlcoholProduct? Alcohol { get; set; }
    public AlcoholLocation? Location { get; set; }
}

public class AlcoholRating
{
    public int ID { get; set; }
    public int AlcoholID { get; set; }
    public decimal? Rating { get; set; }
    public string? Notes { get; set; }

    public AlcoholProduct? Alcohol { get; set; }
}

public class AlcoholValue
{
    public int ID { get; set; }
    public int AlcoholID { get; set; }
    public int? StoreID { get; set; }
    public decimal Price { get; set; }
    public DateTime? AsOfDate { get; set; }
    public string? Notes { get; set; }

    public AlcoholProduct? Alcohol { get; set; }
}
