import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { BookFormat, BookListItem, BookLookup, BookSaveRequest, BookWantStatus } from '../models/book.models';
import { BooksService } from '../books.service';

interface BookForm {
  id: number | null;
  title: string;
  authorID: number | null;
  authorFirstName: string;
  authorMiddle: string;
  authorLastName: string;
  seriesID: number | null;
  seriesName: string;
  subSeriesID: number | null;
  subSeriesName: string;
  seriesNumber: number | null;
  formatID: number | null;
  wantStatusID: BookWantStatus;
}

interface BookSummaryCard {
  label: string;
  value: number;
  detail: string;
}

interface BookReportRow {
  name: string;
  bookCount: number;
  ownedCount: number;
  wantedCount: number;
  seriesCount: number;
  missingSeriesCount: number;
  missingNumberCount: number;
}

@Component({
  selector: 'app-book-browser',
  imports: [CommonModule, FormsModule],
  templateUrl: './book-browser.html',
  styleUrl: './book-browser.scss'
})
export class BookBrowser implements OnInit {
  readonly format = signal<'All' | BookFormat>('All');
  readonly books = signal<BookListItem[]>([]);
  readonly formats = signal<BookLookup[]>([]);
  readonly authors = signal<BookLookup[]>([]);
  readonly series = signal<BookLookup[]>([]);
  readonly subSeries = signal<BookLookup[]>([]);
  readonly selectedBook = signal<BookListItem | null>(null);
  readonly search = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly form = signal<BookForm>(this.emptyForm());

