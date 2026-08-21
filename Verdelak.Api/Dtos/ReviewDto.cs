namespace Verdelak.Api.Dtos
{
    public class ReviewDto
    {
        public int ID { get; set; }
        public int AlbumID { get; set; }
        public int ReviewerID { get; set; }
        public int Rating { get; set; }
        public string Text { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
    }

}
