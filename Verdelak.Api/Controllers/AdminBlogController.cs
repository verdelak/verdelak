using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/admin/blog")]
[Authorize(Roles = "Admin")]
public class AdminBlogController : ControllerBase
{
    private readonly VerdelakDbContext _context;

    public AdminBlogController(VerdelakDbContext context)
    {
        _context = context;
    }

    [HttpGet("posts")]
    public async Task<ActionResult<PagedResultDto<BlogPostSummaryDto>>> GetPosts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null,
        [FromQuery] string? tag = null)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.BlogPosts
            .AsNoTracking()
            .Include(post => post.BlogPostTags)
            .ThenInclude(postTag => postTag.BlogTag)
            .AsQueryable();

        query = BlogController.ApplyFilters(query, search, tag, null, null);

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(post => post.Status == status.Trim());
        }

        var totalCount = await query.CountAsync();
        var posts = await query
            .OrderByDescending(post => post.PostedDate)
            .ThenByDescending(post => post.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

        return Ok(new PagedResultDto<BlogPostSummaryDto>(
            posts.Select(BlogController.ToSummaryDto).ToList(),
            page,
            pageSize,
            totalCount,
            totalPages));
    }

    [HttpGet("posts/{id:int}")]
    public async Task<ActionResult<BlogPostDetailDto>> GetPost(int id)
    {
        var post = await _context.BlogPosts
            .AsNoTracking()
            .Include(post => post.BlogPostTags)
            .ThenInclude(postTag => postTag.BlogTag)
            .FirstOrDefaultAsync(post => post.Id == id);

        return post is null ? NotFound() : Ok(BlogController.ToDetailDto(post));
    }

    [HttpGet("statuses")]
    public ActionResult<IEnumerable<string>> GetStatuses()
    {
        return Ok(BlogPostStatus.All);
    }

    [HttpPost("posts")]
    public async Task<ActionResult<BlogPostDetailDto>> CreatePost(BlogPostSaveDto dto)
    {
        var validation = await ValidateSave(dto);

        if (validation is not null)
        {
            return validation;
        }

        var slug = await UniqueSlug(dto.Slug, dto.Title);
        var post = new BlogPost
        {
            Title = dto.Title.Trim(),
            Slug = slug,
            BodyMarkdown = dto.BodyMarkdown.Trim(),
            PostedDate = dto.PostedDate,
            Status = dto.Status.Trim(),
            IsPublic = dto.IsPublic,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await ApplyTags(post, dto.Tags);
        _context.BlogPosts.Add(post);
        await _context.SaveChangesAsync();

        await LoadTags(post);

        return CreatedAtAction(nameof(GetPost), new { id = post.Id }, BlogController.ToDetailDto(post));
    }

    [HttpPut("posts/{id:int}")]
    public async Task<ActionResult<BlogPostDetailDto>> UpdatePost(int id, BlogPostSaveDto dto)
    {
        var post = await _context.BlogPosts
            .Include(post => post.BlogPostTags)
            .ThenInclude(postTag => postTag.BlogTag)
            .FirstOrDefaultAsync(post => post.Id == id);

        if (post is null)
        {
            return NotFound();
        }

        var validation = await ValidateSave(dto, id);

        if (validation is not null)
        {
            return validation;
        }

        post.Title = dto.Title.Trim();
        post.Slug = await UniqueSlug(dto.Slug, dto.Title, id);
        post.BodyMarkdown = dto.BodyMarkdown.Trim();
        post.PostedDate = dto.PostedDate;
        post.Status = dto.Status.Trim();
        post.IsPublic = dto.IsPublic;
        post.UpdatedAt = DateTime.UtcNow;

        post.BlogPostTags.Clear();
        await ApplyTags(post, dto.Tags);
        await _context.SaveChangesAsync();

        await LoadTags(post);

        return Ok(BlogController.ToDetailDto(post));
    }

    [HttpDelete("posts/{id:int}")]
    public async Task<IActionResult> DeletePost(int id)
    {
        var post = await _context.BlogPosts.FindAsync(id);

        if (post is null)
        {
            return NotFound();
        }

        _context.BlogPosts.Remove(post);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<ActionResult?> ValidateSave(BlogPostSaveDto dto, int? currentPostId = null)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest("Title is required.");
        }

        if (string.IsNullOrWhiteSpace(dto.BodyMarkdown))
        {
            return BadRequest("Body text is required.");
        }

        if (!BlogPostStatus.All.Contains(dto.Status))
        {
            return BadRequest("Status must be Draft or Published.");
        }

        var slug = BlogController.Slugify(string.IsNullOrWhiteSpace(dto.Slug) ? dto.Title : dto.Slug);
        var slugExists = await _context.BlogPosts
            .AnyAsync(post => post.Slug == slug && (!currentPostId.HasValue || post.Id != currentPostId.Value));

        return slugExists ? Conflict("A blog post with that slug already exists.") : null;
    }

    private async Task<string> UniqueSlug(string? requestedSlug, string title, int? currentPostId = null)
    {
        var baseSlug = BlogController.Slugify(string.IsNullOrWhiteSpace(requestedSlug) ? title : requestedSlug);
        var slug = baseSlug;
        var suffix = 2;

        while (await _context.BlogPosts.AnyAsync(post => post.Slug == slug && (!currentPostId.HasValue || post.Id != currentPostId.Value)))
        {
            slug = $"{baseSlug}-{suffix}";
            suffix++;
        }

        return slug;
    }

    private async Task ApplyTags(BlogPost post, IEnumerable<string> tagNames)
    {
        var normalizedNames = tagNames
            .Select(tag => tag.Trim())
            .Where(tag => !string.IsNullOrWhiteSpace(tag))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        foreach (var tagName in normalizedNames)
        {
            var slug = BlogController.Slugify(tagName);
            var tag = await _context.BlogTags.FirstOrDefaultAsync(existing => existing.Slug == slug);

            if (tag is null)
            {
                tag = new BlogTag
                {
                    Name = tagName,
                    Slug = slug
                };
            }

            post.BlogPostTags.Add(new BlogPostTag
            {
                BlogPost = post,
                BlogTag = tag
            });
        }
    }

    private async Task LoadTags(BlogPost post)
    {
        await _context.Entry(post)
            .Collection(x => x.BlogPostTags)
            .Query()
            .Include(postTag => postTag.BlogTag)
            .LoadAsync();
    }
}
