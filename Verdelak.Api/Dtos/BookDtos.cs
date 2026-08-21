namespace Verdelak.Api.Dtos;

public record BookLookupDto(int ID, string Name);

public class BookListItemDto
{
    public int ID { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string? Series { get; set; }
    public string? SubSeries { get; set; }
    public short? SeriesNumber { get; set; }
    public string Format { get; set; } = string.Empty;
    public string WantStatusID { get; set; } = "H";
}

public class BookSaveDto
{
    public string Title { get; set; } = string.Empty;
    public int? AuthorID { get; set; }
    public string? AuthorFirstName { get; set; }
    public string? AuthorMiddle { get; set; }
    public string? AuthorLastName { get; set; }
    public int? SeriesID { get; set; }
    public string? SeriesName { get; set; }
    public int? SubSeriesID { get; set; }
    public string? SubSeriesName { get; set; }
    public short? SeriesNumber { get; set; }
    public int? FormatID { get; set; }
    public string? Format { get; set; }
    public string WantStatusID { get; set; } = "H";
}
