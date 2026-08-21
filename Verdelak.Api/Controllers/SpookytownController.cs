using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;

namespace Verdelak.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SpookytownController : ControllerBase
    {
        private readonly VerdelakDbContext _db;
        public SpookytownController(VerdelakDbContext db) => _db = db;

        [AllowAnonymous]
        [HttpGet("types")]
        public async Task<IEnumerable<SpookytownTypeDto>> GetTypes()
            => await _db.SpookytownType
                        .OrderBy(t => t.Type)
                        .Select(t => new SpookytownTypeDto(t.Id, t.Type))
                        .ToListAsync();

        [Authorize(Roles = "Admin")]
        [HttpGet("types/{id}/usage")]
        public async Task<ActionResult<SpookytownTypeUsageDto>> GetTypeUsage(string id)
        {
            var normalizedId = NormalizeTypeId(id);
            var exists = await _db.SpookytownType.AnyAsync(t => t.Id == normalizedId);

            if (!exists)
            {
                return NotFound();
            }

            var count = await _db.Spookytown.CountAsync(item => item.TypeId == normalizedId);
            return new SpookytownTypeUsageDto(normalizedId, count);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("types")]
        public async Task<ActionResult<SpookytownTypeDto>> CreateType([FromBody] UpsertSpookytownTypeDto dto)
        {
            var normalizedId = NormalizeTypeId(dto.Id);

            if (string.IsNullOrWhiteSpace(normalizedId) || string.IsNullOrWhiteSpace(dto.Type))
            {
                return BadRequest("Type ID and name are required.");
            }

            if (await _db.SpookytownType.AnyAsync(t => t.Id == normalizedId))
            {
                return Conflict("A Spookytown type with that ID already exists.");
            }

            var type = new SpookytownType
            {
                Id = normalizedId,
                Type = dto.Type.Trim()
            };

            _db.SpookytownType.Add(type);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTypes), new SpookytownTypeDto(type.Id, type.Type));
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("types/{id}")]
        public async Task<ActionResult<SpookytownTypeDto>> UpdateType(string id, [FromBody] UpsertSpookytownTypeDto dto)
        {
            var normalizedId = NormalizeTypeId(id);
            var type = await _db.SpookytownType.FindAsync(normalizedId);

            if (type is null)
            {
                return NotFound();
            }

            if (string.IsNullOrWhiteSpace(dto.Type))
            {
                return BadRequest("Type name is required.");
            }

            type.Type = dto.Type.Trim();
            await _db.SaveChangesAsync();

            return new SpookytownTypeDto(type.Id, type.Type);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("types/{id}")]
        public async Task<IActionResult> DeleteType(string id)
        {
            var normalizedId = NormalizeTypeId(id);
            var type = await _db.SpookytownType.FindAsync(normalizedId);

            if (type is null)
            {
                return NotFound();
            }

            _db.SpookytownType.Remove(type);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<PagedResult<SpookytownDto>> List(
            [FromQuery] string? q, [FromQuery] string? typeId,
            [FromQuery] bool? owned, [FromQuery] bool? wanted,
            [FromQuery] bool? retired, [FromQuery] int? year,
            [FromQuery] string? sort = "name",
            [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
        {
            var qry = _db.Spookytown
                .Include(x => x.Type)
                .AsNoTracking();

            if (!string.IsNullOrWhiteSpace(q))
            {
                var s = q.Trim();
                qry = qry.Where(x => x.Name.Contains(s) || (x.SKU != null && x.SKU.Contains(s)));
            }
            if (!string.IsNullOrEmpty(typeId)) qry = qry.Where(x => x.TypeId == typeId);
            if (owned is not null) qry = qry.Where(x => x.Own == owned);
            if (wanted is not null) qry = qry.Where(x => x.Want == wanted);
            if (retired is not null) qry = qry.Where(x => x.Retired == retired);
            if (year is not null) qry = qry.Where(x => x.Year == year);

            qry = sort?.ToLowerInvariant() switch
            {
                "year" => qry.OrderBy(x => x.Year).ThenBy(x => x.Name),
                "type" => qry.OrderBy(x => x.TypeId).ThenBy(x => x.Name),
                "qty" => qry.OrderByDescending(x => x.Qty).ThenBy(x => x.Name),
                "-name" => qry.OrderByDescending(x => x.Name),
                "-year" => qry.OrderByDescending(x => x.Year).ThenBy(x => x.Name),
                _ => qry.OrderBy(x => x.Name)
            };

            var total = await qry.CountAsync();
            var items = await qry.Skip((page - 1) * pageSize).Take(pageSize)
                .Select(x => new SpookytownDto(
                    x.Id, x.Name, x.SKU, x.Year, x.Retired, x.Url, x.Qty,
                    x.TypeId, x.Type != null ? x.Type.Type : null, x.Own, x.Want))
                .ToListAsync();

            return new(items, total);
        }

        [AllowAnonymous]
        [HttpGet("{id:int}")]
        public async Task<ActionResult<SpookytownDto>> Get(int id)
        {
            var x = await _db.Spookytown.Include(s => s.Type).FirstOrDefaultAsync(s => s.Id == id);
            if (x == null) return NotFound();
            return new SpookytownDto(x.Id, x.Name, x.SKU, x.Year, x.Retired,
                                     x.Url, x.Qty, x.TypeId, x.Type?.Type, x.Own, x.Want);
        }

        [Authorize(Roles = "Admin,Contributor")]
        [HttpPost]
        public async Task<ActionResult<SpookytownDto>> Create([FromBody] UpsertSpookytownDto dto)
        {
            var x = new Spookytown
            {
                Name = dto.Name,
                SKU = dto.SKU,
                Year = dto.Year,
                Retired = dto.Retired,
                Url = dto.Url,
                Qty = dto.Qty,
                TypeId = dto.TypeId,
                Own = dto.Own,
                Want = dto.Want
            };
            _db.Spookytown.Add(x);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = x.Id }, await ToDto(x.Id));
        }

        [Authorize(Roles = "Admin,Contributor")]
        [HttpPut("{id:int}")]
        public async Task<ActionResult<SpookytownDto>> Update(int id, [FromBody] UpsertSpookytownDto dto)
        {
            var x = await _db.Spookytown.FindAsync(id);
            if (x == null) return NotFound();
            x.Name = dto.Name; x.SKU = dto.SKU; x.Year = dto.Year; x.Retired = dto.Retired;
            x.Url = dto.Url; x.Qty = dto.Qty; x.TypeId = dto.TypeId; x.Own = dto.Own; x.Want = dto.Want;
            await _db.SaveChangesAsync();
            return await ToDto(id);
        }

        [Authorize(Roles = "Admin,Contributor")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var x = await _db.Spookytown.FindAsync(id);
            if (x == null) return NotFound();
            _db.Spookytown.Remove(x);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Admin,Contributor")]
        [HttpPatch("{id:int}/toggle-own")]
        public async Task<ActionResult> ToggleOwn(int id, [FromQuery] bool value)
        {
            var x = await _db.Spookytown.FindAsync(id);
            if (x == null) return NotFound();
            x.Own = value;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [Authorize(Roles = "Admin,Contributor")]
        [HttpPatch("{id:int}/toggle-want")]
        public async Task<ActionResult> ToggleWant(int id, [FromQuery] bool value)
        {
            var x = await _db.Spookytown.FindAsync(id);
            if (x == null) return NotFound();
            x.Want = value;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        private async Task<SpookytownDto> ToDto(int id) =>
            await _db.Spookytown.Include(s => s.Type)
                .Where(s => s.Id == id)
                .Select(x => new SpookytownDto(
                    x.Id, x.Name, x.SKU, x.Year, x.Retired, x.Url, x.Qty,
                    x.TypeId, x.Type != null ? x.Type.Type : null, x.Own, x.Want))
                .FirstAsync();

        private static string NormalizeTypeId(string? id)
            => string.IsNullOrWhiteSpace(id) ? string.Empty : id.Trim().ToUpperInvariant()[0].ToString();
    }

}
