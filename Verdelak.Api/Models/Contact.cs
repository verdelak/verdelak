using System.ComponentModel.DataAnnotations.Schema;

namespace Verdelak.Api.Models;

[Table("Contacts")]
public class Contact
{
    public int Personid { get; set; }
    public string LastName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? Address1 { get; set; }
    public string? Address2 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Zip { get; set; }
    public string? Email { get; set; }
    public DateOnly? Birthday { get; set; }
    public bool? XmasCard { get; set; }
    public string ContactType { get; set; } = "P";

    public ContactTypeLookup? ContactTypeLookup { get; set; }
    public List<ContactPhone> Phones { get; set; } = new();
    public List<ContactEmail> Emails { get; set; } = new();
}

[Table("Contacts_Phone")]
public class ContactPhone
{
    public int ID { get; set; }
    public int Personid { get; set; }
    public string Number { get; set; } = string.Empty;
    public string? PhoneName { get; set; }
    public string PhoneType { get; set; } = "H";

    public Contact? Contact { get; set; }
    public ContactPhoneType? PhoneTypeLookup { get; set; }
}

[Table("Contacts_Email")]
public class ContactEmail
{
    public int ID { get; set; }
    public int Personid { get; set; }
    public string Email { get; set; } = string.Empty;
    public string EmailName { get; set; } = string.Empty;

    public Contact? Contact { get; set; }
}

[Table("Contacts_PhoneType")]
public class ContactPhoneType
{
    public string PhoneID { get; set; } = string.Empty;
    public string PhoneType { get; set; } = string.Empty;

    public List<ContactPhone> Phones { get; set; } = new();
}

[Table("ContactType")]
public class ContactTypeLookup
{
    public string ContactTypeID { get; set; } = string.Empty;
    public string ContactType { get; set; } = string.Empty;

    public List<Contact> Contacts { get; set; } = new();
}
