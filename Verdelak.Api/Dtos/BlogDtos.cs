using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Dtos;

public record BlogTagDto(
    int Id,
    string Name,
    string Slug
);

public record BlogPostSummaryDto(
    int Id,
    string Title,
    string Slug,
    string Excerpt,
    DateTime PostedDate,
    string Status,
    bool IsPublic,
    IReadOnlyCollection<BlogTagDto> Tags
);

public record BlogPostDetailDto(
    int Id,
    string Title,
    string Slug,
    string BodyMarkdown,
    DateTime PostedDate,
    string Status,
    bool IsPublic,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IReadOnlyCollection<BlogTagDto> Tags
);

public record BlogArchiveMonthDto(
    int Year,
    int Month,
    int Count
);

public record PagedResultDto<T>(
    IReadOnlyCollection<T> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);

public class BlogPostSaveDto
{
    [Required]
    public string Title { get; set; } = string.Empty;

    public string? Slug { get; set; }

    [Required]
    public string BodyMarkdown { get; set; } = string.Empty;

    public DateTime PostedDate { get; set; } = DateTime.UtcNow;

    [Required]
    public string Status { get; set; } = string.Empty;

    public bool IsPublic { get; set; }

    public List<string> Tags { get; set; } = [];
}
