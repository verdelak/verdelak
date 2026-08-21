namespace Verdelak.Api.Models
{
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;

    [Table("MusicArtist")]
    public class MusicArtist
    {
        public int ID { get; set; }

        public string Band { get; set; } = string.Empty;

        public MusicArtistBio? Bio { get; set; }

        public List<MusicAlbum> Albums { get; set; } = new();
    }
}
