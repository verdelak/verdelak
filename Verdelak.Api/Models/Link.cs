using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Models
{
    public class Link
    {
        [Key]
        public int ID { get; set; }

        [Required]
        public string Name { get; set; } = "";

        [Required]
        public string URL { get; set; } = "";

        public DateTime? VerificationDate { get; set; }

        public int? TopicID { get; set; }
        public int? SubTopicID { get; set; }

        [ForeignKey("TopicID")]
        public LinkTopic? Topic { get; set; }

        [ForeignKey("SubTopicID")]
        public LinkSubTopic? SubTopic { get; set; }
    }
}
