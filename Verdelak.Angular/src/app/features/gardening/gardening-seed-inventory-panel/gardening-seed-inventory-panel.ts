import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GardenPlotPlant, GardenSeed, GardenSeedImportResult, GardenSeedTrayPlant } from '../models/gardening.models';

export type SeedInventoryFilterValue = 'all' | 'indoor' | 'outdoor' | 'reorder' | 'low' | 'empty';
export type SeedInventorySortValue = 'name' | 'qty' | 'start' | 'reorder';

export interface SeedInventoryFormModel {
  id: number | null;
  name: string;
  description: string;
  plantDate: string;
  indoor: boolean;
  secondPlantDate: string;
  notes: string;
  qty: number;
  reorder: boolean;
}

export interface SeedImportPreviewRowModel {
  rowNumber: number;
  name: string;
  description: string;
  plantDate: string;
  indoor: string;
  secondPlantDate: string;
  notes: string;
  qty: string;
  reorder: string;
  action: string;
  warning: string | null;
}

@Component({
  selector: 'app-gardening-seed-inventory-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gardening-seed-inventory-panel.html'
})
export class GardeningSeedInventoryPanel {
  @Input() seeds: GardenSeed[] = [];
  @Input() trayPlants: GardenSeedTrayPlant[] = [];
  @Input() plotPlants: GardenPlotPlant[] = [];
  @Input() selectedYear = new Date().getFullYear();
  @Input() seedFilter = '';
  @Input() seedInventoryFilter: SeedInventoryFilterValue = 'all';
  @Input() seedInventorySort: SeedInventorySortValue = 'name';
  @Input() totalQty = 0;
  @Input() lowCount = 0;
  @Input() emptyCount = 0;
  @Input() reorderCount = 0;
  @Input() savingSeed = false;
  @Input() seedForm!: SeedInventoryFormModel;
  @Input() seedMessage: string | null = null;
  @Input() seedImportCsv = '';
  @Input() seedImportPreviewRows: SeedImportPreviewRowModel[] = [];
  @Input() seedImportPreviewLabel = 'No import rows loaded';
  @Input() seedImportUpdateExisting = true;
  @Input() importingSeeds = false;
  @Input() seedImportResult: GardenSeedImportResult | null = null;
  @Input() seedImportMessage: string | null = null;

  @Output() seedFilterChange = new EventEmitter<string>();
  @Output() seedInventoryFilterChange = new EventEmitter<SeedInventoryFilterValue>();
  @Output() seedInventorySortChange = new EventEmitter<SeedInventorySortValue>();
  @Output() adjustSeedQuantity = new EventEmitter<{ seed: GardenSeed; delta: number }>();
  @Output() setSeedQuantity = new EventEmitter<{ seed: GardenSeed; value: string | number }>();
  @Output() setSeedReorder = new EventEmitter<{ seed: GardenSeed; value: boolean }>();
  @Output() useSeedForTray = new EventEmitter<GardenSeed>();
  @Output() useSeedForBed = new EventEmitter<GardenSeed>();
  @Output() markSeedEmpty = new EventEmitter<GardenSeed>();
  @Output() markSeedStocked = new EventEmitter<GardenSeed>();
  @Output() editSeed = new EventEmitter<GardenSeed>();
  @Output() deleteSeed = new EventEmitter<GardenSeed>();
  @Output() newSeed = new EventEmitter<void>();
  @Output() patchSeedForm = new EventEmitter<Partial<SeedInventoryFormModel>>();
  @Output() saveSeed = new EventEmitter<void>();
  @Output() downloadSeedImportTemplateCsv = new EventEmitter<void>();
  @Output() downloadSeedsCsv = new EventEmitter<void>();
  @Output() downloadSeedImportPreviewCsv = new EventEmitter<void>();
  @Output() downloadSeedImportResultCsv = new EventEmitter<void>();
  @Output() loadSeedImportFile = new EventEmitter<Event>();
  @Output() seedImportCsvChange = new EventEmitter<string>();
  @Output() clearSeedImportCsv = new EventEmitter<void>();
  @Output() seedImportUpdateExistingChange = new EventEmitter<boolean>();
  @Output() importSeedsCsv = new EventEmitter<void>();

  seedUsageCount(seed: GardenSeed): number {
    return this.seedTrayUsageCount(seed) + this.seedBedUsageCount(seed);
  }

  seedUsageLabel(seed: GardenSeed): string {
    return `${this.seedTrayUsageCount(seed)} tray / ${this.seedBedUsageCount(seed)} bed`;
  }

  seedStockTone(seed: GardenSeed): string {
    const qty = seed.inventory?.qty ?? 0;
    if (seed.inventory?.reorder) {
      return 'bg-amber-100 text-amber-800';
    }

    if (qty === 0) {
      return 'bg-rose-100 text-rose-700';
    }

    if (qty <= 2) {
      return 'bg-orange-100 text-orange-800';
    }

    return 'bg-emerald-100 text-emerald-800';
  }

  seedStockLabel(seed: GardenSeed): string {
    const qty = seed.inventory?.qty ?? 0;
    if (seed.inventory?.reorder) {
      return 'Reorder';
    }

    if (qty === 0) {
      return 'Empty';
    }

    return qty <= 2 ? 'Low' : 'OK';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString();
  }

  private seedTrayUsageCount(seed: GardenSeed): number {
    return this.trayPlants.filter(plant => plant.seedId === seed.id && plant.year === this.selectedYear).length;
  }

  private seedBedUsageCount(seed: GardenSeed): number {
    return this.plotPlants
      .filter(plant => plant.seedId === seed.id && plant.year === this.selectedYear)
      .reduce((sum, plant) => sum + (plant.qty ?? 1), 0);
  }
}
