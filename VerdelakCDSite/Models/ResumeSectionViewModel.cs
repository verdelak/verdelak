namespace VerdelakCDSite.Models;

public sealed record ResumeSectionViewModel(
    string Title,
    IReadOnlyList<PublicResumeItem> Items,
    bool Compact = false);
