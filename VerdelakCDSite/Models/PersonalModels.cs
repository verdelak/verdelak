namespace VerdelakCDSite.Models;

public sealed class PersonalIndexViewModel
{
    public PublicAppearanceSettings Appearance { get; init; } = PublicAppearanceSettings.PersonalSiteDefault;

    public string ApiBaseUrl { get; init; } = string.Empty;

    public string? ErrorMessage { get; init; }

    public PublicResumeDocument Resume { get; init; } = PublicResumeDocument.Empty;

    public PublicResumeProfile Profile => Resume.Profile;

    public IReadOnlyList<PublicResumeItem> Experience => SectionItems("Experience");

    public IReadOnlyList<PublicResumeItem> Projects => SectionItems("Projects");

    public IReadOnlyList<PublicResumeItem> Skills => SectionItems("Skills");

    public IReadOnlyList<PublicResumeItem> Education => SectionItems("Education");

    public IReadOnlyList<PublicResumeItem> CertificationsAndAwards => SectionItems("Certifications & Awards");

    public bool HasContact =>
        !string.IsNullOrWhiteSpace(Profile.Email) ||
        !string.IsNullOrWhiteSpace(Profile.Phone) ||
        !string.IsNullOrWhiteSpace(Profile.Location) ||
        !string.IsNullOrWhiteSpace(Profile.Website);

    private IReadOnlyList<PublicResumeItem> SectionItems(string section) =>
        Resume.Items
            .Where(item => string.Equals(item.Section, section, StringComparison.OrdinalIgnoreCase))
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Id)
            .ToList();
}

public sealed class PublicResumeDocument
{
    public static PublicResumeDocument Empty { get; } = new()
    {
        Profile = new PublicResumeProfile
        {
            Name = "Verdelak",
            Title = "Resume",
            Location = "United States",
            Summary = "Resume content has not been filled in yet."
        }
    };

    public PublicResumeProfile Profile { get; init; } = new();

    public IReadOnlyList<PublicResumeItem> Items { get; init; } = [];
}

public sealed class PublicResumeProfile
{
    public int Id { get; init; }

    public string Name { get; init; } = "Verdelak";

    public string Title { get; init; } = "Resume";

    public string? Location { get; init; }

    public string? Email { get; init; }

    public string? Phone { get; init; }

    public string? Website { get; init; }

    public string Summary { get; init; } = string.Empty;
}

public sealed class PublicResumeItem
{
    public int Id { get; init; }

    public string Section { get; init; } = string.Empty;

    public int SortOrder { get; init; }

    public string Title { get; init; } = string.Empty;

    public string? Subtitle { get; init; }

    public string? StartText { get; init; }

    public string? EndText { get; init; }

    public string? Location { get; init; }

    public string? Body { get; init; }

    public IReadOnlyList<string> Tags { get; init; } = [];

    public bool IsActive { get; init; }

    public string DateRange
    {
        get
        {
            if (string.IsNullOrWhiteSpace(StartText) && string.IsNullOrWhiteSpace(EndText))
            {
                return string.Empty;
            }

            return string.IsNullOrWhiteSpace(EndText)
                ? StartText ?? string.Empty
                : $"{StartText} - {EndText}";
        }
    }
}
