using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Verdelak.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly VerdelakDbContext _context;

        public ReviewsController(VerdelakDbContext context)
        {
            _context = context;
        }

        [HttpGet("album/{albumId}")]
        public async Task<ActionResult<IEnumerable<Review>>> GetReviewsForAlbum(int albumId)
        {
            var reviews = await _context.Reviews
                .Where(r => r.AlbumID == albumId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return reviews;
        }

        [Authorize]
        [HttpPost]
        public async Task<ActionResult<ReviewDto>> AddReview([FromBody] ReviewCreateDto dto)
        {
            try
            {
                var album = await _context.Albums.FindAsync(dto.AlbumID);
            var user = await _context.appUsers.FindAsync(dto.ReviewerID);

            if (album == null || user == null)
                return BadRequest("Invalid album or reviewer.");

            var review = new Review
            {
                AlbumID = dto.AlbumID,
                ReviewerID = dto.ReviewerID,
                Rating = dto.Rating,
                Text = dto.Text,
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            // You can map to a ReviewDto here if needed
            return CreatedAtAction(nameof(AddReview), new { id = review.ID }, new ReviewDto
            {
                ID = review.ID,
                AlbumID = review.AlbumID,
                ReviewerID = user.ID,
                Rating = review.Rating,
                Text = review.Text ?? "",
                CreatedAt = review.CreatedAt
            });
            }
            catch (Exception ex)
            {
                Console.WriteLine("ERROR CREATING REVIEW:");
                Console.WriteLine(ex.Message);
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, "Internal server error: " + ex.Message);
            }
        }

    }
}



