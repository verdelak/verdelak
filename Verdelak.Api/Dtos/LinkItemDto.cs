namespace Verdelak.Api.Dtos
{
    public class LinkItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Url { get; set; } = "";
        public DateTime? VerificationDate { get; set; }
    }
}
