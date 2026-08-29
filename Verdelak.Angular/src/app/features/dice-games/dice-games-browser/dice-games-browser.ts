import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { CsvDownloadService } from '../../../shared/services/csv-download.service';
import { DiceGamesService } from '../dice-games.service';
import { DiceGameItem, DiceGameLookups, DiceInventoryReport, DragonDiceItem, DragonDiceLookups, UpsertDiceGameItem, UpsertDragonDiceItem } from '../models/dice-games.models';

type DiceTab = 'dnd' | 'dragon';
type StatusFilter = 'all' | 'owned' | 'wanted';

interface ImportPreviewRow {
  rowNumber: number;
  item: UpsertDiceGameItem | UpsertDragonDiceItem;
  warning: string | null;
}

interface CleanupFinding {
  label: string;
  count: number;
  severity: 'Review' | 'Info';
  detail: string;
}

interface DuplicateCluster {
  key: string;
  label: string;
  count: number;
  detail: string;
}

@Component({
  selector: 'app-dice-games-browser',
  imports: [CommonModule, FormsModule],
  templateUrl: './dice-games-browser.html',
  styleUrl: './dice-games-browser.scss'
})
export class DiceGamesBrowser implements OnInit {
  readonly tab = signal<DiceTab>('dnd');
  readonly diceItems = signal<DiceGameItem[]>([]);
  readonly dragonItems = signal<DragonDiceItem[]>([]);
  readonly diceReport = signal<DiceInventoryReport | null>(null);
  readonly dragonReport = signal<DiceInventoryReport | null>(null);
  readonly diceLookups = signal<DiceGameLookups>({ sets: [], rarities: [] });
  readonly dragonLookups = signal<DragonDiceLookups>({ races: [], roles: [] });
  readonly loading = signal(false);
  readonly importing = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal(100);
  readonly total = signal(0);
  readonly query = signal('');
  readonly status = signal<StatusFilter>('all');
  readonly setName = signal('');
  readonly rarity = signal('');
  readonly race = signal('');
  readonly role = signal('');
  readonly importText = signal('');
  readonly diceForm = signal<DiceGameItem>(this.emptyDiceItem());
  readonly dragonForm = signal<DragonDiceItem>(this.emptyDragonItem());

  readonly canManage = computed(() => {
    const role = this.auth.user()?.role;
    return role === 'Admin' || role === 'Contributor';
  });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  readonly currentReport = computed(() => this.tab() === 'dnd' ? this.diceReport() : this.dragonReport());
  readonly importPreview = computed<ImportPreviewRow[]>(() => this.tab() === 'dnd' ? this.parseDiceRows(this.importText()) : this.parseDragonRows(this.importText()));
  readonly cleanImportRows = computed(() => this.importPreview().filter(row => row.warning === null));
  readonly currentItems = computed(() => this.tab() === 'dnd' ? this.diceItems() : this.dragonItems());
  readonly cleanupFindings = computed(() => this.tab() === 'dnd' ? this.buildDiceCleanupFindings(this.diceItems()) : this.buildDragonCleanupFindings(this.dragonItems()));
  readonly duplicateClusters = computed(() => this.tab() === 'dnd' ? this.buildDiceDuplicateClusters(this.diceItems()) : this.buildDragonDuplicateClusters(this.dragonItems()));

  constructor(
    private readonly service: DiceGamesService,
    private readonly auth: AuthService,
    private readonly csvDownload: CsvDownloadService
  ) {}

  ngOnInit(): void {
    this.loadAllLookups();
    this.loadReports();
    this.load();
  }

  setTab(tab: DiceTab): void {
    this.tab.set(tab);
    this.page.set(1);
    this.importText.set('');
    this.load();
  }

  load(page = this.page()): void {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(page);
    if (this.tab() === 'dnd') {
      this.service.listDiceGameItems({ q: this.query(), setName: this.setName(), rarity: this.rarity(), status: this.status(), page, pageSize: this.pageSize() }).subscribe({
        next: result => {
          this.diceItems.set(result.items);
          this.total.set(result.total);
        },
        error: (err: any) => this.error.set(err.error ?? err.message ?? 'Failed to load dice inventory.'),
        complete: () => this.loading.set(false)
      });
      return;
    }

    this.service.listDragonDiceItems({ q: this.query(), race: this.race(), role: this.role(), status: this.status(), page, pageSize: this.pageSize() }).subscribe({
      next: result => {
        this.dragonItems.set(result.items);
        this.total.set(result.total);
      },
      error: (err: any) => this.error.set(err.error ?? err.message ?? 'Failed to load Dragon Dice inventory.'),
      complete: () => this.loading.set(false)
    });
  }

