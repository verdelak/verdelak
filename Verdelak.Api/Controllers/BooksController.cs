using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/books")]
public class BooksController(VerdelakDbContext context) : ControllerBase
{
    private const string OwnedStatus = "H";
    private const string WantedStatus = "W";

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<BookListItemDto>>> GetBooks(
        [FromQuery] string? format,
        [FromQuery] string? q,
        CancellationToken cancellationToken)
    {
        var books = await QueryBooks(OwnedStatus, format, q)
            .OrderBy(book => book.Author!.LName)
            .ThenBy(book => book.Author!.Fname)
            .ThenBy(book => book.Series!.Series)
            .ThenBy(book => book.SeriesNumber)
            .ThenBy(book => book.Title)
            .ToListAsync(cancellationToken);

        return books.Select(ToDto).ToList();
    }

    [AllowAnonymous]
    [HttpGet("want-list")]
    public async Task<ActionResult<IEnumerable<BookListItemDto>>> GetWantList(CancellationToken cancellationToken)
    {
        var books = await QueryBooks(WantedStatus)
            .OrderBy(book => book.Author!.LName)
            .ThenBy(book => book.Title)
            .ToListAsync(cancellationToken);

        return books.Select(ToDto).ToList();
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<BookListItemDto>> GetBook(int id, CancellationToken cancellationToken)
    {
        var book = await BookIncludes()
            .FirstOrDefaultAsync(book => book.ID == id, cancellationToken);

        return book is null ? NotFound() : ToDto(book);
    }

    [AllowAnonymous]
    [HttpGet("formats")]
    public async Task<IEnumerable<BookLookupDto>> GetFormats(CancellationToken cancellationToken) =>
        await context.BookFormats
            .OrderBy(format => format.Format)
            .Select(format => new BookLookupDto(format.ID, format.Format))
            .ToListAsync(cancellationToken);

    [AllowAnonymous]
    [HttpGet("authors")]
    public async Task<IEnumerable<BookLookupDto>> GetAuthors(CancellationToken cancellationToken) =>
        await context.BookAuthors
            .OrderBy(author => author.LName)
            .ThenBy(author => author.Fname)
            .Select(author => new BookLookupDto(author.ID, FormatAuthor(author)))
            .ToListAsync(cancellationToken);

    [AllowAnonymous]
    [HttpGet("series")]
    public async Task<IEnumerable<BookLookupDto>> GetSeries(CancellationToken cancellationToken) =>
        await context.BookSeries
            .OrderBy(series => series.Series)
            .Select(series => new BookLookupDto(series.ID, series.Series))
            .ToListAsync(cancellationToken);

    [AllowAnonymous]
    [HttpGet("sub-series")]
    public async Task<IEnumerable<BookLookupDto>> GetSubSeries([FromQuery] int? seriesId, CancellationToken cancellationToken)
    {
        var query = context.BookSubSeries.AsQueryable();

        if (seriesId is not null)
        {
            query = query.Where(subSeries => subSeries.SeriesID == seriesId);
        }

        return await query
            .OrderBy(subSeries => subSeries.SubSeries)
            .Select(subSeries => new BookLookupDto(subSeries.ID, subSeries.SubSeries))
            .ToListAsync(cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost]
    public async Task<ActionResult<BookListItemDto>> CreateBook(BookSaveDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var author = await ResolveAuthor(dto, cancellationToken);
        var series = await ResolveSeries(dto, cancellationToken);
        var subSeries = await ResolveSubSeries(dto, series?.ID, cancellationToken);
        var format = await ResolveFormat(dto, cancellationToken);

        var book = new Book
        {
            Title = dto.Title.Trim(),
            Author = author,
            Series = series,
            SubSeries = subSeries,
            SeriesNumber = dto.SeriesNumber,
            Status = new BookStatus
            {
                WantStatusID = NormalizeWantStatus(dto.WantStatusID),
                FormatID = format.ID
            }
        };

        context.Books.Add(book);
        await context.SaveChangesAsync(cancellationToken);

        var saved = await BookIncludes().FirstAsync(item => item.ID == book.ID, cancellationToken);
        return CreatedAtAction(nameof(GetBook), new { id = book.ID }, ToDto(saved));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateBook(int id, BookSaveDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var book = await context.Books
            .Include(item => item.Status)
            .FirstOrDefaultAsync(item => item.ID == id, cancellationToken);

        if (book is null)
        {
            return NotFound();
        }

        var author = await ResolveAuthor(dto, cancellationToken);
        var series = await ResolveSeries(dto, cancellationToken);
        var subSeries = await ResolveSubSeries(dto, series?.ID, cancellationToken);
        var format = await ResolveFormat(dto, cancellationToken);

        book.Title = dto.Title.Trim();
        book.Author = author;
        book.Series = series;
        book.SubSeries = subSeries;
        book.SeriesNumber = dto.SeriesNumber;
        book.Status ??= new BookStatus { BooksID = id };
        book.Status.WantStatusID = NormalizeWantStatus(dto.WantStatusID);
        book.Status.FormatID = format.ID;

        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteBook(int id, CancellationToken cancellationToken)
    {
        var book = await context.Books
            .Include(item => item.Status)
            .FirstOrDefaultAsync(item => item.ID == id, cancellationToken);

        if (book is null)
        {
            return NotFound();
        }

        if (book.Status is not null)
        {
            context.BookStatuses.Remove(book.Status);
        }

        context.Books.Remove(book);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private IQueryable<Book> QueryBooks(string wantStatus, string? format = null, string? q = null)
    {
        var normalizedFormat = NormalizeFormat(format);
        var query = BookIncludes();

        query = wantStatus == OwnedStatus
            ? query.Where(book => book.Status == null || book.Status.WantStatusID == OwnedStatus)
            : query.Where(book => book.Status != null && book.Status.WantStatusID == WantedStatus);

        if (normalizedFormat is not null)
        {
            query = query.Where(book => book.Status != null && book.Status.Format != null && book.Status.Format.Format == normalizedFormat);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(book =>
                book.Title.Contains(term) ||
                book.Author!.LName.Contains(term) ||
                (book.Author.Fname ?? "").Contains(term) ||
                (book.Series != null && book.Series.Series.Contains(term)) ||
                (book.SubSeries != null && book.SubSeries.SubSeries.Contains(term)));
        }

        return query;
    }

    private IQueryable<Book> BookIncludes() =>
        context.Books
            .AsNoTracking()
            .Include(book => book.Author)
            .Include(book => book.Series)
            .Include(book => book.SubSeries)
            .Include(book => book.Status)!.ThenInclude(status => status.Format);

    private async Task<BookAuthor> ResolveAuthor(BookSaveDto dto, CancellationToken cancellationToken)
    {
        if (dto.AuthorID is not null)
        {
            return await context.BookAuthors.FirstAsync(author => author.ID == dto.AuthorID, cancellationToken);
        }

        var lastName = string.IsNullOrWhiteSpace(dto.AuthorLastName) ? "(Unknown)" : dto.AuthorLastName.Trim();
        var firstName = string.IsNullOrWhiteSpace(dto.AuthorFirstName) ? null : dto.AuthorFirstName.Trim();
        var middle = string.IsNullOrWhiteSpace(dto.AuthorMiddle) ? null : dto.AuthorMiddle.Trim();

        var existing = await context.BookAuthors.FirstOrDefaultAsync(author =>
            author.LName == lastName && author.Fname == firstName && author.Middle == middle, cancellationToken);

        if (existing is not null)
        {
            return existing;
        }

        var created = new BookAuthor { LName = lastName, Fname = firstName, Middle = middle };
        context.BookAuthors.Add(created);
        return created;
    }

    private async Task<BookSeries?> ResolveSeries(BookSaveDto dto, CancellationToken cancellationToken)
    {
        if (dto.SeriesID is not null)
        {
            return await context.BookSeries.FirstAsync(series => series.ID == dto.SeriesID, cancellationToken);
        }

        if (string.IsNullOrWhiteSpace(dto.SeriesName))
        {
            return null;
        }

        var name = dto.SeriesName.Trim();
        var existing = await context.BookSeries.FirstOrDefaultAsync(series => series.Series == name, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var created = new BookSeries { Series = name };
        context.BookSeries.Add(created);
        return created;
    }

    private async Task<BookSubSeries?> ResolveSubSeries(BookSaveDto dto, int? seriesId, CancellationToken cancellationToken)
    {
        if (dto.SubSeriesID is not null)
        {
            return await context.BookSubSeries.FirstAsync(subSeries => subSeries.ID == dto.SubSeriesID, cancellationToken);
        }

        if (seriesId is null || string.IsNullOrWhiteSpace(dto.SubSeriesName))
        {
            return null;
        }

        var name = dto.SubSeriesName.Trim();
        var existing = await context.BookSubSeries.FirstOrDefaultAsync(subSeries =>
            subSeries.SeriesID == seriesId && subSeries.SubSeries == name, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var created = new BookSubSeries { SeriesID = seriesId.Value, SubSeries = name };
        context.BookSubSeries.Add(created);
        return created;
    }

    private async Task<BookFormat> ResolveFormat(BookSaveDto dto, CancellationToken cancellationToken)
    {
        if (dto.FormatID is not null)
        {
            return await context.BookFormats.FirstAsync(format => format.ID == dto.FormatID, cancellationToken);
        }

        var formatName = NormalizeFormat(dto.Format) ?? "Hardcover";
        var existing = await context.BookFormats.FirstOrDefaultAsync(format => format.Format == formatName, cancellationToken);

        if (existing is not null)
        {
            return existing;
        }

        var created = new BookFormat { Format = formatName };
        context.BookFormats.Add(created);
        return created;
    }

    private static BookListItemDto ToDto(Book book) => new()
    {
        ID = book.ID,
        Title = book.Title,
        Author = FormatAuthor(book.Author),
        Series = book.Series?.Series,
        SubSeries = book.SubSeries?.SubSeries,
        SeriesNumber = book.SeriesNumber,
        Format = book.Status?.Format?.Format ?? "Hardcover",
        WantStatusID = book.Status?.WantStatusID ?? OwnedStatus
    };

    private static string? Validate(BookSaveDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return "Title is required.";
        }

        return null;
    }

    private static string NormalizeWantStatus(string? value) =>
        value?.Trim().Equals(WantedStatus, StringComparison.OrdinalIgnoreCase) == true ? WantedStatus : OwnedStatus;

    private static string? NormalizeFormat(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return value.Trim().ToLowerInvariant() switch
        {
            "hardcover" or "hard cover" or "hc" => "Hardcover",
            "softcover" or "soft cover" or "paperback" or "pb" => "Softcover",
            "audio" or "audiobook" or "audio book" => "Audio Book",
            _ => value.Trim()
        };
    }

    private static string FormatAuthor(BookAuthor? author)
    {
        if (author is null)
        {
            return "(Unknown)";
        }

        var givenNames = string.Join(" ", new[] { author.Fname, author.Middle }
            .Where(value => !string.IsNullOrWhiteSpace(value)));

        return string.IsNullOrWhiteSpace(givenNames)
            ? author.LName
            : $"{author.LName}, {givenNames}";
    }
}
