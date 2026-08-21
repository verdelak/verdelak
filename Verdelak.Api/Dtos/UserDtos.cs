using System.ComponentModel.DataAnnotations;

namespace Verdelak.Api.Dtos;

public record UserDto(
    int Id,
    string Username,
    string Role
);

public class UserCreateDto
{
    [Required]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = string.Empty;
}

public class UserUpdateDto
{
    [Required]
    public string Username { get; set; } = string.Empty;

    public string? Password { get; set; }

    [Required]
    public string Role { get; set; } = string.Empty;
}
