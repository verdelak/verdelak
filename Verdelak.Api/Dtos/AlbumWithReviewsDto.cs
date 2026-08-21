using Verdelak.Api.Dtos;

namespace Verdelak.Api.Dtos
{

    public class AlbumWithReviewsDto
    {
        public int ID { get; set; }
        public string Title { get; set; }

        public ArtistDto Artist { get; set; }

        public List<ReviewDto> Reviews { get; set; }

        public DateTime? ReleaseDate { get; set; }
        public string? InfoText { get; set; }
        public string? AdditionalInfo { get; set; }
        public string Format { get; set; } = "CD";
    }
}
