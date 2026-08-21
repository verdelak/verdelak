using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Models
{
    public class MusicArtistBio
    {
        [Key]
        public int ArtistID { get; set; }

        public string? BioText { get; set; } = string.Empty;
        public string? AdditionalInfo { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(ArtistID))]
        public MusicArtist Artist { get; set; } = null!;
    }
}
