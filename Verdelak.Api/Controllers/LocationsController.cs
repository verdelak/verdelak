using Verdelak.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Verdelak.Api.Models;
using System;
using Verdelak.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Verdelak.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LocationsController : ControllerBase
    {
        private readonly VerdelakDbContext _context;

        public LocationsController(VerdelakDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LocationDto>>> GetLocations()
        {
            var locations = await _context.Locations
                .Select(loc => new LocationDto
                {
                    Id = loc.ID,
                    Location = loc.LocationName
                })
                .ToListAsync();

            return Ok(locations);
        }
    }

}



