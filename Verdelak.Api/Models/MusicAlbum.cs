namespace Verdelak.Api.Models
{
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;

    [Table("MusicAlbum")]
    public class MusicAlbum
    {
        public int ID { get; set; }

        public string Title { get; set; } = string.Empty;

        public int ArtistID { get; set; }

        [ForeignKey(nameof(ArtistID))]
        public MusicArtist? Band { get; set; }

        public List<Review> Reviews { get; set; } = new();

        public MusicAlbumInfo? Info { get; set; }

        public MusicAlbumStatus? Status { get; set; }
    }
}
