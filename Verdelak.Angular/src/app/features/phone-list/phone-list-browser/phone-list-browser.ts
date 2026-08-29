import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { CsvDownloadService } from '../../../shared/services/csv-download.service';
import { Contact, ContactLookup, UpsertContact } from '../models/phone-list.models';
import { PhoneListService } from '../phone-list.service';

type SortKey = 'name' | 'firstName' | 'city' | 'type';

interface ContactSummaryCard {
  label: string;
  value: number;
  detail: string;
}

interface ContactReportRow {
  name: string;
  contactCount: number;
  xmasCardCount: number;
  phoneCount: number;
  emailCount: number;
}

interface ContactForm {
  personid: number | null;
  lastName: string;
  firstName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  birthday: string;
  xmasCard: boolean;
  contactTypeId: string;
  primaryPhoneNumber: string;
  primaryPhoneName: string;
  primaryPhoneTypeId: string;
  primaryEmail: string;
  primaryEmailName: string;
}

@Component({
  selector: 'app-phone-list-browser',
  imports: [CommonModule, FormsModule],
  templateUrl: './phone-list-browser.html',
  styleUrl: './phone-list-browser.scss'
})
export class PhoneListBrowser implements OnInit {
  private readonly csvDownload = inject(CsvDownloadService);

  readonly contacts = signal<Contact[]>([]);
  readonly contactTypes = signal<ContactLookup[]>([]);
  readonly phoneTypes = signal<ContactLookup[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(50);
  readonly query = signal('');
  readonly contactTypeId = signal<string | null>(null);
  readonly xmasCard = signal<'all' | 'true'>('all');
  readonly sortKey = signal<SortKey>('name');
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly form = signal<ContactForm>(this.emptyForm());

  readonly canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'Admin' || role === 'Contributor';
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly contactsWithPhone = computed(() => this.contacts().filter(contact => contact.phones.length > 0).length);
  readonly contactsWithEmail = computed(() => this.contacts().filter(contact => contact.emails.length > 0 || !!contact.email).length);
  readonly xmasCardCount = computed(() => this.contacts().filter(contact => contact.xmasCard).length);
  readonly addressReadyCount = computed(() => this.contacts().filter(contact => this.hasMailingAddress(contact)).length);
  readonly contactSummaryCards = computed<ContactSummaryCard[]>(() => [
    {
      label: 'Rows shown',
      value: this.contacts().length,
      detail: `${this.total().toLocaleString()} total matches`
    },
    {
      label: 'Phone ready',
      value: this.contactsWithPhone(),
      detail: `${this.contactsWithEmail().toLocaleString()} with email`
    },
    {
      label: 'Xmas cards',
      value: this.xmasCardCount(),
      detail: `${this.addressReadyCount().toLocaleString()} mailing-address ready`
    },
    {
      label: 'Needs contact',
      value: this.contacts().filter(contact => contact.phones.length === 0 && !this.primaryEmailValue(contact)).length,
      detail: 'Missing phone and email'
    }
  ]);
  readonly typeReportRows = computed(() => this.buildReportRows(this.contacts(), contact => contact.contactType || 'Unspecified'));
  readonly cityReportRows = computed(() => this.buildReportRows(this.contacts(), contact => contact.city || 'No city'));
  readonly attentionRows = computed(() => this.contacts()
    .filter(contact => !this.hasMailingAddress(contact) || contact.phones.length === 0 || !this.primaryEmailValue(contact) || (contact.xmasCard && !this.hasMailingAddress(contact)))
    .slice(0, 10));

  constructor(
    private readonly service: PhoneListService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadLookups();
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(page);

    this.service.list({
      q: this.query(),
      contactTypeId: this.contactTypeId() ?? undefined,
      xmasCard: this.xmasCard() === 'true' ? true : undefined,
      sort: this.sort(),
      page: this.page(),
      pageSize: this.pageSize()
    }).subscribe({
      next: result => {
        this.contacts.set(result.items);
        this.total.set(result.total);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load phone list.'),
      complete: () => this.loading.set(false)
    });
  }

  applyFilters(): void {
    this.load(1);
  }

  clearFilters(): void {
    this.query.set('');
    this.contactTypeId.set(null);
    this.xmasCard.set('all');
    this.load(1);
  }

  showXmasCards(): void {
    this.xmasCard.set('true');
    this.load(1);
  }

  sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }

    this.load(1);
  }

