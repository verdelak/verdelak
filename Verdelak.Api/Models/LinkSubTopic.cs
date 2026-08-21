using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Models
{
    public class LinkSubTopic
    {
        [Key]
        public int ID { get; set; }

        [Required]
        [MaxLength(50)]
        public string SubTopic { get; set; } = "";

        public int TopicID { get; set; }

        [ForeignKey("TopicID")]
        public LinkTopic? Topic { get; set; }

        public ICollection<Link>? Links { get; set; }
    }
}
