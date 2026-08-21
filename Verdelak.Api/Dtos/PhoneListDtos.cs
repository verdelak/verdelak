namespace Verdelak.Api.Dtos;

public record ContactLookupDto(string Id, string Name);

public record ContactPhoneDto(
    int Id,
    string Number,
    string? PhoneName,
    string PhoneTypeId,
    string PhoneType);

public record ContactEmailDto(
    int Id,
    string Email,
    string EmailName);

public record ContactDto(
    int Personid,
    string LastName,
    string FirstName,
    string? Address1,
    string? Address2,
    string? City,
    string? State,
    string? Zip,
    string? Email,
    DateOnly? Birthday,
    bool XmasCard,
    string ContactTypeId,
    string ContactType,
    IReadOnlyList<ContactPhoneDto> Phones,
    IReadOnlyList<ContactEmailDto> Emails);

public record UpsertContactDto(
    string LastName,
    string FirstName,
    string? Address1,
    string? Address2,
    string? City,
    string? State,
    string? Zip,
    string? Email,
    DateOnly? Birthday,
    bool? XmasCard,
    string? ContactTypeId,
    string? PrimaryPhoneNumber,
    string? PrimaryPhoneName,
    string? PrimaryPhoneTypeId,
    string? PrimaryEmail,
    string? PrimaryEmailName);
