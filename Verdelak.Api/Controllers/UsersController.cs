using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private static readonly string[] Roles = ["Admin", "Contributor", "User", "Viewer"];
    private readonly VerdelakDbContext _context;

    public UsersController(VerdelakDbContext context)
    {
        _context = context;
    }

    [HttpGet("roles")]
    public ActionResult<IEnumerable<string>> GetRoles()
    {
        return Ok(Roles);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        var users = await _context.appUsers
            .OrderBy(user => user.Username)
            .Select(user => new UserDto(user.ID, user.Username, user.Role))
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<UserDto>> GetUser(int id)
    {
        var user = await _context.appUsers.FindAsync(id);

        return user is null
            ? NotFound()
            : Ok(ToDto(user));
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser(UserCreateDto dto)
    {
        var validation = await ValidateUser(dto.Username, dto.Role);

        if (validation is not null)
        {
            return validation;
        }

        if (string.IsNullOrWhiteSpace(dto.Password))
        {
            return BadRequest("Password is required.");
        }

        var user = new AppUser
        {
            Username = dto.Username.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = CanonicalRole(dto.Role)
        };

        _context.appUsers.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUser), new { id = user.ID }, ToDto(user));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<UserDto>> UpdateUser(int id, UserUpdateDto dto)
    {
        var user = await _context.appUsers.FindAsync(id);

        if (user is null)
        {
            return NotFound();
        }

        var validation = await ValidateUser(dto.Username, dto.Role, id);

        if (validation is not null)
        {
            return validation;
        }

        var nextRole = CanonicalRole(dto.Role);
        if (IsAdmin(user.Role) && !IsAdmin(nextRole) && await IsLastAdmin(user.ID))
        {
            return BadRequest("At least one Admin account is required.");
        }

        user.Username = dto.Username.Trim();
        user.Role = nextRole;

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        }

        await _context.SaveChangesAsync();

        return Ok(ToDto(user));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.appUsers.FindAsync(id);

        if (user is null)
        {
            return NotFound();
        }

        if (CurrentUserId() == id)
        {
            return BadRequest("You cannot delete the account you are currently using.");
        }

        if (IsAdmin(user.Role) && await IsLastAdmin(user.ID))
        {
            return BadRequest("At least one Admin account is required.");
        }

        _context.appUsers.Remove(user);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict("This user is referenced by existing records and cannot be deleted.");
        }

        return NoContent();
    }

    private async Task<ActionResult?> ValidateUser(string username, string role, int? currentUserId = null)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest("Username is required.");
        }

        if (!Roles.Contains(role.Trim(), StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest("Role must be Admin, Contributor, User, or Viewer.");
        }

        var trimmedUsername = username.Trim();
        var exists = await _context.appUsers
            .AnyAsync(user => user.Username == trimmedUsername && (!currentUserId.HasValue || user.ID != currentUserId.Value));

        return exists ? Conflict("Username is already in use.") : null;
    }

    private int? CurrentUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.TryParse(idClaim, out var id) ? id : null;
    }

    private static UserDto ToDto(AppUser user)
    {
        return new UserDto(user.ID, user.Username, user.Role);
    }

    private async Task<bool> IsLastAdmin(int userId)
    {
        var adminCount = await _context.appUsers.CountAsync(user => user.Role == "Admin");
        if (adminCount > 1)
        {
            return false;
        }

        return await _context.appUsers.AnyAsync(user => user.ID == userId && user.Role == "Admin");
    }

    private static string CanonicalRole(string role)
    {
        return Roles.First(item => item.Equals(role.Trim(), StringComparison.OrdinalIgnoreCase));
    }

    private static bool IsAdmin(string role)
    {
        return role.Equals("Admin", StringComparison.OrdinalIgnoreCase);
    }
}
