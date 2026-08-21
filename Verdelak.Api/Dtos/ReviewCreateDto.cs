namespace Verdelak.Api.Dtos
{
    public class ReviewCreateDto
    {
        public int AlbumID { get; set; }
        public int ReviewerID { get; set; }
        public int Rating { get; set; }
        public string? Text { get; set; }
    }
}
