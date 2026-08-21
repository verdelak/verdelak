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
