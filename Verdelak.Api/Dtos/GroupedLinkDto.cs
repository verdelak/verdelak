namespace Verdelak.Api.Dtos
{
    public class GroupedLinkDto
    {
        public string Topic { get; set; } = "Uncategorized";
        public List<SubTopicGroupDto> SubTopics { get; set; } = new();
    }
}
