import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RpgService } from '../rpg-service';
import { IdName, ProductListItem, RpgStatusFilter } from '../models/rpg.models';
import { AuthService } from '../../../core/auth/auth.service';

interface RpgSummaryCard {
  label: string;
  value: number;
  detail: string;
}

interface RpgReportRow {
  name: string;
  productCount: number;
  ownedCount: number;
  wantedCount: number;
  unknownCount: number;
  missingIsbnCount: number;
  missingSeriesCount: number;
}

@Component({
  selector: 'app-rpg-browser',
  imports: [
    CommonModule, FormsModule, RouterLink
  ],
  templateUrl: './rpg-browser.html',
  styleUrl: './rpg-browser.scss'
})
export class RpgBrowser  implements OnInit {
  svc = inject(RpgService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  systems: IdName[] = [];
  series: IdName[] = [];
  types: IdName[] = [];

  systemId: number | null = null;
  seriesId: number | null = null;
  typeId: number | null = null;
  status: RpgStatusFilter = 'H';
  q = '';

  page = 1;
  pageSize = 25;
  title = 'RPGs';

  // If you later add SystemID to RPGSeries, you can filter series by selected system.
  filteredSeries = computed(() => this.series);
  summaryCards = computed<RpgSummaryCard[]>(() => [
    {
      label: 'Rows shown',
      value: this.svc.products().length,
      detail: `${this.svc.total().toLocaleString()} total matches`
    },
    {
      label: 'Owned',
      value: this.ownedShown(),
      detail: `${this.wantedShown().toLocaleString()} wanted in view`
    },
    {
      label: 'Missing ISBN',
      value: this.missingIsbnShown(),
      detail: 'Current page rows'
    },
    {
      label: 'Missing series',
      value: this.missingSeriesShown(),
      detail: 'Current page rows'
    }
  ]);
  systemReportRows = computed(() => this.buildReportRows(this.svc.products(), item => item.system || 'Unspecified'));
  typeReportRows = computed(() => this.buildReportRows(this.svc.products(), item => item.type || 'Unspecified'));
  attentionRows = computed(() => this.svc.products()
    .filter(item => item.status === 'W' || !item.isbn || !item.series || !item.type || !item.system)
    .slice(0, 10));

  private ownedShown = computed(() => this.svc.products().filter(item => item.status === 'H').length);
  private wantedShown = computed(() => this.svc.products().filter(item => item.status === 'W').length);
  private missingIsbnShown = computed(() => this.svc.products().filter(item => !item.isbn).length);
  private missingSeriesShown = computed(() => this.svc.products().filter(item => !item.series).length);

  async ngOnInit() {
    this.status = this.route.snapshot.data['status'] ?? 'H';
    this.title = this.route.snapshot.data['title'] ?? 'RPGs';
    this.svc.getSystems().subscribe(x => this.systems = x);
    this.svc.getSeries().subscribe(x => this.series = x);
    this.svc.getTypes().subscribe(x => this.types = x);
    await this.refetch(false);
  }

  async refetch(resetPage: boolean) {
    if (resetPage) this.page = 1;
    await this.svc.fetchProducts({
      systemId: this.systemId ?? undefined,
      seriesId: this.seriesId ?? undefined,
      typeId: this.typeId ?? undefined,
      status: this.status,
      q: this.q || undefined,
      page: this.page,
      pageSize: this.pageSize
    });
  }

  async next(){ this.page++; await this.refetch(false); }
  async prev(){ if (this.page > 1) { this.page--; await this.refetch(false); } }

  async clearFilters() {
    this.systemId = this.seriesId = this.typeId = null;
    this.q = '';
    this.status = this.route.snapshot.data['status'] ?? 'H';
    this.page = 1;
    await this.refetch(false);
  }

  async applySystemReport(row: RpgReportRow) {
    const system = this.systems.find(item => item.name === row.name);
    this.systemId = system?.id ?? null;
    this.page = 1;
    await this.refetch(false);
  }

  async applyTypeReport(row: RpgReportRow) {
    const type = this.types.find(item => item.name === row.name);
    this.typeId = type?.id ?? null;
    this.page = 1;
    await this.refetch(false);
  }

  exportCurrentPageCsv() {
    this.downloadCsv(`rpg-current-page-${this.today()}.csv`, [
      ['System', 'Series', 'Type', 'Product Name', 'ISBN', 'Edition', 'Status'],
      ...this.svc.products().map(item => [
        item.system ?? '',
        item.series ?? '',
        item.type ?? '',
        item.productName,
        item.isbn ?? '',
        item.edition ?? '',
        this.statusLabel(item.status)
      ])
    ]);
  }

  exportReportCsv() {
    this.downloadCsv(`rpg-report-${this.today()}.csv`, [
      ['Report', 'Name', 'Rows', 'Owned Rows', 'Wanted Rows', 'Unknown Rows', 'Missing ISBN', 'Missing Series'],
      ...this.systemReportRows().map(row => [
        'System',
        row.name,
        row.productCount,
        row.ownedCount,
        row.wantedCount,
        row.unknownCount,
        row.missingIsbnCount,
        row.missingSeriesCount
      ]),
      ...this.typeReportRows().map(row => [
        'Type',
        row.name,
        row.productCount,
        row.ownedCount,
        row.wantedCount,
        row.unknownCount,
        row.missingIsbnCount,
        row.missingSeriesCount
      ])
    ]);
  }

  statusLabel(status?: string) {
    return status === 'H' ? 'Owned' : status === 'W' ? 'Wanted' : 'Unknown';
  }

  private buildReportRows(items: ProductListItem[], nameSelector: (item: ProductListItem) => string): RpgReportRow[] {
    const rows = new Map<string, RpgReportRow>();

    items.forEach(item => {
      const name = nameSelector(item);
      const row = rows.get(name) ?? {
        name,
        productCount: 0,
        ownedCount: 0,
        wantedCount: 0,
        unknownCount: 0,
        missingIsbnCount: 0,
        missingSeriesCount: 0
      };

      row.productCount += 1;
      row.ownedCount += item.status === 'H' ? 1 : 0;
      row.wantedCount += item.status === 'W' ? 1 : 0;
      row.unknownCount += item.status !== 'H' && item.status !== 'W' ? 1 : 0;
      row.missingIsbnCount += item.isbn ? 0 : 1;
      row.missingSeriesCount += item.series ? 0 : 1;
      rows.set(name, row);
    });

    return Array.from(rows.values())
      .sort((left, right) => right.productCount - left.productCount || left.name.localeCompare(right.name));
  }

  private downloadCsv(filename: string, rows: Array<Array<string | number>>) {
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

  private csvCell(value: string | number) {
    const text = String(value ?? '');
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }
}
