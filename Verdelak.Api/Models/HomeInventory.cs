namespace Verdelak.Api.Models
{
    public class HomeInventoryItem
    {
        public int ID { get; set; }
        public int RoomId { get; set; }
        public string Item { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? MakeModel { get; set; }
        public string? SerialNumber { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public string? PurchaseLocation { get; set; }
        public decimal? PurchasePrice { get; set; }
        public decimal? EstimatedValue { get; set; }

        public Location Room { get; set; } = null!;
        public ICollection<HomeInventoryImage> Images { get; set; } = new List<HomeInventoryImage>();
        public ICollection<HomeInventoryNote> Notes { get; set; } = new List<HomeInventoryNote>();
    }

    public class HomeInventoryImage
    {
        public int ID { get; set; }
        public int ItemID { get; set; }
        public string ImageName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public byte[] Image { get; set; } = [];

        public HomeInventoryItem Item { get; set; } = null!;
        public string? ContentType { get; set; }
    }

    public class HomeInventoryNote
    {
        public int ID { get; set; }
        public int ItemID { get; set; }
        public short NoteNum { get; set; }
        public short NotePartNum { get; set; }
        public string Note { get; set; } = string.Empty;

        public HomeInventoryItem Item { get; set; } = null!;
    }

    public class Location
    {
        public int ID { get; set; }
        public string LocationName { get; set; } = string.Empty;

        public ICollection<HomeInventoryItem> Items { get; set; } = new List<HomeInventoryItem>();
    }

}
