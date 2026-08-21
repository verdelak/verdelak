using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Dtos
{
    public class HomeInventoryItemDto
    {
        public int Id { get; set; }

        [Required]
        public string Item { get; set; } = string.Empty;

        public int RoomId { get; set; }

        public string? Description { get; set; }
        public string? MakeModel { get; set; }
        public string? SerialNumber { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public string? PurchaseLocation { get; set; }
        public decimal? PurchasePrice { get; set; }
        public decimal? EstimatedValue { get; set; }
    }

    public class HomeInventoryImageDto
    {
        public int Id { get; set; }
        public int ItemID { get; set; }
        public string ImageName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ContentType { get; set; } = string.Empty;  
        public string ImageBase64 { get; set; } = string.Empty;
    }

    public class HomeInventoryNoteDto
    {
        public int Id { get; set; }
        public int ItemID { get; set; }
        public short NoteNum { get; set; }
        public short NotePartNum { get; set; }
        public string Note { get; set; } = string.Empty;
    }

    public class ImageUploadDto
    {
        public IFormFile File { get; set; } = default!;
        public string? Description { get; set; }
    }

    public class NoteCreateDto
    {
        public string Note { get; set; } = string.Empty;
    }

    public class NoteReplyDto
    {
        public string Note { get; set; } = string.Empty;
    }
}
