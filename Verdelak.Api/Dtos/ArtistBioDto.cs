using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Dtos
{
    public class ArtistBioDto
    {
        public int ArtistID { get; set; }

        [MaxLength(2000)]
        public string BioText { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string AdditionalInfo { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; }
    }
}
