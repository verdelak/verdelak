namespace Verdelak.Api.Dtos
{
    public class LinkDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Url { get; set; } = "";
        public DateTime? VerificationDate { get; set; }
        public string? Topic { get; set; }
        public string? SubTopic { get; set; }
    }
}
