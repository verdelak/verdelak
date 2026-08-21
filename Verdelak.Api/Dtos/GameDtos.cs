namespace Verdelak.Api.Dtos
{
    public class GamePlayDto
    {
        public DateTime PlayDate { get; set; }
        public int PlayCount { get; set; } = 1;
        public string? Notes { get; set; }
    }
}
