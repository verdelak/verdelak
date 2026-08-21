using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Models
{
    public class AppUser
    {
        [Key]
        public int ID { get; set; }

        [Required]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;  // hashed!

        [Required]
        public string Role { get; set; } = "User";

        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
