namespace Verdelak.Api.Dtos
{
    public class AlbumInfoDto
    {
        public DateTime? ReleaseDate { get; set; }
        public string? InfoText { get; set; }
        public string? AdditionalInfo { get; set; }
        public string Format { get; set; } = "CD";
    }
}
