export interface ContactLookup {
  id: string;
  name: string;
}

export interface ContactPhone {
  id: number;
  number: string;
  phoneName: string | null;
  phoneTypeId: string;
  phoneType: string;
}

export interface ContactEmail {
  id: number;
  email: string;
  emailName: string;
}

export interface Contact {
  personid: number;
  lastName: string;
  firstName: string;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  email: string | null;
  birthday: string | null;
  xmasCard: boolean;
  contactTypeId: string;
  contactType: string;
  phones: ContactPhone[];
  emails: ContactEmail[];
}

export interface UpsertContact {
  lastName: string;
  firstName: string;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  email: string | null;
  birthday: string | null;
  xmasCard: boolean;
  contactTypeId: string | null;
  primaryPhoneNumber: string | null;
  primaryPhoneName: string | null;
  primaryPhoneTypeId: string | null;
  primaryEmail: string | null;
  primaryEmailName: string | null;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
}
