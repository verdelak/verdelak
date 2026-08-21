using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Route("api/phone-list")]
public class PhoneListController(VerdelakDbContext context) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<PagedResult<ContactDto>> List(
        [FromQuery] string? q,
        [FromQuery] string? contactTypeId,
        [FromQuery] bool? xmasCard,
        [FromQuery] string? sort = "name",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = ContactIncludes().AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(contact =>
                contact.LastName.Contains(term) ||
                contact.FirstName.Contains(term) ||
                (contact.City != null && contact.City.Contains(term)) ||
                (contact.Email != null && contact.Email.Contains(term)) ||
                contact.Phones.Any(phone => phone.Number.Contains(term)) ||
                contact.Emails.Any(email => email.Email.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(contactTypeId))
        {
            var typeId = NormalizeCode(contactTypeId, "P");
            query = query.Where(contact => contact.ContactType == typeId);
        }

        if (xmasCard is not null)
        {
            query = query.Where(contact => (contact.XmasCard ?? false) == xmasCard);
        }

        query = sort?.ToLowerInvariant() switch
        {
            "-name" => query.OrderByDescending(contact => contact.LastName).ThenByDescending(contact => contact.FirstName),
            "firstname" => query.OrderBy(contact => contact.FirstName).ThenBy(contact => contact.LastName),
            "-firstname" => query.OrderByDescending(contact => contact.FirstName).ThenByDescending(contact => contact.LastName),
            "city" => query.OrderBy(contact => contact.City).ThenBy(contact => contact.LastName).ThenBy(contact => contact.FirstName),
            "-city" => query.OrderByDescending(contact => contact.City).ThenBy(contact => contact.LastName).ThenBy(contact => contact.FirstName),
            "type" => query.OrderBy(contact => contact.ContactTypeLookup!.ContactType).ThenBy(contact => contact.LastName).ThenBy(contact => contact.FirstName),
            "-type" => query.OrderByDescending(contact => contact.ContactTypeLookup!.ContactType).ThenBy(contact => contact.LastName).ThenBy(contact => contact.FirstName),
            _ => query.OrderBy(contact => contact.LastName).ThenBy(contact => contact.FirstName)
        };

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 200);
        var total = await query.CountAsync(cancellationToken);
        var contacts = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<ContactDto>(contacts.Select(ToDto), total);
    }

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ContactDto>> Get(int id, CancellationToken cancellationToken)
    {
        var contact = await ContactIncludes()
            .AsNoTracking()
            .FirstOrDefaultAsync(contact => contact.Personid == id, cancellationToken);

        return contact is null ? NotFound() : ToDto(contact);
    }

    [AllowAnonymous]
    [HttpGet("contact-types")]
    public async Task<IEnumerable<ContactLookupDto>> GetContactTypes(CancellationToken cancellationToken) =>
        await context.ContactTypes
            .OrderBy(type => type.ContactType)
            .Select(type => new ContactLookupDto(type.ContactTypeID, type.ContactType))
            .ToListAsync(cancellationToken);

    [AllowAnonymous]
    [HttpGet("phone-types")]
    public async Task<IEnumerable<ContactLookupDto>> GetPhoneTypes(CancellationToken cancellationToken) =>
        await context.ContactPhoneTypes
            .OrderBy(type => type.PhoneType)
            .Select(type => new ContactLookupDto(type.PhoneID, type.PhoneType))
            .ToListAsync(cancellationToken);

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPost]
    public async Task<ActionResult<ContactDto>> Create(UpsertContactDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var contact = new Contact();
        ApplyContact(contact, dto);
        context.Contacts.Add(contact);
        await context.SaveChangesAsync(cancellationToken);

        await UpsertPrimaryDetails(contact.Personid, dto, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = contact.Personid }, await LoadDto(contact.Personid, cancellationToken));
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ContactDto>> Update(int id, UpsertContactDto dto, CancellationToken cancellationToken)
    {
        var validation = Validate(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var contact = await context.Contacts.FirstOrDefaultAsync(item => item.Personid == id, cancellationToken);
        if (contact is null)
        {
            return NotFound();
        }

        ApplyContact(contact, dto);
        await UpsertPrimaryDetails(id, dto, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return await LoadDto(id, cancellationToken);
    }

    [Authorize(Roles = "Admin,Contributor")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var contact = await context.Contacts.FirstOrDefaultAsync(item => item.Personid == id, cancellationToken);
        if (contact is null)
        {
            return NotFound();
        }

        var phones = await context.ContactPhones.Where(phone => phone.Personid == id).ToListAsync(cancellationToken);
        var emails = await context.ContactEmails.Where(email => email.Personid == id).ToListAsync(cancellationToken);
        context.ContactPhones.RemoveRange(phones);
        context.ContactEmails.RemoveRange(emails);
        context.Contacts.Remove(contact);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private IQueryable<Contact> ContactIncludes() =>
        context.Contacts
            .Include(contact => contact.ContactTypeLookup)
            .Include(contact => contact.Phones).ThenInclude(phone => phone.PhoneTypeLookup)
            .Include(contact => contact.Emails);

    private async Task UpsertPrimaryDetails(int personId, UpsertContactDto dto, CancellationToken cancellationToken)
    {
        var phone = await context.ContactPhones
            .OrderBy(item => item.ID)
            .FirstOrDefaultAsync(item => item.Personid == personId, cancellationToken);
        var phoneNumber = Clean(dto.PrimaryPhoneNumber);

        if (phoneNumber is null)
        {
            if (phone is not null)
            {
                context.ContactPhones.Remove(phone);
            }
        }
        else if (phone is null)
        {
            context.ContactPhones.Add(new ContactPhone
            {
                Personid = personId,
                Number = phoneNumber,
                PhoneName = Clean(dto.PrimaryPhoneName),
                PhoneType = NormalizeCode(dto.PrimaryPhoneTypeId, "H")
            });
        }
        else
        {
            phone.Number = phoneNumber;
            phone.PhoneName = Clean(dto.PrimaryPhoneName);
            phone.PhoneType = NormalizeCode(dto.PrimaryPhoneTypeId, "H");
        }

        var email = await context.ContactEmails
            .OrderBy(item => item.ID)
            .FirstOrDefaultAsync(item => item.Personid == personId, cancellationToken);
        var emailAddress = Clean(dto.PrimaryEmail);

        if (emailAddress is null)
        {
            if (email is not null)
            {
                context.ContactEmails.Remove(email);
            }
        }
        else if (email is null)
        {
            context.ContactEmails.Add(new ContactEmail
            {
                Personid = personId,
                Email = emailAddress,
                EmailName = Clean(dto.PrimaryEmailName) ?? "Primary"
            });
        }
        else
        {
            email.Email = emailAddress;
            email.EmailName = Clean(dto.PrimaryEmailName) ?? "Primary";
        }
    }

    private static void ApplyContact(Contact contact, UpsertContactDto dto)
    {
        contact.LastName = dto.LastName.Trim();
        contact.FirstName = dto.FirstName.Trim();
        contact.Address1 = Clean(dto.Address1);
        contact.Address2 = Clean(dto.Address2);
        contact.City = Clean(dto.City);
        contact.State = Clean(dto.State)?.ToUpperInvariant();
        contact.Zip = Clean(dto.Zip);
        contact.Email = Clean(dto.Email);
        contact.Birthday = dto.Birthday;
        contact.XmasCard = dto.XmasCard ?? false;
        contact.ContactType = NormalizeCode(dto.ContactTypeId, "P");
    }

    private async Task<ContactDto> LoadDto(int id, CancellationToken cancellationToken)
    {
        var contact = await ContactIncludes()
            .AsNoTracking()
            .FirstAsync(item => item.Personid == id, cancellationToken);

        return ToDto(contact);
    }

    private static ContactDto ToDto(Contact contact) => new(
        contact.Personid,
        contact.LastName.Trim(),
        contact.FirstName.Trim(),
        contact.Address1,
        contact.Address2,
        contact.City,
        contact.State,
        contact.Zip?.Trim(),
        contact.Email,
        contact.Birthday,
        contact.XmasCard ?? false,
        contact.ContactType,
        contact.ContactTypeLookup?.ContactType ?? contact.ContactType,
        contact.Phones
            .OrderBy(phone => phone.ID)
            .Select(phone => new ContactPhoneDto(
                phone.ID,
                phone.Number,
                phone.PhoneName,
                phone.PhoneType,
                phone.PhoneTypeLookup?.PhoneType ?? phone.PhoneType))
            .ToList(),
        contact.Emails
            .OrderBy(email => email.ID)
            .Select(email => new ContactEmailDto(email.ID, email.Email, email.EmailName))
            .ToList());

    private static string? Validate(UpsertContactDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.LastName))
        {
            return "Last name is required.";
        }

        if (string.IsNullOrWhiteSpace(dto.FirstName))
        {
            return "First name is required.";
        }

        return null;
    }

    private static string NormalizeCode(string? value, string fallback)
    {
        var clean = Clean(value);
        return string.IsNullOrWhiteSpace(clean) ? fallback : clean[..1].ToUpperInvariant();
    }

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
