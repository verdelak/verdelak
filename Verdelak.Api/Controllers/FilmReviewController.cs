using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/film-review")]
public class FilmReviewController(VerdelakDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PublicFilmReviewCatalogDto>> GetFilms(
        [FromQuery] string? search,
        [FromQuery] string? format,
        [FromQuery] bool includeWishlist = true,
        [FromQuery] int limit = 200,
        CancellationToken cancellationToken = default)
    {
        var baseQuery = context.MovieInventoryItems.AsNoTracking();
        var query = ApplyFilters(baseQuery, search, format, includeWishlist);

        limit = Math.Clamp(limit, 1, 500);
        var items = await query
            .OrderBy(item => item.Title)
            .ThenBy(item => item.ReleaseYear)
            .Take(limit)
            .Select(item => ToPublicDto(item))
            .ToListAsync(cancellationToken);

        var totalCount = await query.CountAsync(cancellationToken);
        var ownedCount = await baseQuery.CountAsync(item => item.WantStatusID == "H", cancellationToken);
        var wishlistCount = await baseQuery.CountAsync(item => item.WantStatusID == "W", cancellationToken);
        var formats = await baseQuery
            .Where(item => item.Format != "")
            .Select(item => item.Format)
            .Distinct()
            .OrderBy(value => value)
            .ToListAsync(cancellationToken);

        return Ok(new PublicFilmReviewCatalogDto(
            search,
            format,
            includeWishlist,
            totalCount,
            ownedCount,
            wishlistCount,
            formats,
            items));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PublicFilmReviewItemDto>> GetFilm(int id, CancellationToken cancellationToken)
    {
        var item = await context.MovieInventoryItems
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);

        return item is null ? NotFound() : Ok(ToPublicDto(item));
    }

    private static IQueryable<MovieInventoryItem> ApplyFilters(
        IQueryable<MovieInventoryItem> query,
        string? search,
        string? format,
        bool includeWishlist)
    {
        if (!includeWishlist)
        {
            query = query.Where(item => item.WantStatusID == "H");
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(item =>
                item.Title.Contains(term) ||
                (item.Creator != null && item.Creator.Contains(term)) ||
                (item.Notes != null && item.Notes.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(format))
        {
            var normalizedFormat = format.Trim();
            query = query.Where(item => item.Format == normalizedFormat);
        }

        return query;
    }

    private static PublicFilmReviewItemDto ToPublicDto(MovieInventoryItem item) => new(
        item.Id,
        item.Title,
        item.Creator,
        item.Format,
        item.WantStatusID,
        item.ReleaseYear,
        item.Source,
        item.Notes);
}
