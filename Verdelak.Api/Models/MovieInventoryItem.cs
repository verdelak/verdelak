namespace Verdelak.Api.Models;

public class MovieInventoryItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Creator { get; set; }
    public string Format { get; set; } = "DVD";
    public string WantStatusID { get; set; } = "H";
    public string? ReleaseYear { get; set; }
    public string? Barcode { get; set; }
    public string? Source { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
}
