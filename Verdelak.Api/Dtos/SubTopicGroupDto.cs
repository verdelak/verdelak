namespace Verdelak.Api.Dtos
{
    public class SubTopicGroupDto
    {
        public string SubTopic { get; set; } = "General";
        public List<LinkItemDto> Links { get; set; } = new();
    }
}