  readonly filteredBooks = computed(() => {
    const term = this.search().trim().toLowerCase();

    if (!term) {
      return this.books();
    }

    return this.books().filter(book =>
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term) ||
      (book.series ?? '').toLowerCase().includes(term) ||
      (book.subSeries ?? '').toLowerCase().includes(term));
  });
  readonly summaryCards = computed<BookSummaryCard[]>(() => [
    {
      label: 'Rows shown',
      value: this.filteredBooks().length,
      detail: `${this.books().length.toLocaleString()} loaded for ${this.format()}`
    },
    {
      label: 'Owned',
      value: this.filteredBooks().filter(book => book.wantStatusID === 'H').length,
      detail: `${this.filteredBooks().filter(book => book.wantStatusID === 'W').length.toLocaleString()} wanted in view`
    },
    {
      label: 'Series books',
      value: this.filteredBooks().filter(book => !!book.series).length,
      detail: `${this.filteredBooks().filter(book => !book.series).length.toLocaleString()} standalone or missing series`
    },
    {
      label: 'Missing #',
      value: this.filteredBooks().filter(book => !!book.series && !book.seriesNumber).length,
      detail: 'Series rows without a number'
    }
  ]);
  readonly formatReportRows = computed(() => this.buildReportRows(this.filteredBooks(), book => book.format || 'Unspecified'));
  readonly authorReportRows = computed(() => this.buildReportRows(this.filteredBooks(), book => book.author || 'Unknown author'));
  readonly seriesReportRows = computed(() => this.buildReportRows(this.filteredBooks(), book => book.series || 'Standalone / Unspecified'));
  readonly attentionRows = computed(() => this.filteredBooks()
    .filter(book => book.wantStatusID === 'W' || !book.author || (!!book.series && !book.seriesNumber) || !book.format)
    .slice(0, 10));

  readonly canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'Admin' || role === 'Contributor';
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly service: BooksService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadLookups();

    this.route.paramMap.subscribe(params => {
      this.format.set(this.routeFormat(params.get('format')));
      this.startNew();
      this.loadBooks();
    });
  }

  loadBooks(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getBooks(this.format()).subscribe({
      next: books => this.books.set(books),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load books.'),
      complete: () => this.loading.set(false)
    });
  }

  selectBook(book: BookListItem): void {
    this.selectedBook.set(book);
    const format = this.formats().find(item => item.name === book.format);
    const series = book.series ? this.series().find(item => item.name === book.series) : null;

    this.form.set({
      id: book.id,
      title: book.title,
      authorID: this.authors().find(item => item.name === book.author)?.id ?? null,
      authorFirstName: '',
      authorMiddle: '',
      authorLastName: '',
      seriesID: series?.id ?? null,
      seriesName: series ? '' : book.series ?? '',
      subSeriesID: null,
      subSeriesName: book.subSeries ?? '',
      seriesNumber: book.seriesNumber ?? null,
      formatID: format?.id ?? null,
      wantStatusID: book.wantStatusID
    });

    if (series?.id) {
      this.loadSubSeries(series.id);
    }
  }

  startNew(): void {
    this.selectedBook.set(null);
    this.message.set(null);
    this.error.set(null);
    this.form.set(this.emptyForm());
  }

  setFormField<K extends keyof BookForm>(field: K, value: BookForm[K]): void {
    this.form.set({ ...this.form(), [field]: value });

    if (field === 'seriesID') {
      this.loadSubSeries(value as number | null);
      this.form.set({ ...this.form(), subSeriesID: null });
    }
  }

  save(): void {
    const form = this.form();

    if (!form.title.trim()) {
      this.error.set('Title is required.');
      return;
    }

    const request: BookSaveRequest = {
      title: form.title.trim(),
      authorID: form.authorID,
      authorFirstName: form.authorFirstName.trim() || null,
      authorMiddle: form.authorMiddle.trim() || null,
      authorLastName: form.authorLastName.trim() || null,
      seriesID: form.seriesID,
      seriesName: form.seriesName.trim() || null,
      subSeriesID: form.subSeriesID,
      subSeriesName: form.subSeriesName.trim() || null,
      seriesNumber: form.seriesNumber,
      formatID: form.formatID,
      wantStatusID: form.wantStatusID
    };

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    const onSaved = () => {
      this.message.set(`${request.title} saved.`);
      this.startNew();
      this.loadLookups();
      this.loadBooks();
    };

    const onError = (err: any) => this.error.set(err.error ?? err.message ?? 'Failed to save book.');
    const onComplete = () => this.loading.set(false);

    if (form.id) {
      this.service.updateBook(form.id, request).subscribe({ next: onSaved, error: onError, complete: onComplete });
      return;
    }

    this.service.createBook(request).subscribe({ next: onSaved, error: onError, complete: onComplete });
  }

  deleteSelected(): void {
    const form = this.form();

    if (!form.id || !window.confirm(`Delete ${form.title}?`)) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.deleteBook(form.id).subscribe({
      next: () => {
        this.message.set(`${form.title} deleted.`);
        this.startNew();
        this.loadBooks();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete book.'),
      complete: () => this.loading.set(false)
    });
  }

  displayTitle(book: BookListItem): string {
    const prefix = book.series
      ? `${book.series}${book.subSeries ? `: ${book.subSeries}` : ''}${book.seriesNumber ? ` #${book.seriesNumber}` : ''}`
      : null;

    return prefix ? `${prefix} - ${book.title}` : book.title;
  }

  applyReportSearch(row: BookReportRow): void {
    this.search.set(row.name.startsWith('Standalone') ? '' : row.name);
  }

  exportCurrentViewCsv(): void {
    this.downloadCsv(`books-current-view-${this.today()}.csv`, [
      ['Format', 'Author', 'Series', 'Subseries', 'Series Number', 'Title', 'Status'],
      ...this.filteredBooks().map(book => [
        book.format,
        book.author,
        book.series ?? '',
        book.subSeries ?? '',
        book.seriesNumber ?? '',
        book.title,
        book.wantStatusID === 'W' ? 'Wanted' : 'Owned'
      ])
    ]);
  }

  exportReportCsv(): void {
    this.downloadCsv(`books-report-${this.today()}.csv`, [
      ['Report', 'Name', 'Rows', 'Owned Rows', 'Wanted Rows', 'Series Rows', 'Missing Series', 'Missing Series Number'],
      ...this.formatReportRows().map(row => this.reportCsvRow('Format', row)),
      ...this.authorReportRows().map(row => this.reportCsvRow('Author', row)),
      ...this.seriesReportRows().map(row => this.reportCsvRow('Series', row))
    ]);
  }

  private loadLookups(): void {
    this.service.getFormats().subscribe({ next: formats => this.formats.set(formats) });
    this.service.getAuthors().subscribe({ next: authors => this.authors.set(authors) });
    this.service.getSeries().subscribe({ next: series => this.series.set(series) });
    this.service.getSubSeries().subscribe({ next: subSeries => this.subSeries.set(subSeries) });
  }

  private loadSubSeries(seriesId: number | null): void {
    this.service.getSubSeries(seriesId).subscribe({ next: subSeries => this.subSeries.set(subSeries) });
  }

  private routeFormat(value: string | null): 'All' | BookFormat {
    switch ((value ?? '').toLowerCase()) {
      case 'hardcover':
        return 'Hardcover';
      case 'softcover':
        return 'Softcover';
      case 'audio-book':
      case 'audiobook':
        return 'Audio Book';
      default:
        return 'All';
    }
  }

  private emptyForm(): BookForm {
    return {
      id: null,
      title: '',
      authorID: null,
      authorFirstName: '',
      authorMiddle: '',
      authorLastName: '',
      seriesID: null,
      seriesName: '',
      subSeriesID: null,
      subSeriesName: '',
      seriesNumber: null,
      formatID: this.formats()[0]?.id ?? null,
      wantStatusID: 'H'
    };
  }

  private buildReportRows(items: BookListItem[], nameSelector: (book: BookListItem) => string): BookReportRow[] {
    const rows = new Map<string, BookReportRow>();

    items.forEach(book => {
      const name = nameSelector(book);
      const row = rows.get(name) ?? {
        name,
        bookCount: 0,
        ownedCount: 0,
        wantedCount: 0,
        seriesCount: 0,
        missingSeriesCount: 0,
        missingNumberCount: 0
      };

      row.bookCount += 1;
      row.ownedCount += book.wantStatusID === 'H' ? 1 : 0;
      row.wantedCount += book.wantStatusID === 'W' ? 1 : 0;
      row.seriesCount += book.series ? 1 : 0;
      row.missingSeriesCount += book.series ? 0 : 1;
      row.missingNumberCount += book.series && !book.seriesNumber ? 1 : 0;
      rows.set(name, row);
    });

    return Array.from(rows.values())
      .sort((left, right) => right.bookCount - left.bookCount || left.name.localeCompare(right.name));
  }

  private reportCsvRow(report: string, row: BookReportRow): Array<string | number> {
    return [
      report,
      row.name,
      row.bookCount,
      row.ownedCount,
      row.wantedCount,
      row.seriesCount,
      row.missingSeriesCount,
      row.missingNumberCount
    ];
  }

  private downloadCsv(filename: string, rows: Array<Array<string | number>>): void {
    const csv = rows
      .map(row => row.map(cell => this.csvCell(cell)).join(','))
      .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private csvCell(value: string | number): string {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
