import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MusicService } from '../music.service';
import { MetalArchivesBandSearchResult, MusicMetalArchivesComparison, MusicMetalArchivesReleaseComparison } from '../models/music.models';

@Component({
  selector: 'app-metal-archives-gap-finder',
  imports: [CommonModule, FormsModule],
  templateUrl: './metal-archives-gap-finder.html'
})
export class MetalArchivesGapFinder {
  readonly bandQuery = signal('');
  readonly manualBandName = signal('');
  readonly manualBandIdOrUrl = signal('');
  readonly manualReleaseRows = signal('');
  readonly selectedBand = signal<MetalArchivesBandSearchResult | null>(null);
  readonly bands = signal<MetalArchivesBandSearchResult[]>([]);
  readonly comparison = signal<MusicMetalArchivesComparison | null>(null);
  readonly selectedReleaseIds = signal<Set<string>>(new Set<string>());
  readonly loading = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly missingReleases = computed(() =>
    this.comparison()?.releases.filter(release => release.status === 'Missing') ?? []);
  readonly ownedReleases = computed(() =>
    this.comparison()?.releases.filter(release => release.status === 'Owned') ?? []);
  readonly wantedReleases = computed(() =>
    this.comparison()?.releases.filter(release => release.status === 'Wanted') ?? []);
  readonly selectedMissingReleases = computed(() => {
    const ids = this.selectedReleaseIds();
    return this.missingReleases().filter(release => ids.has(this.releaseKey(release)));
  });

  constructor(private readonly service: MusicService) {}

