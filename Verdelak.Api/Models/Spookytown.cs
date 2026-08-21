namespace Verdelak.Api.Models
{
    public class Spookytown
    {
        public int Id { get; set; }
        public string Name { get; set; } = default!;
        public string? SKU { get; set; }
        public int? Year { get; set; }
        public bool? Retired { get; set; }
        public string? Url { get; set; }
        public short? Qty { get; set; }
        public string? TypeId { get; set; }  // nchar(1)
        public bool Own { get; set; } = false;
        public bool Want { get; set; } = false;

        public SpookytownType? Type { get; set; }
    }

    public class SpookytownType
    {
        public string Id { get; set; } = default!; // nchar(1)
        public string Type { get; set; } = default!;
        public ICollection<Spookytown> Items { get; set; } = new List<Spookytown>();
    }
}
