using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Models;
using System;

namespace Verdelak.Api.Controllers
{
    [ApiController]
    [Route("api/homeinventory")]
    public class HomeInventoryController : Controller
    {
        private readonly VerdelakDbContext _context;

        public HomeInventoryController(VerdelakDbContext context)
        {
            _context = context;
        }

        [HttpGet("items")]
        public async Task<ActionResult<IEnumerable<HomeInventoryItemDto>>> GetItems()
        {
            var items = await _context.HomeInventoryItems
                .Include(i => i.Room) // Navigation property
                .Select(i => new HomeInventoryItemDto
                {
                    Id = i.ID,
                    Item = i.Item,
                    Description = i.Description,
                    MakeModel = i.MakeModel,
                    SerialNumber = i.SerialNumber,
                    PurchaseDate = i.PurchaseDate,
                    PurchaseLocation = i.PurchaseLocation,
                    PurchasePrice = i.PurchasePrice,
                    EstimatedValue = i.EstimatedValue,
                    RoomId = i.RoomId,
                }).ToListAsync();

            return Ok(items);
        }

        [HttpGet("items/{id}")]
        public async Task<ActionResult<HomeInventoryItemDto>> GetItem(int id)
        {
            var item = await _context.HomeInventoryItems
                .Include(i => i.Room)
                .Where(i => i.ID == id)
                .Select(i => new HomeInventoryItemDto
                {
                    Id= i.ID,
                    Item = i.Item,
                    Description = i.Description,
                    MakeModel = i.MakeModel,
                    SerialNumber = i.SerialNumber,
                    PurchaseDate = i.PurchaseDate,
                    PurchaseLocation = i.PurchaseLocation,
                    PurchasePrice = i.PurchasePrice,
                    EstimatedValue = i.EstimatedValue,
                    RoomId = i.RoomId,
                }).FirstOrDefaultAsync();

            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost("items")]
        public async Task<IActionResult> CreateItem([FromBody] HomeInventoryItemDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var item = new HomeInventoryItem
            {
                RoomId = dto.RoomId,
                Item = dto.Item,
                Description = dto.Description,
                MakeModel = dto.MakeModel,
                SerialNumber = dto.SerialNumber,
                PurchaseDate = dto.PurchaseDate,
                PurchaseLocation = dto.PurchaseLocation,
                PurchasePrice = dto.PurchasePrice,
                EstimatedValue = dto.EstimatedValue
            };

            _context.HomeInventoryItems.Add(item);
            await _context.SaveChangesAsync();

            return Ok(item.ID);
        }
        [HttpPut("items/{id}")]
        public async Task<IActionResult> UpdateItem(int id, [FromBody] HomeInventoryItemDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != dto.Id)
                return BadRequest("Mismatched item ID.");

            var item = await _context.HomeInventoryItems.FindAsync(id);
            if (item == null)
                return NotFound();

            // Map DTO to entity
            item.Item = dto.Item;
            item.RoomId = dto.RoomId;
            item.Description = dto.Description;
            item.MakeModel = dto.MakeModel;
            item.SerialNumber = dto.SerialNumber;
            item.PurchaseDate = dto.PurchaseDate;
            item.PurchaseLocation = dto.PurchaseLocation;
            item.PurchasePrice = dto.PurchasePrice;
            item.EstimatedValue = dto.EstimatedValue;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.HomeInventoryItems.Any(e => e.ID == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }


        [HttpDelete("items/{id}")]
        public async Task<IActionResult> DeleteItem(int id)
        {
            var item = await _context.HomeInventoryItems.FindAsync(id);
            if (item == null) return NotFound();

            _context.HomeInventoryItems.Remove(item);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("items/{id}/images")]
        public async Task<ActionResult<IEnumerable<HomeInventoryImageDto>>> GetImages(int id)
        {
            var images = await _context.HomeInventoryImages
                .Where(img => img.ItemID == id)
                .Select(img => new HomeInventoryImageDto
                {
                    Id = img.ID,
                    ImageName = img.ImageName,
                    Description = img.Description,
                    ImageBase64 = Convert.ToBase64String(img.Image),
                    ContentType = img.ImageName.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ? "image/png" : "image/jpeg"
                }).ToListAsync();

            return Ok(images);
        }

        [HttpGet("items/{id}/notes")]
        public async Task<ActionResult<IEnumerable<HomeInventoryNoteDto>>> GetNotes(int id)
        {
            var notes = await _context.HomeInventoryNotes
                .Where(n => n.ItemID == id)
                .OrderBy(n => n.NoteNum)
                .ThenBy(n => n.NotePartNum)
                .Select(n => new HomeInventoryNoteDto
                {
                    Id = n.ID,
                    ItemID = n.ItemID,
                    NoteNum = n.NoteNum,
                    NotePartNum = n.NotePartNum,
                    Note = n.Note
                })
                .ToListAsync();

            return Ok(notes);
        }

        [HttpPost("items/{id}/notes")]
        public async Task<IActionResult> AddNote(int id, [FromBody] NoteCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Note))
                return BadRequest("Note cannot be empty.");

            short nextNoteNum = (short)((_context.HomeInventoryNotes
                .Where(n => n.ItemID == id)
                .Select(n => (int?)n.NoteNum)
                .Max() ?? 0) + 1);

            var note = new HomeInventoryNote
            {
                ItemID = id,
                NoteNum = nextNoteNum,
                NotePartNum = 1,
                Note = dto.Note
            };

            _context.HomeInventoryNotes.Add(note);
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpPost("items/{id}/notes/{noteNum}")]
        public async Task<IActionResult> AddNotePart(int id, short noteNum, [FromBody] NoteReplyDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Note))
                return BadRequest("Note cannot be empty.");

            short nextPartNum = (short)((_context.HomeInventoryNotes
                .Where(n => n.ItemID == id && n.NoteNum == noteNum)
                .Select(n => (int?)n.NotePartNum)
                .Max() ?? 0) + 1);

            var note = new HomeInventoryNote
            {
                ItemID = id,
                NoteNum = noteNum,
                NotePartNum = nextPartNum,
                Note = dto.Note
            };

            _context.HomeInventoryNotes.Add(note);
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpDelete("notes/{noteId}")]
        public async Task<IActionResult> DeleteNote(int noteId)
        {
            var note = await _context.HomeInventoryNotes.FindAsync(noteId);
            if (note == null) return NotFound();

            _context.HomeInventoryNotes.Remove(note);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("notes/{noteId}")]
        public async Task<IActionResult> UpdateNote(int noteId, [FromBody] NoteReplyDto dto)
        {
            var note = await _context.HomeInventoryNotes.FindAsync(noteId);
            if (note == null) return NotFound();

            note.Note = dto.Note;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("images/{imageId}")]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            var image = await _context.HomeInventoryImages.FindAsync(imageId);
            if (image == null) return NotFound();

            _context.HomeInventoryImages.Remove(image);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        
        [HttpPost("items/{id}/images")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadImage(int id, [FromForm] ImageUploadDto request)
        {
            if (request.File == null || request.File.Length == 0)
                return BadRequest("No file uploaded.");

            using var ms = new MemoryStream();
            await request.File.CopyToAsync(ms);
            var imageData = ms.ToArray();

            var image = new HomeInventoryImage
            {
                ItemID = id,
                ImageName = request.File.FileName,
                Description = request.Description,
                Image = imageData,
                ContentType = request.File.ContentType 
            };

            _context.HomeInventoryImages.Add(image);
            await _context.SaveChangesAsync();

            return Ok();
        }



    }
}
