namespace Verdelak.Api.Dtos
{
    public record RPGProductListDto(
        int ID, string ProductName, string? ISBN, string? Edition,
        string? Status, string? System, string? Series, string? Type
    );

    public record RPGProductDetailDto(
        int ID, string ProductName, string? Description, string? ProductNum,
        string? ISBN, string? Edition, string? Status,
        int? SystemID, string? System,
        int? SeriesID, string? Series,
        int? ProductTypeID, string? Type,
        IEnumerable<string> SystemNotes,
        IEnumerable<string> SeriesNotes
    );

    public record RPGProductSaveDto(
        string ProductName,
        string? Description,
        string? ProductNum,
        string? ISBN,
        string? Edition,
        string? Status,
        int? SystemID,
        int? SeriesID,
        int? ProductTypeID
    );

}
