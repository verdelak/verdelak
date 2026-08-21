namespace Verdelak.Api.Models;

public class DiceGameItem
{
    public int Id { get; set; }
    public string GameName { get; set; } = "D&D Dice Masters";
    public string SetName { get; set; } = string.Empty;
    public string? CardId { get; set; }
    public string? CardNumber { get; set; }
    public string CardName { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public int? Cost { get; set; }
    public string? EnergyType { get; set; }
    public string? Alignment { get; set; }
    public string? Equippable { get; set; }
    public string? Rarity { get; set; }
    public short? DieLimit { get; set; }
    public short OwnedCardQty { get; set; }
    public short OwnedDieQty { get; set; }
    public short OwnedFoilQty { get; set; }
    public short WantQty { get; set; }
    public string StatusID { get; set; } = "H";
    public string? Notes { get; set; }
    public string? SourceSheet { get; set; }
    public string? SourceRowLabel { get; set; }
}

public class DragonDiceItem
{
    public int Id { get; set; }
    public string DieName { get; set; } = string.Empty;
    public string? RaceOrSpecies { get; set; }
    public string? Role { get; set; }
    public string? DieType { get; set; }
    public string? Health { get; set; }
    public string? Points { get; set; }
    public short OwnedQty { get; set; }
    public short WantQty { get; set; }
    public string StatusID { get; set; } = "H";
    public string? NoteCode { get; set; }
    public bool IsAlternative { get; set; }
    public bool IsReprint { get; set; }
    public string? Notes { get; set; }
    public string? SourceSheet { get; set; }
    public string? SourceRowLabel { get; set; }
}
