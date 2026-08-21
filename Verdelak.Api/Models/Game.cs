using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Models
{
    public class Game
    {
        public int GameID { get; set; }
        public string Title { get; set; } = string.Empty;
        public bool IsExpansion { get; set; }
        public int? BaseGameID { get; set; }

        public decimal? BGG_Rating { get; set; }
        public decimal? PersonalRating { get; set; }

        public bool Owns { get; set; }
        public bool Wishlist { get; set; }

        public string? Notes { get; set; }

        public virtual ICollection<GamePlay> GamePlays { get; set; } = new List<GamePlay>();
    }

    public class GamePlay
    {
        [Key]
        public int PlayID { get; set; }
        public int GameID { get; set; }
        public DateTime PlayDate { get; set; }
        public int PlayCount { get; set; }
        public string? Notes { get; set; }

        public virtual Game Game { get; set; } = null!;
    }
}
