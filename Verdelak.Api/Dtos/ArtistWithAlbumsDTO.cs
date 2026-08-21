namespace Verdelak.Api.Dtos
{
    public class ArtistWithAlbumsDto
    {
        public int ID { get; set; }
        public string Artist { get; set; } = "";
        public List<AlbumSummaryDto> Albums { get; set; } = new();
    }

    public class AlbumSummaryDto
    {
        public int ID { get; set; }
        public string Title { get; set; } = "";
        public string Format { get; set; } = "CD";
    }

    public class MusicAlbumSaveDto
    {
        public string Title { get; set; } = "";
        public int ArtistID { get; set; }
        public DateTime? ReleaseDate { get; set; }
        public string? InfoText { get; set; }
        public string? AdditionalInfo { get; set; }
        public string Format { get; set; } = "CD";
    }

    public class MusicWantListItemDto
    {
        public int ID { get; set; }
        public string Artist { get; set; } = "";
        public string Title { get; set; } = "";
        public string Format { get; set; } = "CD";
    }

    public class CdCatalogPageDto
    {
        public string? SearchTerm { get; set; }
        public List<ArtistWithAlbumsDto> Artists { get; set; } = new();
        public List<ArtistLetterGroupDto> ArtistIndex { get; set; } = new();
        public int TotalArtistCount { get; set; }
        public int TotalAlbumCount { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 24;
    }

    public class ArtistLetterGroupDto
    {
        public string Key { get; set; } = "";
        public string Label { get; set; } = "";
        public List<ArtistIndexItemDto> Artists { get; set; } = new();
    }

    public class ArtistIndexItemDto
    {
        public int ID { get; set; }
        public string Artist { get; set; } = "";
    }
}