  sortLabel(key: SortKey): string {
    if (this.sortKey() !== key) {
      return '';
    }

    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  primaryPhone(contact: Contact): string {
    return contact.phones.length > 0 ? contact.phones[0].number : '-';
  }

  primaryEmail(contact: Contact): string {
    return this.primaryEmailValue(contact) || '-';
  }

  selectContact(contact: Contact): void {
    const primaryPhone = contact.phones[0];
    const primaryEmail = contact.emails[0];
    this.form.set({
      personid: contact.personid,
      lastName: contact.lastName,
      firstName: contact.firstName,
      address1: contact.address1 ?? '',
      address2: contact.address2 ?? '',
      city: contact.city ?? '',
      state: contact.state ?? '',
      zip: contact.zip ?? '',
      email: contact.email ?? '',
      birthday: contact.birthday ?? '',
      xmasCard: contact.xmasCard,
      contactTypeId: contact.contactTypeId,
      primaryPhoneNumber: primaryPhone?.number ?? '',
      primaryPhoneName: primaryPhone?.phoneName ?? '',
      primaryPhoneTypeId: primaryPhone?.phoneTypeId ?? 'H',
      primaryEmail: primaryEmail?.email ?? contact.email ?? '',
      primaryEmailName: primaryEmail?.emailName ?? 'Primary'
    });
  }

  startNew(): void {
    this.error.set(null);
    this.message.set(null);
    this.form.set(this.emptyForm());
  }

  setFormField<K extends keyof ContactForm>(field: K, value: ContactForm[K]): void {
    this.form.set({ ...this.form(), [field]: value });
  }

  save(): void {
    const form = this.form();
    if (!form.lastName.trim() || !form.firstName.trim()) {
      this.error.set('First and last name are required.');
      return;
    }

    const payload: UpsertContact = {
      lastName: form.lastName.trim(),
      firstName: form.firstName.trim(),
      address1: form.address1.trim() || null,
      address2: form.address2.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zip: form.zip.trim() || null,
      email: form.email.trim() || null,
      birthday: form.birthday || null,
      xmasCard: form.xmasCard,
      contactTypeId: form.contactTypeId || null,
      primaryPhoneNumber: form.primaryPhoneNumber.trim() || null,
      primaryPhoneName: form.primaryPhoneName.trim() || null,
      primaryPhoneTypeId: form.primaryPhoneTypeId || null,
      primaryEmail: form.primaryEmail.trim() || null,
      primaryEmailName: form.primaryEmailName.trim() || null
    };

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    const onSaved = (saved: Contact) => {
      this.message.set(`${saved.firstName} ${saved.lastName} saved.`);
      this.startNew();
      this.load();
    };
    const onError = (err: any) => this.error.set(err.error ?? err.message ?? 'Failed to save contact.');
    const onComplete = () => this.loading.set(false);

    if (form.personid) {
      this.service.update(form.personid, payload).subscribe({ next: onSaved, error: onError, complete: onComplete });
      return;
    }

    this.service.create(payload).subscribe({ next: onSaved, error: onError, complete: onComplete });
  }

  deleteSelected(): void {
    const form = this.form();
    if (!form.personid || !window.confirm(`Delete ${form.firstName} ${form.lastName}?`)) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.delete(form.personid).subscribe({
      next: () => {
        this.message.set(`${form.firstName} ${form.lastName} deleted.`);
        this.startNew();
        this.load();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete contact.'),
      complete: () => this.loading.set(false)
    });
  }

  applyTypeReport(row: ContactReportRow): void {
    const type = this.contactTypes().find(item => item.name === row.name);
    this.contactTypeId.set(type?.id ?? null);
    this.load(1);
  }

  applyCityReport(row: ContactReportRow): void {
    this.query.set(row.name === 'No city' ? '' : row.name);
    this.load(1);
  }

  exportCurrentPageCsv(): void {
    this.downloadCsv(`phone-list-current-page-${this.today()}.csv`, [
      ['Last Name', 'First Name', 'Type', 'Phone', 'Email', 'Address 1', 'Address 2', 'City', 'State', 'Zip', 'Birthday', 'Xmas Card'],
      ...this.contacts().map(contact => [
        contact.lastName,
        contact.firstName,
        contact.contactType,
        this.primaryPhone(contact),
        this.primaryEmail(contact),
        contact.address1 ?? '',
        contact.address2 ?? '',
        contact.city ?? '',
        contact.state ?? '',
        contact.zip ?? '',
        contact.birthday ?? '',
        contact.xmasCard ? 'Yes' : 'No'
      ])
    ]);
  }

  exportReportCsv(): void {
    this.downloadCsv(`phone-list-report-${this.today()}.csv`, [
      ['Report', 'Name', 'Contacts', 'Xmas Cards', 'With Phone', 'With Email'],
      ...this.typeReportRows().map(row => [
        'Type',
        row.name,
        row.contactCount,
        row.xmasCardCount,
        row.phoneCount,
        row.emailCount
      ]),
      ...this.cityReportRows().map(row => [
        'City',
        row.name,
        row.contactCount,
        row.xmasCardCount,
        row.phoneCount,
        row.emailCount
      ])
    ]);
  }

  private loadLookups(): void {
    this.service.getContactTypes().subscribe({
      next: types => this.contactTypes.set(types),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load contact types.')
    });
    this.service.getPhoneTypes().subscribe({
      next: types => this.phoneTypes.set(types),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load phone types.')
    });
  }

  private sort(): string {
    const key = this.sortKey();
    return this.sortDirection() === 'desc' ? `-${key}` : key;
  }

  private emptyForm(): ContactForm {
    return {
      personid: null,
      lastName: '',
      firstName: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      email: '',
      birthday: '',
      xmasCard: false,
      contactTypeId: 'P',
      primaryPhoneNumber: '',
      primaryPhoneName: '',
      primaryPhoneTypeId: 'H',
      primaryEmail: '',
      primaryEmailName: 'Primary'
    };
  }

  private buildReportRows(contacts: Contact[], nameSelector: (contact: Contact) => string): ContactReportRow[] {
    const rows = new Map<string, ContactReportRow>();

    contacts.forEach(contact => {
      const name = nameSelector(contact);
      const row = rows.get(name) ?? {
        name,
        contactCount: 0,
        xmasCardCount: 0,
        phoneCount: 0,
        emailCount: 0
      };

      row.contactCount += 1;
      row.xmasCardCount += contact.xmasCard ? 1 : 0;
      row.phoneCount += contact.phones.length > 0 ? 1 : 0;
      row.emailCount += this.primaryEmailValue(contact) ? 1 : 0;
      rows.set(name, row);
    });

    return Array.from(rows.values())
      .sort((left, right) => right.contactCount - left.contactCount || left.name.localeCompare(right.name));
  }

  private hasMailingAddress(contact: Contact): boolean {
    return !!contact.address1 && !!contact.city && !!contact.state && !!contact.zip;
  }

  private primaryEmailValue(contact: Contact): string {
    return contact.emails.length > 0 ? contact.emails[0].email : contact.email || '';
  }

  private downloadCsv(filename: string, rows: Array<Array<string | number>>): void {
    this.csvDownload.download(filename, rows);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
