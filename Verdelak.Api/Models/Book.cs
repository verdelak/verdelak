using System.ComponentModel.DataAnnotations.Schema;

namespace Verdelak.Api.Models;

[Table("Books")]
public class Book
{
    public int ID { get; set; }
    public string Title { get; set; } = string.Empty;
    public int AuthorID { get; set; }
    public int? SeriesID { get; set; }
    public int? SubSeriesID { get; set; }
    public short? SeriesNumber { get; set; }

    public BookAuthor? Author { get; set; }
    public BookSeries? Series { get; set; }
    public BookSubSeries? SubSeries { get; set; }
    public BookStatus? Status { get; set; }
}

[Table("BookAuthors")]
public class BookAuthor
{
    public int ID { get; set; }
    public string LName { get; set; } = string.Empty;
    public string? Fname { get; set; }
    public string? Middle { get; set; }

    public List<Book> Books { get; set; } = new();
}

[Table("BookFormats")]
public class BookFormat
{
    public int ID { get; set; }
    public string Format { get; set; } = string.Empty;

    public List<BookStatus> BookStatuses { get; set; } = new();
}

[Table("BookSeries")]
public class BookSeries
{
    public int ID { get; set; }
    public string Series { get; set; } = string.Empty;

    public List<Book> Books { get; set; } = new();
    public List<BookSubSeries> SubSeries { get; set; } = new();
}

[Table("BookSubSeries")]
public class BookSubSeries
{
    public int ID { get; set; }
    public string SubSeries { get; set; } = string.Empty;
    public int SeriesID { get; set; }

    public BookSeries? Series { get; set; }
    public List<Book> Books { get; set; } = new();
}

[Table("BookStatus")]
public class BookStatus
{
    public int ID { get; set; }
    public int BooksID { get; set; }
    public string WantStatusID { get; set; } = "H";
    public int FormatID { get; set; }

    public Book? Book { get; set; }
    public BookFormat? Format { get; set; }
}
