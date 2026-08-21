using System.ComponentModel.DataAnnotations.Schema;

namespace Verdelak.Api.Models;

[Table("ChessexCategories")]
public class ChessexCategory
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public List<ChessexSet> Sets { get; set; } = new();
}

[Table("ChessexSetTypes")]
public class ChessexSetType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }

    public List<ChessexSet> Sets { get; set; } = new();
}

[Table("ChessexSets")]
public class ChessexSet
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ProductCode { get; set; }
    public int CategoryId { get; set; }
    public int SetTypeId { get; set; }
    public short? DiceCount { get; set; }
    public string? Color { get; set; }
    public string? Notes { get; set; }
    public string WantStatusID { get; set; } = "H";
    public short Qty { get; set; } = 1;

    public ChessexCategory? Category { get; set; }
    public ChessexSetType? SetType { get; set; }
}
