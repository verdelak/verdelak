namespace Verdelak.Api.Dtos
{
    public record SpookytownDto(
        int Id, string Name, string? SKU, int? Year, bool? Retired,
        string? Url, short? Qty, string? TypeId, string? TypeName, bool Own, bool Want);

    public record UpsertSpookytownDto(
        string Name, string? SKU, int? Year, bool? Retired,
        string? Url, short? Qty, string? TypeId, bool Own, bool Want);

    public record SpookytownTypeDto(string Id, string Type);

    public record UpsertSpookytownTypeDto(string Id, string Type);

    public record SpookytownTypeUsageDto(string Id, int ItemCount);

    public record PagedResult<T>(IEnumerable<T> Items, int Total);
}
