namespace Verdelak.Api.Models;

public class BlogPost
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string BodyMarkdown { get; set; } = string.Empty;
    public DateTime PostedDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = BlogPostStatus.Draft;
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<BlogPostTag> BlogPostTags { get; set; } = new List<BlogPostTag>();
}

public static class BlogPostStatus
{
    public const string Draft = "Draft";
    public const string Published = "Published";

    public static readonly string[] All = [Draft, Published];
}
