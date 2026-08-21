using System.ComponentModel.DataAnnotations.Schema;

namespace Verdelak.Api.Models;

[Table("MtgCards")]
public class MtgCard
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ManaCost { get; set; }
    public string? Colors { get; set; }
    public string? ColorIdentity { get; set; }
    public string? TypeLine { get; set; }
    public string? OracleText { get; set; }
    public string? Power { get; set; }
    public string? Toughness { get; set; }
    public string? Loyalty { get; set; }
    public string? Legalities { get; set; }

    public List<MtgPrinting> Printings { get; set; } = [];
}

[Table("MtgPrintings")]
public class MtgPrinting
{
    public int Id { get; set; }
    public int CardId { get; set; }
    public string SetCode { get; set; } = string.Empty;
    public string? SetName { get; set; }
    public string CollectorNumber { get; set; } = string.Empty;
    public string? Rarity { get; set; }
    public string? Artist { get; set; }
    public string? ImageUrl { get; set; }
    public string? ScryfallId { get; set; }
    public DateTime? ReleasedAt { get; set; }
    public string? BorderColor { get; set; }
    public string? Frame { get; set; }
    public string? Finishes { get; set; }

    public MtgCard? Card { get; set; }
    public List<MtgCollectionItem> CollectionItems { get; set; } = [];
}

[Table("MtgCollectionItems")]
public class MtgCollectionItem
{
    public int Id { get; set; }
    public int PrintingId { get; set; }
    public short Quantity { get; set; } = 1;
    public short FoilQuantity { get; set; }
    public string WantStatusID { get; set; } = "H";
    public string? Condition { get; set; }
    public string? Language { get; set; }
    public string? Location { get; set; }
    public string? Notes { get; set; }
    public decimal? EstimatedValue { get; set; }

    public MtgPrinting? Printing { get; set; }
}
