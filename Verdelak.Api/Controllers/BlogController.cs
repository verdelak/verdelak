using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/blog")]
public class BlogController : ControllerBase
{
    private readonly VerdelakDbContext _context;

    public BlogController(VerdelakDbContext context)
    {
        _context = context;
    }

    [HttpGet("posts")]
    public async Task<ActionResult<PagedResultDto<BlogPostSummaryDto>>> GetPosts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? tag = null,
        [FromQuery] int? year = null,
        [FromQuery] int? month = null)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = PublishedPosts();
        query = ApplyFilters(query, search, tag, year, month);

        var totalCount = await query.CountAsync();
        var posts = await query
            .OrderByDescending(post => post.PostedDate)
            .ThenByDescending(post => post.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

        return Ok(new PagedResultDto<BlogPostSummaryDto>(
            posts.Select(ToSummaryDto).ToList(),
            page,
            pageSize,
            totalCount,
            totalPages));
    }

    [HttpGet("posts/{slug}")]
    public async Task<ActionResult<BlogPostDetailDto>> GetPost(string slug)
    {
        var post = await PublishedPosts()
            .FirstOrDefaultAsync(post => post.Slug == slug);

        return post is null ? NotFound() : Ok(ToDetailDto(post));
    }

    [HttpGet("tags")]
    public async Task<ActionResult<IEnumerable<BlogTagDto>>> GetTags()
    {
        var tags = await _context.BlogTags
            .Where(tag => tag.BlogPostTags.Any(postTag => postTag.BlogPost.Status == BlogPostStatus.Published))
            .OrderBy(tag => tag.Name)
            .Select(tag => new BlogTagDto(tag.Id, tag.Name, tag.Slug))
            .ToListAsync();

        return Ok(tags);
    }

    [HttpGet("archive")]
    public async Task<ActionResult<IEnumerable<BlogArchiveMonthDto>>> GetArchive()
    {
        var archive = await _context.BlogPosts
            .Where(post => post.Status == BlogPostStatus.Published)
            .GroupBy(post => new { post.PostedDate.Year, post.PostedDate.Month })
            .Select(group => new BlogArchiveMonthDto(group.Key.Year, group.Key.Month, group.Count()))
            .OrderByDescending(group => group.Year)
            .ThenByDescending(group => group.Month)
            .ToListAsync();

        return Ok(archive);
    }

    internal IQueryable<BlogPost> PublishedPosts()
    {
        return _context.BlogPosts
            .AsNoTracking()
            .Include(post => post.BlogPostTags)
            .ThenInclude(postTag => postTag.BlogTag)
            .Where(post => post.Status == BlogPostStatus.Published && post.PostedDate <= DateTime.UtcNow);
    }

    internal static IQueryable<BlogPost> ApplyFilters(
        IQueryable<BlogPost> query,
        string? search,
        string? tag,
        int? year,
        int? month)
    {
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(post => post.Title.Contains(term) || post.BodyMarkdown.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(tag))
        {
            var tagSlug = Slugify(tag);
            query = query.Where(post => post.BlogPostTags.Any(postTag => postTag.BlogTag.Slug == tagSlug));
        }

        if (year.HasValue)
        {
            query = query.Where(post => post.PostedDate.Year == year.Value);
        }

        if (month.HasValue)
        {
            query = query.Where(post => post.PostedDate.Month == month.Value);
        }

        return query;
    }

    internal static BlogPostSummaryDto ToSummaryDto(BlogPost post)
    {
        return new BlogPostSummaryDto(
            post.Id,
            post.Title,
            post.Slug,
            Excerpt(post.BodyMarkdown),
            post.PostedDate,
            post.Status,
            post.IsPublic,
            post.BlogPostTags.Select(postTag => ToTagDto(postTag.BlogTag)).OrderBy(tag => tag.Name).ToList());
    }

    internal static BlogPostDetailDto ToDetailDto(BlogPost post)
    {
        return new BlogPostDetailDto(
            post.Id,
            post.Title,
            post.Slug,
            post.BodyMarkdown,
            post.PostedDate,
            post.Status,
            post.IsPublic,
            post.CreatedAt,
            post.UpdatedAt,
            post.BlogPostTags.Select(postTag => ToTagDto(postTag.BlogTag)).OrderBy(tag => tag.Name).ToList());
    }

    internal static BlogTagDto ToTagDto(BlogTag tag)
    {
        return new BlogTagDto(tag.Id, tag.Name, tag.Slug);
    }

    internal static string Slugify(string value)
    {
        var chars = value.Trim().ToLowerInvariant()
            .Select(c => char.IsLetterOrDigit(c) ? c : '-')
            .ToArray();

        return string.Join('-', new string(chars).Split('-', StringSplitOptions.RemoveEmptyEntries));
    }

    private static string Excerpt(string markdown)
    {
        var text = Regex.Replace(markdown, "<.*?>", string.Empty)
            .Replace("#", string.Empty)
            .Replace("*", string.Empty)
            .Replace("[", string.Empty)
            .Replace("]", string.Empty)
            .Replace("(", string.Empty)
            .Replace(")", string.Empty)
            .Trim();

        return text.Length <= 220 ? text : $"{text[..220].Trim()}...";
    }
}