  applyFilters(): void {
    this.load(1);
  }

  clearFilters(): void {
    this.query.set('');
    this.status.set('all');
    this.setName.set('');
    this.rarity.set('');
    this.race.set('');
    this.role.set('');
    this.load(1);
  }

  selectDiceItem(item: DiceGameItem): void {
    this.diceForm.set({ ...item });
  }

  selectDragonItem(item: DragonDiceItem): void {
    this.dragonForm.set({ ...item });
  }

  newDiceItem(): void {
    this.diceForm.set(this.emptyDiceItem());
  }

  newDragonItem(): void {
    this.dragonForm.set(this.emptyDragonItem());
  }

  setDiceForm<K extends keyof DiceGameItem>(field: K, value: DiceGameItem[K]): void {
    this.diceForm.set({ ...this.diceForm(), [field]: value });
  }

  setDragonForm<K extends keyof DragonDiceItem>(field: K, value: DragonDiceItem[K]): void {
    this.dragonForm.set({ ...this.dragonForm(), [field]: value });
  }

  saveDiceItem(): void {
    const form = this.diceForm();
    if (!form.setName.trim() || !form.cardName.trim()) {
      this.error.set('Set and card name are required.');
      return;
    }
    const payload = this.toDicePayload(form);
    const request = form.id ? this.service.updateDiceGameItem(form.id, payload) : this.service.createDiceGameItem(payload);
    request.subscribe({
      next: saved => {
        this.message.set(`${saved.cardName} saved.`);
        this.newDiceItem();
        this.refreshAfterSave();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save dice game item.')
    });
  }

  saveDragonItem(): void {
    const form = this.dragonForm();
    if (!form.dieName.trim()) {
      this.error.set('Die name is required.');
      return;
    }
    const payload = this.toDragonPayload(form);
    const request = form.id ? this.service.updateDragonDiceItem(form.id, payload) : this.service.createDragonDiceItem(payload);
    request.subscribe({
      next: saved => {
        this.message.set(`${saved.dieName} saved.`);
        this.newDragonItem();
        this.refreshAfterSave();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save Dragon Dice item.')
    });
  }

  deleteDiceItem(): void {
    const item = this.diceForm();
    if (!item.id || !confirm(`Delete ${item.cardName}?`)) return;
    this.service.deleteDiceGameItem(item.id).subscribe({ next: () => { this.message.set(`${item.cardName} deleted.`); this.newDiceItem(); this.refreshAfterSave(); }, error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete dice item.') });
  }

  deleteDragonItem(): void {
    const item = this.dragonForm();
    if (!item.id || !confirm(`Delete ${item.dieName}?`)) return;
    this.service.deleteDragonDiceItem(item.id).subscribe({ next: () => { this.message.set(`${item.dieName} deleted.`); this.newDragonItem(); this.refreshAfterSave(); }, error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete Dragon Dice item.') });
  }

  handleImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.importText.set(String(reader.result ?? ''));
    reader.readAsText(file);
    input.value = '';
  }

  importCleanRows(): void {
    const rows = this.cleanImportRows();
    if (!rows.length) {
      this.error.set('No clean rows are ready to import.');
      return;
    }
    if (!confirm(`Import ${rows.length} clean row${rows.length === 1 ? '' : 's'}?`)) return;
    this.importing.set(true);
    const requests = this.tab() === 'dnd'
      ? rows.map(row => this.service.createDiceGameItem(row.item as UpsertDiceGameItem))
      : rows.map(row => this.service.createDragonDiceItem(row.item as UpsertDragonDiceItem));
    forkJoin(requests).subscribe({
      next: created => {
        this.message.set(`${created.length} row${created.length === 1 ? '' : 's'} imported.`);
        this.importText.set('');
        this.refreshAfterSave();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Import failed.'),
      complete: () => this.importing.set(false)
    });
  }

  clearImport(): void {
    this.importText.set('');
  }

  exportCurrentRowsCsv(): void {
    if (this.tab() === 'dnd') {
      this.downloadCsv('dice-games-current-rows.csv', [
        ['Set', 'Card ID', 'Card Number', 'Card Name', 'Subtitle', 'Cost', 'Energy Type', 'Alignment', 'Equippable', 'Rarity', 'Die Limit', 'Owned Cards', 'Owned Dice', 'Owned Foil', 'Want Qty', 'Status', 'Source Sheet', 'Source Row', 'Notes'],
        ...this.diceItems().map(item => [
          item.setName,
          item.cardId ?? '',
          item.cardNumber ?? '',
          item.cardName,
          item.subtitle ?? '',
          item.cost ?? '',
          item.energyType ?? '',
          item.alignment ?? '',
          item.equippable ?? '',
          item.rarity ?? '',
          item.dieLimit ?? '',
          item.ownedCardQty,
          item.ownedDieQty,
          item.ownedFoilQty,
          item.wantQty,
          item.statusID,
          item.sourceSheet ?? '',
          item.sourceRowLabel ?? '',
          item.notes ?? ''
        ])
      ]);
      return;
    }

    this.downloadCsv('dragon-dice-current-rows.csv', [
      ['Die Name', 'Race/Set', 'Role', 'Type', 'Health', 'Points', 'Owned Qty', 'Want Qty', 'Status', 'Note Code', 'Alternative', 'Reprint', 'Source Sheet', 'Source Row', 'Notes'],
      ...this.dragonItems().map(item => [
        item.dieName,
        item.raceOrSpecies ?? '',
        item.role ?? '',
        item.dieType ?? '',
        item.health ?? '',
        item.points ?? '',
        item.ownedQty,
        item.wantQty,
        item.statusID,
        item.noteCode ?? '',
        item.isAlternative ? 'Yes' : 'No',
        item.isReprint ? 'Yes' : 'No',
        item.sourceSheet ?? '',
        item.sourceRowLabel ?? '',
        item.notes ?? ''
      ])
    ]);
  }

  exportCleanupCsv(): void {
    this.downloadCsv(`${this.tab() === 'dnd' ? 'dice-games' : 'dragon-dice'}-cleanup-review.csv`, [
      ['Section', 'Label', 'Count', 'Severity', 'Detail'],
      ...this.cleanupFindings().map(row => ['Cleanup', row.label, row.count, row.severity, row.detail]),
      ...this.duplicateClusters().map(row => ['Potential duplicate', row.label, row.count, 'Review', row.detail])
    ]);
  }

  applyCleanupFinding(finding: CleanupFinding): void {
    this.status.set('all');
    if (finding.label.includes('Wanted')) {
      this.status.set('wanted');
    }
    this.applyFilters();
  }

  private loadAllLookups(): void {
    this.service.diceGameLookups().subscribe({ next: lookups => this.diceLookups.set(lookups) });
    this.service.dragonDiceLookups().subscribe({ next: lookups => this.dragonLookups.set(lookups) });
  }

  private loadReports(): void {
    this.service.diceGameReport().subscribe({ next: report => this.diceReport.set(report) });
    this.service.dragonDiceReport().subscribe({ next: report => this.dragonReport.set(report) });
  }

  private refreshAfterSave(): void {
    this.loadAllLookups();
    this.loadReports();
    this.load(this.page());
  }

  private parseDiceRows(text: string): ImportPreviewRow[] {
    return this.parseRows(text).map((row, index) => {
      const item: UpsertDiceGameItem = {
        gameName: 'D&D Dice Masters',
        setName: row[0] || row[17] || 'D&D Dice Masters',
        cardId: this.blank(row[1]),
        cardNumber: this.blank(row[2]),
        cardName: row[3] || row[2] || '',
        subtitle: this.blank(row[4]),
        cost: this.num(row[5]),
        energyType: this.blank(row[6]),
        alignment: this.blank(row[7]),
        equippable: this.blank(row[8]),
        rarity: this.blank(row[9]),
        dieLimit: this.num(row[10]),
        ownedCardQty: this.num(row[11]) ?? 0,
        ownedDieQty: this.num(row[12]) ?? 0,
        ownedFoilQty: this.num(row[13]) ?? 0,
        wantQty: this.num(row[14]) ?? 0,
        statusID: (this.num(row[14]) ?? 0) > 0 ? 'W' : 'H',
        notes: this.blank(row[15]),
        sourceSheet: this.blank(row[16]),
        sourceRowLabel: `Import row ${index + 1}`
      };
      return { rowNumber: index + 1, item, warning: this.diceImportWarning(item) };
    });
  }

  private parseDragonRows(text: string): ImportPreviewRow[] {
    return this.parseRows(text).map((row, index) => {
      const noteCode = this.blank(row[0]);
      const ownedQty = this.num(row[0]);
      const item: UpsertDragonDiceItem = {
        dieName: row[1] || '',
        raceOrSpecies: this.blank(row[2]),
        role: this.blank(row[3]),
        dieType: this.blank(row[4]),
        health: this.blank(row[5]),
        points: this.blank(row[6]),
        ownedQty: ownedQty ?? 0,
        wantQty: ownedQty === 0 ? 1 : 0,
        statusID: ownedQty === 0 ? 'W' : 'H',
        noteCode: Number.isFinite(ownedQty) ? null : noteCode,
        isAlternative: noteCode?.toUpperCase() === 'A',
        isReprint: noteCode?.toUpperCase() === 'R',
        notes: this.blank(row[7]),
        sourceSheet: 'DragonDice.xlsx',
        sourceRowLabel: `Import row ${index + 1}`
      };
      return { rowNumber: index + 1, item, warning: this.dragonImportWarning(item) };
    });
  }

  private parseRows(text: string): string[][] {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (!normalized) return [];
    const delimiter = normalized.includes('\t') ? '\t' : ',';
    const rows = normalized.split('\n').map(line => line.split(delimiter).map(value => value.trim())).filter(row => row.some(Boolean));
    const first = rows[0]?.map(value => value.toLowerCase()) ?? [];
    return first.some(value => ['id', '#', 'card name', 'die', 'set'].includes(value)) ? rows.slice(1) : rows;
  }

  private toDicePayload(form: DiceGameItem): UpsertDiceGameItem {
    const { id, ...payload } = form;
    return payload;
  }

  private toDragonPayload(form: DragonDiceItem): UpsertDragonDiceItem {
    const { id, ...payload } = form;
    return payload;
  }

  private emptyDiceItem(): DiceGameItem {
    return { id: 0, gameName: 'D&D Dice Masters', setName: '', cardId: null, cardNumber: null, cardName: '', subtitle: null, cost: null, energyType: null, alignment: null, equippable: null, rarity: null, dieLimit: null, ownedCardQty: 0, ownedDieQty: 0, ownedFoilQty: 0, wantQty: 0, statusID: 'H', notes: null, sourceSheet: null, sourceRowLabel: null };
  }

  private emptyDragonItem(): DragonDiceItem {
    return { id: 0, dieName: '', raceOrSpecies: null, role: null, dieType: null, health: null, points: null, ownedQty: 0, wantQty: 0, statusID: 'H', noteCode: null, isAlternative: false, isReprint: false, notes: null, sourceSheet: null, sourceRowLabel: null };
  }

  private diceImportWarning(item: UpsertDiceGameItem): string | null {
    const warnings = [
      item.setName ? null : 'missing set',
      item.cardName ? null : 'missing card name',
      item.ownedCardQty === 0 && item.ownedDieQty === 0 && item.ownedFoilQty === 0 && item.wantQty === 0 ? 'no have/want quantity' : null,
      item.statusID === 'H' && item.wantQty > 0 && item.ownedCardQty + item.ownedDieQty + item.ownedFoilQty === 0 ? 'wanted quantity with owned status' : null
    ].filter(Boolean);

    return warnings.length ? `Review: ${warnings.join(', ')}` : null;
  }

  private dragonImportWarning(item: UpsertDragonDiceItem): string | null {
    const warnings = [
      item.dieName ? null : 'missing die name',
      item.raceOrSpecies ? null : 'missing race/set',
      item.ownedQty === 0 && item.wantQty === 0 ? 'no have/want quantity' : null,
      item.statusID === 'H' && item.wantQty > 0 && item.ownedQty === 0 ? 'wanted quantity with owned status' : null
    ].filter(Boolean);

    return warnings.length ? `Review: ${warnings.join(', ')}` : null;
  }

  private buildDiceCleanupFindings(items: DiceGameItem[]): CleanupFinding[] {
    return this.toCleanupFindings([
      ['Missing set', items.filter(item => !item.setName.trim()).length, 'Rows need a set before long-term browsing is reliable.'],
      ['Missing card name', items.filter(item => !item.cardName.trim()).length, 'Rows need a card name before matching/import reconciliation.'],
      ['Missing rarity', items.filter(item => !item.rarity?.trim()).length, 'Useful for set reports and cleanup filters.'],
      ['Missing source row', items.filter(item => !item.sourceSheet && !item.sourceRowLabel).length, 'Imported rows without trace labels are harder to audit.'],
      ['No have/want quantity', items.filter(item => item.ownedCardQty + item.ownedDieQty + item.ownedFoilQty + item.wantQty === 0).length, 'Rows with no owned or wanted quantity may be workbook leftovers.'],
      ['Wanted with owned copies', items.filter(item => item.wantQty > 0 && item.ownedCardQty + item.ownedDieQty + item.ownedFoilQty > 0).length, 'May be valid, but worth checking after import.']
    ]);
  }

  private buildDragonCleanupFindings(items: DragonDiceItem[]): CleanupFinding[] {
    return this.toCleanupFindings([
      ['Missing die name', items.filter(item => !item.dieName.trim()).length, 'Rows need a die name before matching/import reconciliation.'],
      ['Missing race/set', items.filter(item => !item.raceOrSpecies?.trim()).length, 'Race/set is the main Dragon Dice browsing bucket.'],
      ['Missing role', items.filter(item => !item.role?.trim()).length, 'Role gaps weaken cleanup reports and filters.'],
      ['Missing source row', items.filter(item => !item.sourceSheet && !item.sourceRowLabel).length, 'Imported rows without trace labels are harder to audit.'],
      ['No have/want quantity', items.filter(item => item.ownedQty + item.wantQty === 0).length, 'Rows with no owned or wanted quantity may be workbook leftovers.'],
      ['Wanted with owned copies', items.filter(item => item.wantQty > 0 && item.ownedQty > 0).length, 'May be valid, but worth checking after import.']
    ]);
  }

  private toCleanupFindings(rows: Array<[string, number, string]>): CleanupFinding[] {
    return rows
      .filter(([, count]) => count > 0)
      .map(([label, count, detail]) => ({
        label,
        count,
        detail,
        severity: label.startsWith('Missing') || label.startsWith('No ') ? 'Review' : 'Info'
      }));
  }

  private buildDiceDuplicateClusters(items: DiceGameItem[]): DuplicateCluster[] {
    return this.buildDuplicateClusters(
      items,
      item => [item.setName, item.cardName, item.subtitle ?? '', item.cardNumber ?? ''].map(value => this.normalizeKey(value)).join('|'),
      item => `${item.setName} / ${item.cardName}${item.subtitle ? `: ${item.subtitle}` : ''}`,
      item => item.sourceRowLabel ?? item.cardId ?? `ID ${item.id}`
    );
  }

  private buildDragonDuplicateClusters(items: DragonDiceItem[]): DuplicateCluster[] {
    return this.buildDuplicateClusters(
      items,
      item => [item.dieName, item.raceOrSpecies ?? '', item.role ?? '', item.health ?? '', item.points ?? ''].map(value => this.normalizeKey(value)).join('|'),
      item => `${item.dieName}${item.raceOrSpecies ? ` / ${item.raceOrSpecies}` : ''}${item.role ? ` / ${item.role}` : ''}`,
      item => item.sourceRowLabel ?? item.noteCode ?? `ID ${item.id}`
    );
  }

  private buildDuplicateClusters<T>(items: T[], keySelector: (item: T) => string, labelSelector: (item: T) => string, detailSelector: (item: T) => string): DuplicateCluster[] {
    const groups = new Map<string, T[]>();
    items.forEach(item => {
      const key = keySelector(item);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    });

    return Array.from(groups.entries())
      .filter(([, group]) => group.length > 1)
      .map(([key, group]) => ({
        key,
        label: labelSelector(group[0]),
        count: group.length,
        detail: group.map(detailSelector).join(', ')
      }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
      .slice(0, 12);
  }

  private downloadCsv(fileName: string, rows: Array<Array<string | number>>): void {
    this.csvDownload.download(fileName, rows);
  }

  private normalizeKey(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private blank(value: string | undefined): string | null {
    const trimmed = value?.trim() ?? '';
    return trimmed ? trimmed : null;
  }

  private num(value: string | undefined): number | null {
    const parsed = Number(String(value ?? '').replace(/[$,]/g, '').trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
}

