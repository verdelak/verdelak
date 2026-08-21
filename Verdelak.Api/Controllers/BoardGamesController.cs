using Verdelak.Api.Data;
using Verdelak.Api.Models;
using Verdelak.Api.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;

namespace Verdelak.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BoardGamesController : ControllerBase
    {
        private readonly VerdelakDbContext _context;

        public BoardGamesController(VerdelakDbContext context)
        {
            _context = context;
        }

        // GET: api/BoardGames
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Game>>> GetGames()
        {
            return await _context.Games
                .OrderBy(g => g.Title)
                .ToListAsync();
        }

        // GET: api/BoardGames/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Game>> GetGame(int id)
        {
            var game = await _context.Games.FindAsync(id);
            return game == null ? NotFound() : game;
        }

        [HttpGet("{id}/expansions")]
        public async Task<ActionResult<IEnumerable<Game>>> GetExpansions(int id)
        {
            var expansions = await _context.Games
                .Where(g => g.BaseGameID == id)
                .OrderBy(g => g.Title)
                .ToListAsync();

            return expansions;
        }

        // POST: api/BoardGames
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<Game>> CreateGame(Game game)
        {
            _context.Games.Add(game);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetGame), new { id = game.GameID }, game);
        }

        // PUT: api/BoardGames/5
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGame(int id, Game game)
        {
            if (id != game.GameID)
                return BadRequest();

            _context.Entry(game).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/BoardGames/5/plays
        [HttpPost("{id}/plays")]
        public async Task<IActionResult> LogPlay(int id, [FromBody] GamePlayDto dto)
        {
            var game = await _context.Games.FindAsync(id);
            if (game == null)
                return NotFound();

            var play = new GamePlay
            {
                GameID = id,
                PlayDate = dto.PlayDate.Date,
                PlayCount = dto.PlayCount,
                Notes = dto.Notes
            };

            _context.GamePlays.Add(play);
            await _context.SaveChangesAsync();

            return Ok(play);
        }

        // GET: api/BoardGames/5/plays
        [HttpGet("{id}/plays")]
        public async Task<ActionResult<IEnumerable<GamePlay>>> GetPlays(int id)
        {
            return await _context.GamePlays
                .Where(p => p.GameID == id)
                .OrderByDescending(p => p.PlayDate)
                .ToListAsync();
        }
    }

}
