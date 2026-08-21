using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Models
{
    public class LinkTopic
    {
        [Key]
        public int ID { get; set; }

        [Required]
        [MaxLength(50)]
        public string Topic { get; set; } = "";

        public ICollection<LinkSubTopic>? SubTopics { get; set; }
        public ICollection<Link>? Links { get; set; }
    }
}
