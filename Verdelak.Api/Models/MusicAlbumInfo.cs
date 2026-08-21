namespace Verdelak.Api.Models
{
    public class MusicAlbumInfo
    {
        public int ID { get; set; }

        public int AlbumID { get; set; }  // Foreign key
        public DateTime? ReleaseDate { get; set; }
        public string? InfoText { get; set; }
        public string? AdditionalInfo { get; set; }
        public string Format { get; set; } = "CD";

        public MusicAlbum? Album { get; set; }
    }
}
