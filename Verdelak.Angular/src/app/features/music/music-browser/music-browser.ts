import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CsvDownloadService } from '../../../shared/services/csv-download.service';
import { MusicService } from '../music.service';
import {
  MusicAlbumDetail,
  MusicAlbumSaveRequest,
  MusicArtistSummary,
  MusicArtistWithAlbums,
  MusicFormat
} from '../models/music.models';

interface MusicForm {
  id: number | null;
  title: string;
  artistID: number | null;
  releaseDate: string;
  infoText: string;
  additionalInfo: string;
  format: MusicFormat;
}

interface MusicAlbumRow {
  id: number;
  artist: string;
  title: string;
  format: MusicFormat;
}

interface MusicSummaryCard {
  label: string;
  value: number;
  detail: string;
}

interface MusicReportRow {
  name: string;
  albumCount: number;
  artistCount: number;
}

@Component({
  selector: 'app-music-browser',
  imports: [CommonModule, FormsModule],
  templateUrl: './music-browser.html',
  styleUrl: './music-browser.scss'
})
export class MusicBrowser implements OnInit {
  private readonly csvDownload = inject(CsvDownloadService);

  readonly format = signal<'All' | MusicFormat>('All');
  readonly artists = signal<MusicArtistWithAlbums[]>([]);
  readonly artistOptions = signal<MusicArtistSummary[]>([]);
  readonly selectedAlbum = signal<MusicAlbumDetail | null>(null);
  readonly search = signal('');
  readonly form = signal<MusicForm>(this.emptyForm('CD'));
  readonly showNewArtist = signal(false);
  readonly newArtistName = signal('');
  readonly savingArtist = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  readonly formats: MusicFormat[] = ['CD', 'Tape', 'Vinyl', 'MP3'];
  readonly totalAlbums = computed(() => this.filteredArtists().reduce((sum, artist) => sum + artist.albums.length, 0));
  readonly filteredAlbumRows = computed<MusicAlbumRow[]>(() => this.filteredArtists().flatMap(artist =>
    artist.albums.map(album => ({
      id: album.id,
      artist: artist.artist,
      title: album.title,
      format: album.format
    }))));
  readonly summaryCards = computed<MusicSummaryCard[]>(() => [
    {
      label: 'Rows shown',
      value: this.filteredAlbumRows().length,
      detail: `${this.allAlbumRows().length.toLocaleString()} loaded for ${this.format()}`
    },
    {
      label: 'Artists',
      value: this.filteredArtists().length,
      detail: `${this.averageAlbumsPerArtist().toLocaleString()} avg albums per artist`
    },
    {
      label: 'Formats',
      value: new Set(this.filteredAlbumRows().map(album => album.format)).size,
      detail: 'Formats in current view'
    },
    {
      label: 'Possible gaps',
      value: this.singleAlbumArtists().length,
      detail: 'Artists with one shown album'
    }
  ]);
  readonly formatReportRows = computed(() => this.buildReportRows(this.filteredAlbumRows(), album => album.format));
  readonly artistReportRows = computed(() => this.buildReportRows(this.filteredAlbumRows(), album => album.artist));
  readonly attentionRows = computed(() => [
    ...this.singleAlbumArtists().slice(0, 8).map(artist => ({
      label: artist.artist,
      detail: 'Only one album in current view',
      search: artist.artist
    })),
    ...this.filteredAlbumRows()
      .filter(album => !album.title.trim())
      .slice(0, 4)
      .map(album => ({
        label: album.artist,
        detail: 'Album title is blank',
        search: album.artist
      }))
  ].slice(0, 10));
  readonly canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'Admin' || role === 'Contributor';
  });
  readonly filteredArtists = computed(() => {
    const term = this.search().trim().toLowerCase();

    if (!term) {
      return this.artists();
    }

    return this.artists()
      .map(artist => ({
        ...artist,
        albums: artist.albums.filter(album =>
          artist.artist.toLowerCase().includes(term) || album.title.toLowerCase().includes(term))
      }))
      .filter(artist => artist.albums.length > 0);
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly service: MusicService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadArtists();

    this.route.paramMap.subscribe(params => {
      const format = this.routeFormat(params.get('format'));
      this.format.set(format);
      this.form.set(this.emptyForm(format === 'All' ? 'CD' : format));
      this.selectedAlbum.set(null);
      this.loadAlbums();
    });
  }

  loadArtists(): void {
    this.service.getArtists().subscribe({
      next: artists => this.artistOptions.set(artists),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load artists.')
    });
  }

  toggleNewArtist(): void {
    this.showNewArtist.set(!this.showNewArtist());
    this.newArtistName.set('');
    this.error.set(null);
  }

  createArtist(): void {
    const band = this.newArtistName().trim();
    if (!band) {
      this.error.set('Artist name is required.');
      return;
    }

    this.savingArtist.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.createArtist({ band }).subscribe({
      next: artist => {
        const summary: MusicArtistSummary = { id: artist.id, artist: artist.band };
        const options = [
          ...this.artistOptions().filter(option => option.id !== summary.id),
          summary
        ].sort((a, b) => a.artist.localeCompare(b.artist));

        this.artistOptions.set(options);
        this.setFormField('artistID', summary.id);
        this.showNewArtist.set(false);
        this.newArtistName.set('');
        this.message.set(`${summary.artist} added.`);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to add artist.'),
      complete: () => this.savingArtist.set(false)
    });
  }

  loadAlbums(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getAlbums(this.format()).subscribe({
      next: artists => this.artists.set(artists),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load music.'),
      complete: () => this.loading.set(false)
    });
  }

  selectAlbum(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.getAlbum(id).subscribe({
      next: album => {
        this.selectedAlbum.set(album);
        this.form.set(this.toForm(album));
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load music item.'),
      complete: () => this.loading.set(false)
    });
  }

  startNew(): void {
    const format = this.format();
    this.selectedAlbum.set(null);
    this.message.set(null);
    this.error.set(null);
    this.form.set(this.emptyForm(format === 'All' ? 'CD' : format));
  }

  setFormField<K extends keyof MusicForm>(field: K, value: MusicForm[K]): void {
    this.form.set({ ...this.form(), [field]: value });
  }

  save(): void {
    const form = this.form();

    if (!form.title.trim() || !form.artistID) {
      this.error.set('Title and artist are required.');
      return;
    }

    const request: MusicAlbumSaveRequest = {
      title: form.title.trim(),
      artistID: form.artistID,
      releaseDate: form.releaseDate ? new Date(form.releaseDate).toISOString() : null,
      infoText: form.infoText.trim() || null,
      additionalInfo: form.additionalInfo.trim() || null,
      format: form.format
    };

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    const onSaved = () => {
        this.message.set(`${request.title} saved.`);
        this.startNew();
        this.loadAlbums();
    };
    const onError = (err: any) => this.error.set(err.error ?? err.message ?? 'Failed to save music item.');
    const onComplete = () => this.loading.set(false);

    if (form.id) {
      this.service.updateAlbum(form.id, request).subscribe({
        next: onSaved,
        error: onError,
        complete: onComplete
      });
      return;
    }

    this.service.createAlbum(request).subscribe({
      next: onSaved,
      error: onError,
      complete: onComplete
    });
  }

  deleteSelected(): void {
    const form = this.form();

    if (!form.id || !window.confirm(`Delete ${form.title}?`)) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.deleteAlbum(form.id).subscribe({
      next: () => {
        this.message.set(`${form.title} deleted.`);
        this.startNew();
        this.loadAlbums();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete music item.'),
      complete: () => this.loading.set(false)
    });
  }

  applyReportSearch(row: MusicReportRow): void {
    this.search.set(row.name);
  }

  applyAttentionSearch(search: string): void {
    this.search.set(search);
  }

  exportCurrentViewCsv(): void {
    this.downloadCsv(`music-current-view-${this.today()}.csv`, [
      ['Artist', 'Title', 'Format'],
      ...this.filteredAlbumRows().map(album => [
        album.artist,
        album.title,
        album.format
      ])
    ]);
  }

  exportReportCsv(): void {
    this.downloadCsv(`music-report-${this.today()}.csv`, [
      ['Report', 'Name', 'Albums', 'Artists'],
      ...this.formatReportRows().map(row => this.reportCsvRow('Format', row)),
      ...this.artistReportRows().map(row => this.reportCsvRow('Artist', row))
    ]);
  }

  private routeFormat(value: string | null): 'All' | MusicFormat {
    switch ((value ?? '').toLowerCase()) {
      case 'cds':
      case 'cd':
        return 'CD';
      case 'tapes':
      case 'tape':
        return 'Tape';
      case 'vinyl':
        return 'Vinyl';
      case 'mp3s':
      case 'mp3':
        return 'MP3';
      default:
        return 'All';
    }
  }

  private emptyForm(format: MusicFormat): MusicForm {
    return {
      id: null,
      title: '',
      artistID: null,
      releaseDate: '',
      infoText: '',
      additionalInfo: '',
      format
    };
  }

  private toForm(album: MusicAlbumDetail): MusicForm {
    return {
      id: album.id,
      title: album.title,
      artistID: album.artist.id,
      releaseDate: album.releaseDate ? album.releaseDate.slice(0, 10) : '',
      infoText: album.infoText ?? '',
      additionalInfo: album.additionalInfo ?? '',
      format: album.format
    };
  }

  private allAlbumRows(): MusicAlbumRow[] {
    return this.artists().flatMap(artist =>
      artist.albums.map(album => ({
        id: album.id,
        artist: artist.artist,
        title: album.title,
        format: album.format
      })));
  }

  private averageAlbumsPerArtist(): number {
    const artistCount = this.filteredArtists().length;
    if (!artistCount) {
      return 0;
    }

    return Math.round((this.filteredAlbumRows().length / artistCount) * 10) / 10;
  }

  private singleAlbumArtists(): MusicArtistWithAlbums[] {
    return this.filteredArtists().filter(artist => artist.albums.length === 1);
  }

  private buildReportRows(items: MusicAlbumRow[], nameSelector: (album: MusicAlbumRow) => string): MusicReportRow[] {
    const rows = new Map<string, MusicReportRow>();

    items.forEach(album => {
      const name = nameSelector(album);
      const row = rows.get(name) ?? {
        name,
        albumCount: 0,
        artistCount: 0
      };

      row.albumCount += 1;
      rows.set(name, row);
    });

    rows.forEach(row => {
      row.artistCount = new Set(items
        .filter(album => nameSelector(album) === row.name)
        .map(album => album.artist)).size;
    });

    return Array.from(rows.values())
      .sort((left, right) => right.albumCount - left.albumCount || left.name.localeCompare(right.name));
  }

  private reportCsvRow(report: string, row: MusicReportRow): Array<string | number> {
    return [report, row.name, row.albumCount, row.artistCount];
  }

  private downloadCsv(filename: string, rows: Array<Array<string | number>>): void {
    this.csvDownload.download(filename, rows);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
