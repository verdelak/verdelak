namespace Verdelak.Api.Dtos;

public record ChessexLookupDto(int Id, string Name);

public record ChessexSetDto(
    int Id,
    string Name,
    string? ProductCode,
    int CategoryId,
    string Category,
    int SetTypeId,
    string SetType,
    short? DiceCount,
    string? Color,
    string? Notes,
    string WantStatusID,
    short Qty);

public record UpsertChessexSetDto(
    string Name,
    string? ProductCode,
    int? CategoryId,
    string? CategoryName,
    int? SetTypeId,
    string? SetTypeName,
    short? DiceCount,
    string? Color,
    string? Notes,
    string? WantStatusID,
    short? Qty);
