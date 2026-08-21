using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers
{
    [ApiController]
    [Route("api/rpg")]
    public class RPGController : ControllerBase
    {
        private const string HaveStatus = "H";
        private const string WantStatus = "W";
        private readonly VerdelakDbContext _db;
        public RPGController(VerdelakDbContext db) => _db = db;

        [HttpGet("products")]
        public async Task<ActionResult<object>> GetProducts(
            [FromQuery] int? systemId, [FromQuery] int? seriesId, [FromQuery] int? typeId,
            [FromQuery] string? q, [FromQuery] string? status = HaveStatus,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = ProductIncludes().AsNoTracking();

            if (systemId is not null) query = query.Where(p => p.SystemID == systemId);
            if (seriesId is not null) query = query.Where(p => p.SeriesID == seriesId);
            if (typeId is not null) query = query.Where(p => p.ProductTypeID == typeId);
            query = ApplyStatusFilter(query, status);
            if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim();
                query = query.Where(p =>
                    p.ProductName.Contains(term) || (p.ISBN ?? "").Contains(term));
            }

            var total = await query.CountAsync();
            var items = await query
                .OrderBy(p => p.ProductName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new RPGProductListDto(
                    p.ID, p.ProductName, p.ISBN, p.Edition,
                    p.Status, p.System!.Name, p.Series!.SeriesName, p.ProductType!.Type))
                .ToListAsync();

            return Ok(new { total, page, pageSize, items });
        }

        [HttpGet("want-list")]
        public async Task<ActionResult<object>> GetWantList(
            [FromQuery] int? systemId, [FromQuery] int? seriesId, [FromQuery] int? typeId,
            [FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int pageSize = 25) =>
            await GetProducts(systemId, seriesId, typeId, q, WantStatus, page, pageSize);

        [HttpGet("products/{id}")]
        public async Task<ActionResult<RPGProductDetailDto>> GetProduct(int id)
        {
            var p = await _db.RPGProducts
                .Include(x => x.System)!.ThenInclude(s => s.Notes)
                .Include(x => x.Series)!.ThenInclude(s => s.Notes)
                .Include(x => x.ProductType)
                .FirstOrDefaultAsync(x => x.ID == id);

            if (p is null) return NotFound();

            return new RPGProductDetailDto(
                p.ID, p.ProductName, p.Description, p.ProductNum,
                p.ISBN, p.Edition, p.Status,
                p.SystemID, p.System?.Name,
                p.SeriesID, p.Series?.SeriesName,
                p.ProductTypeID, p.ProductType?.Type,
                p.System?.Notes.Select(n => n.Notes ?? "") ?? Enumerable.Empty<string>(),
                p.Series?.Notes.Select(n => n.Notes ?? "") ?? Enumerable.Empty<string>()
            );
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("products")]
        public async Task<ActionResult<RPGProductDetailDto>> CreateProduct(RPGProductSaveDto dto)
        {
            var validation = await ValidateSave(dto);
            if (validation is not null)
            {
                return validation;
            }

            var product = new RPGProduct();
            ApplySave(product, dto);

            _db.RPGProducts.Add(product);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProduct), new { id = product.ID }, await LoadDetail(product.ID));
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("products/{id:int}")]
        public async Task<ActionResult<RPGProductDetailDto>> UpdateProduct(int id, RPGProductSaveDto dto)
        {
            var product = await _db.RPGProducts.FindAsync(id);
            if (product is null)
            {
                return NotFound();
            }

            var validation = await ValidateSave(dto);
            if (validation is not null)
            {
                return validation;
            }

            ApplySave(product, dto);
            await _db.SaveChangesAsync();

            return Ok(await LoadDetail(product.ID));
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("products/{id:int}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _db.RPGProducts.FindAsync(id);
            if (product is null)
            {
                return NotFound();
            }

            _db.RPGProducts.Remove(product);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        // Lookups
        [HttpGet("systems")]
        public Task<List<IdNameDto>> GetSystems() =>
            _db.RPGSystems.OrderBy(x => x.Name).Select(x => new IdNameDto(x.ID, x.Name)).ToListAsync();

        [HttpGet("series")]
        public Task<List<IdNameDto>> GetSeries() =>
            _db.RPGSeries.OrderBy(x => x.SeriesName).Select(x => new IdNameDto(x.ID, x.SeriesName)).ToListAsync();

        [HttpGet("types")]
        public Task<List<IdNameDto>> GetTypes() =>
            _db.RPGProductTypes.OrderBy(x => x.Type).Select(x => new IdNameDto(x.ID, x.Type)).ToListAsync();

        private IQueryable<RPGProduct> ProductIncludes() =>
            _db.RPGProducts
                .Include(p => p.System)
                .Include(p => p.Series)
                .Include(p => p.ProductType);

        private static IQueryable<RPGProduct> ApplyStatusFilter(IQueryable<RPGProduct> query, string? status)
        {
            var normalized = status?.Trim().ToUpperInvariant();

            return normalized switch
            {
                null or "" or HaveStatus or "OWNED" or "HAVE" or "HAVES" => query.Where(p => p.Status == HaveStatus),
                WantStatus or "WANTED" or "WANT" or "WANTS" => query.Where(p => p.Status == WantStatus),
                "UNKNOWN" => query.Where(p => p.Status == null || p.Status == ""),
                "ALL" => query,
                _ => query.Where(p => p.Status == normalized)
            };
        }

        private async Task<ActionResult?> ValidateSave(RPGProductSaveDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.ProductName))
            {
                return BadRequest("Product name is required.");
            }

            var status = NormalizeStatus(dto.Status);
            if (status is not null && status is not HaveStatus and not WantStatus)
            {
                return BadRequest("Status must be H, W, or blank.");
            }

            if (dto.SystemID.HasValue && !await _db.RPGSystems.AnyAsync(x => x.ID == dto.SystemID.Value))
            {
                return BadRequest("Invalid system.");
            }

            if (dto.SeriesID.HasValue && !await _db.RPGSeries.AnyAsync(x => x.ID == dto.SeriesID.Value))
            {
                return BadRequest("Invalid series.");
            }

            if (dto.ProductTypeID.HasValue && !await _db.RPGProductTypes.AnyAsync(x => x.ID == dto.ProductTypeID.Value))
            {
                return BadRequest("Invalid product type.");
            }

            return null;
        }

        private static void ApplySave(RPGProduct product, RPGProductSaveDto dto)
        {
            product.ProductName = dto.ProductName.Trim();
            product.Description = Clean(dto.Description);
            product.ProductNum = Clean(dto.ProductNum);
            product.ISBN = Clean(dto.ISBN);
            product.Edition = Clean(dto.Edition);
            product.Status = NormalizeStatus(dto.Status);
            product.SystemID = dto.SystemID;
            product.SeriesID = dto.SeriesID;
            product.ProductTypeID = dto.ProductTypeID;
        }

        private async Task<RPGProductDetailDto> LoadDetail(int id)
        {
            var product = await _db.RPGProducts
                .Include(x => x.System)!.ThenInclude(s => s.Notes)
                .Include(x => x.Series)!.ThenInclude(s => s.Notes)
                .Include(x => x.ProductType)
                .FirstAsync(x => x.ID == id);

            return new RPGProductDetailDto(
                product.ID, product.ProductName, product.Description, product.ProductNum,
                product.ISBN, product.Edition, product.Status,
                product.SystemID, product.System?.Name,
                product.SeriesID, product.Series?.SeriesName,
                product.ProductTypeID, product.ProductType?.Type,
                product.System?.Notes.Select(n => n.Notes ?? "") ?? Enumerable.Empty<string>(),
                product.Series?.Notes.Select(n => n.Notes ?? "") ?? Enumerable.Empty<string>());
        }

        private static string? NormalizeStatus(string? status)
        {
            var value = Clean(status)?.ToUpperInvariant();
            return value switch
            {
                "OWNED" or "HAVE" or "HAVES" => HaveStatus,
                "WANTED" or "WANT" or "WANTS" => WantStatus,
                _ => value
            };
        }

        private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public record IdNameDto(int ID, string Name);

}
