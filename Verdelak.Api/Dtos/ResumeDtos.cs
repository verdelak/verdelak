namespace Verdelak.Api.Dtos;

public record ResumeProfileDto(
    int Id,
    string Name,
    string Title,
    string? Location,
    string? Email,
    string? Phone,
    string? Website,
    string Summary);

public record ResumeItemDto(
    int Id,
    string Section,
    int SortOrder,
    string Title,
    string? Subtitle,
    string? StartText,
    string? EndText,
    string? Location,
    string? Body,
    IReadOnlyList<string> Tags,
    bool IsActive);

public record ResumeSaveProfileDto(
    string Name,
    string Title,
    string? Location,
    string? Email,
    string? Phone,
    string? Website,
    string Summary);

public record ResumeSaveItemDto(
    string Section,
    int SortOrder,
    string Title,
    string? Subtitle,
    string? StartText,
    string? EndText,
    string? Location,
    string? Body,
    IReadOnlyList<string> Tags,
    bool IsActive);

public record ResumeDocumentDto(
    ResumeProfileDto Profile,
    IReadOnlyList<ResumeItemDto> Items);
