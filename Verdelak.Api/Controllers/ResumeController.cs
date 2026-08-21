using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/resume")]
public class ResumeController : ControllerBase
{
    private static readonly string[] Sections = ["Experience", "Projects", "Skills", "Education", "Certifications & Awards"];
    private readonly VerdelakDbContext _context;

    public ResumeController(VerdelakDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ResumeDocumentDto>> GetResume()
    {
        var profile = await GetOrCreateProfile();
        var items = await _context.ResumeItems
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Section)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.Id)
            .ToListAsync();

        return Ok(new ResumeDocumentDto(ToProfileDto(profile), items.Select(ToItemDto).ToList()));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin")]
    public async Task<ActionResult<ResumeDocumentDto>> GetAdminResume()
    {
        var profile = await GetOrCreateProfile();
        var items = await _context.ResumeItems
            .AsNoTracking()
            .OrderBy(x => x.Section)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.Id)
            .ToListAsync();

        return Ok(new ResumeDocumentDto(ToProfileDto(profile), items.Select(ToItemDto).ToList()));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("profile")]
    public async Task<ActionResult<ResumeProfileDto>> SaveProfile(ResumeSaveProfileDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Title))
        {
            return BadRequest("Name and title are required.");
        }

        var profile = await GetOrCreateProfile();
        profile.Name = dto.Name.Trim();
        profile.Title = dto.Title.Trim();
        profile.Location = Clean(dto.Location);
        profile.Email = Clean(dto.Email);
        profile.Phone = Clean(dto.Phone);
        profile.Website = Clean(dto.Website);
        profile.Summary = dto.Summary?.Trim() ?? string.Empty;
        profile.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(ToProfileDto(profile));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("items")]
    public async Task<ActionResult<ResumeItemDto>> CreateItem(ResumeSaveItemDto dto)
    {
        var validation = ValidateItem(dto);
        if (validation is not null)
        {
            return validation;
        }

        var item = new ResumeItem();
        ApplyItem(item, dto);

        _context.ResumeItems.Add(item);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAdminResume), new { id = item.Id }, ToItemDto(item));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("items/{id:int}")]
    public async Task<ActionResult<ResumeItemDto>> UpdateItem(int id, ResumeSaveItemDto dto)
    {
        var item = await _context.ResumeItems.FindAsync(id);
        if (item is null)
        {
            return NotFound();
        }

        var validation = ValidateItem(dto);
        if (validation is not null)
        {
            return validation;
        }

        ApplyItem(item, dto);
        await _context.SaveChangesAsync();

        return Ok(ToItemDto(item));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("items/{id:int}")]
    public async Task<IActionResult> DeleteItem(int id)
    {
        var item = await _context.ResumeItems.FindAsync(id);
        if (item is null)
        {
            return NotFound();
        }

        _context.ResumeItems.Remove(item);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<ResumeProfile> GetOrCreateProfile()
    {
        var profile = await _context.ResumeProfiles.FirstOrDefaultAsync();
        if (profile is not null)
        {
            return profile;
        }

        profile = new ResumeProfile
        {
            Name = "Verdelak",
            Title = "Resume",
            Location = "United States",
            Summary = "Resume content has not been filled in yet."
        };
        _context.ResumeProfiles.Add(profile);
        await _context.SaveChangesAsync();

        return profile;
    }

    private static ActionResult? ValidateItem(ResumeSaveItemDto dto)
    {
        if (!Sections.Contains(dto.Section))
        {
            return new BadRequestObjectResult("Section must be Experience, Projects, Skills, Education, or Certifications & Awards.");
        }

        return string.IsNullOrWhiteSpace(dto.Title)
            ? new BadRequestObjectResult("Title is required.")
            : null;
    }

    private static void ApplyItem(ResumeItem item, ResumeSaveItemDto dto)
    {
        item.Section = dto.Section;
        item.SortOrder = dto.SortOrder;
        item.Title = dto.Title.Trim();
        item.Subtitle = Clean(dto.Subtitle);
        item.StartText = Clean(dto.StartText);
        item.EndText = Clean(dto.EndText);
        item.Location = Clean(dto.Location);
        item.Body = Clean(dto.Body);
        item.TagsCsv = string.Join(", ", dto.Tags.Select(tag => tag.Trim()).Where(tag => !string.IsNullOrWhiteSpace(tag)).Distinct(StringComparer.OrdinalIgnoreCase));
        item.IsActive = dto.IsActive;
        item.UpdatedAt = DateTime.UtcNow;
    }

    private static ResumeProfileDto ToProfileDto(ResumeProfile profile) => new(
        profile.Id,
        profile.Name,
        profile.Title,
        profile.Location,
        profile.Email,
        profile.Phone,
        profile.Website,
        profile.Summary);

    private static ResumeItemDto ToItemDto(ResumeItem item) => new(
        item.Id,
        item.Section,
        item.SortOrder,
        item.Title,
        item.Subtitle,
        item.StartText,
        item.EndText,
        item.Location,
        item.Body,
        ParseTags(item.TagsCsv),
        item.IsActive);

    private static IReadOnlyList<string> ParseTags(string? tagsCsv) =>
        string.IsNullOrWhiteSpace(tagsCsv)
            ? []
            : tagsCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