  search(): void {
    const query = this.bandQuery().trim();
    if (!query) {
      this.error.set('Enter a band name first.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.bands.set([]);
    this.comparison.set(null);
    this.selectedBand.set(null);
    this.selectedReleaseIds.set(new Set<string>());
    this.service.searchMetalArchivesBands(query).subscribe({
      next: bands => {
        this.bands.set(bands);
        this.message.set(bands.length ? `Found ${bands.length} Metal Archives band match${bands.length === 1 ? '' : 'es'}.` : 'No Metal Archives band matches were found.');
      },
      error: err => this.error.set(`${err.error?.detail ?? err.error ?? err.message ?? 'Metal Archives search failed.'} You can paste the Metal Archives band URL or numeric band id below and compare directly.`),
      complete: () => this.loading.set(false)
    });
  }

  compareManualBand(): void {
    const bandName = this.manualBandName().trim() || this.bandQuery().trim();
    const id = this.extractBandId(this.manualBandIdOrUrl());
    if (!bandName || !id) {
      this.error.set('Enter a band name and paste a Metal Archives band URL or numeric band id.');
      return;
    }

    this.compare({
      metalArchivesId: id,
      name: bandName,
      country: '',
      genre: '',
      url: `https://www.metal-archives.com/bands/_/${id}`
    });
  }

  comparePastedReleases(): void {
    const artistName = this.manualBandName().trim() || this.bandQuery().trim();
    const releases = this.parseReleaseRows(this.manualReleaseRows());
    if (!artistName) {
      this.error.set('Enter the band name before comparing pasted releases.');
      return;
    }

    if (releases.length === 0) {
      this.error.set('Paste at least one release row. Use Title, Type, Year or copy rows from a Metal Archives discography table.');
      return;
    }

    const band: MetalArchivesBandSearchResult = {
      metalArchivesId: 'manual',
      name: artistName,
      country: '',
      genre: '',
      url: ''
    };

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.selectedBand.set(band);
    this.comparison.set(null);
    this.selectedReleaseIds.set(new Set<string>());
    this.service.compareManualMetalArchivesReleases({ artistName, releases }).subscribe({
      next: comparison => {
        this.comparison.set(comparison);
        this.selectedReleaseIds.set(new Set(comparison.releases
          .filter(release => release.status === 'Missing')
          .map(release => this.releaseKey(release))));
        this.message.set(`Compared ${comparison.releases.length} pasted full-length/EP release${comparison.releases.length === 1 ? '' : 's'} for ${artistName}.`);
      },
      error: err => this.error.set(err.error?.detail ?? err.error ?? err.message ?? 'Pasted release comparison failed.'),
      complete: () => this.loading.set(false)
    });
  }

  compare(band: MetalArchivesBandSearchResult): void {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.selectedBand.set(band);
    this.comparison.set(null);
    this.selectedReleaseIds.set(new Set<string>());
    this.service.compareMetalArchivesBand(band.metalArchivesId, band.name).subscribe({
      next: comparison => {
        this.comparison.set(comparison);
        this.selectedReleaseIds.set(new Set(comparison.releases
          .filter(release => release.status === 'Missing')
          .map(release => this.releaseKey(release))));
        this.message.set(`Compared ${comparison.releases.length} full-length/EP release${comparison.releases.length === 1 ? '' : 's'} for ${band.name}.`);
      },
      error: err => this.error.set(err.error?.detail ?? err.error ?? err.message ?? 'Metal Archives comparison failed.'),
      complete: () => this.loading.set(false)
    });
  }

  toggleRelease(release: MusicMetalArchivesReleaseComparison): void {
    const key = this.releaseKey(release);
    this.selectedReleaseIds.update(ids => {
      const next = new Set(ids);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  setAllMissing(selected: boolean): void {
    this.selectedReleaseIds.set(selected
      ? new Set(this.missingReleases().map(release => this.releaseKey(release)))
      : new Set<string>());
  }

  addSelectedToWantList(): void {
    const band = this.selectedBand();
    const releases = this.selectedMissingReleases();
    if (!band || releases.length === 0) {
      this.error.set('Select at least one missing release to add.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    this.service.addMetalArchivesWants({
      artistName: band.name,
      releases: releases.map(release => ({
        title: release.title,
        releaseType: release.releaseType,
        year: release.year,
        url: release.url,
        metalArchivesId: release.metalArchivesId
      }))
    }).subscribe({
      next: result => {
        this.message.set(`Added ${result.createdCount} wanted release${result.createdCount === 1 ? '' : 's'}; skipped ${result.skippedCount}.`);
        this.compare(band);
      },
      error: err => {
        this.error.set(err.error?.detail ?? err.error ?? err.message ?? 'Failed to add wanted releases.');
        this.loading.set(false);
      }
    });
  }

  isSelected(release: MusicMetalArchivesReleaseComparison): boolean {
    return this.selectedReleaseIds().has(this.releaseKey(release));
  }

  statusTone(status: string): string {
    switch (status) {
      case 'Owned':
        return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
      case 'Wanted':
        return 'bg-blue-50 text-blue-800 ring-blue-200';
      case 'Missing':
        return 'bg-amber-50 text-amber-800 ring-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 ring-slate-200';
    }
  }

  private releaseKey(release: MusicMetalArchivesReleaseComparison): string {
    return release.metalArchivesId || `${release.title}|${release.releaseType}|${release.year ?? ''}`;
  }

  private extractBandId(value: string): string {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      return trimmed;
    }

    const match = trimmed.match(/\/bands\/[^/]+\/(\d+)/i);
    return match?.[1] ?? '';
  }

  private parseReleaseRows(value: string): Array<{ metalArchivesId: string; title: string; releaseType: string; year?: number | null; url: string }> {
    return value
      .split(/\r?\n/)
      .map(row => row.trim())
      .filter(Boolean)
      .map(row => {
        const columns = row.includes('\t')
          ? row.split('\t').map(column => column.trim())
          : row.split(',').map(column => column.trim());
        const title = columns[0] ?? '';
        const releaseType = columns[1] ?? 'Full-length';
        const yearText = columns[2] ?? '';
        const year = /^\d{4}$/.test(yearText) ? Number(yearText) : null;
        return {
          metalArchivesId: '',
          title,
          releaseType,
          year,
          url: ''
        };
      })
      .filter(release => release.title.length > 0);
  }
}
