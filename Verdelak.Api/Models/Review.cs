using Verdelak.Api.Models;

namespace Verdelak.Api.Models
{
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;

    [Table("Review")]
    public class Review
    {
        public int ID { get; set; }

        [Required]
        public int AlbumID { get; set; }

        public int ReviewerID { get; set; }

        [ForeignKey(nameof(AlbumID))]
        public MusicAlbum? Album { get; set; }


        [Required]
        [Range(0, 10)]
        public int Rating { get; set; }

        public string? Text { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ReviewerID")]
        public AppUser Reviewer { get; set; } = null!;


    }

}