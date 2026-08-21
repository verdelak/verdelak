using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Models;

public class ResumeProfile
{
    public int Id { get; set; }

    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Location { get; set; }

    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(250)]
    public string? Website { get; set; }

    public string Summary { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class ResumeItem
{
    public int Id { get; set; }

    [MaxLength(50)]
    public string Section { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Subtitle { get; set; }

    [MaxLength(100)]
    public string? StartText { get; set; }

    [MaxLength(100)]
    public string? EndText { get; set; }

    [MaxLength(150)]
    public string? Location { get; set; }

    public string? Body { get; set; }

    public string? TagsCsv { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
