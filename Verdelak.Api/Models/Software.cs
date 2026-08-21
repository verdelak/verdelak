namespace Verdelak.Api.Models;

public class Software
{
    public int ID { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? StatusID { get; set; }
    public int PlatformID { get; set; }
    public int? LocationID { get; set; }
    public string? Publisher { get; set; }
    public string? Developer { get; set; }
    public string? VersionEdition { get; set; }
    public string? MediaType { get; set; }
    public string? SerialLicenseKeyNotes { get; set; }
    public bool HasBox { get; set; }
    public bool HasManual { get; set; }
    public bool HasDisc { get; set; }
    public string? Notes { get; set; }

    public SoftwarePlatform? Platform { get; set; }
    public SoftwareLocation? Location { get; set; }
}

public class SoftwarePlatform
{
    public int ID { get; set; }
    public string Platform { get; set; } = string.Empty;

    public List<Software> Software { get; set; } = [];
}

public class SoftwareLocation
{
    public int ID { get; set; }
    public string Location { get; set; } = string.Empty;

    public List<Software> Software { get; set; } = [];
}
