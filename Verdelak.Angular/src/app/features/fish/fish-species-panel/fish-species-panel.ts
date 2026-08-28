import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fish-species-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fish-species-panel.html'
})
export class FishSpeciesPanel {
  @Input({ required: true }) vm!: any;

  get speciesProfileQuery(): any { return this.vm.speciesProfileQuery; }
  get speciesProfileImportText(): any { return this.vm.speciesProfileImportText; }
  get speciesFoodImportText(): any { return this.vm.speciesFoodImportText; }

  visibleSpeciesProfiles(): any[] { return this.vm.visibleSpeciesProfiles(); }
  profilesWithoutFoods(): number { return this.vm.profilesWithoutFoods(); }
  speciesProfileImportPreview(): any[] { return this.vm.speciesProfileImportPreview(); }
  validSpeciesProfileImportRows(): any[] { return this.vm.validSpeciesProfileImportRows(); }
  speciesProfileImportFileName(): string { return this.vm.speciesProfileImportFileName(); }
  speciesProfileImporting(): boolean { return this.vm.speciesProfileImporting(); }
  speciesProfilesLoading(): boolean { return this.vm.speciesProfilesLoading(); }
  speciesFoodsSummary(profile: any): string { return this.vm.speciesFoodsSummary(profile); }
  selectedSpeciesProfile(): any { return this.vm.selectedSpeciesProfile(); }
  speciesFoodImportPreview(): any[] { return this.vm.speciesFoodImportPreview(); }
  validSpeciesFoodImportRows(): any[] { return this.vm.validSpeciesFoodImportRows(); }
  speciesFoodImportFileName(): string { return this.vm.speciesFoodImportFileName(); }
  speciesFoodImporting(): boolean { return this.vm.speciesFoodImporting(); }
  speciesFoodForm(): any { return this.vm.speciesFoodForm(); }
  speciesFoodSaving(): boolean { return this.vm.speciesFoodSaving(); }
  speciesProfileForm(): any { return this.vm.speciesProfileForm(); }
  matchingFoodProducts(food: any): any[] { return this.vm.matchingFoodProducts(food); }
  foodProductSummary(food: any): string { return this.vm.foodProductSummary(food); }

  uploadSpeciesProfileImport(event: Event): void { this.vm.uploadSpeciesProfileImport(event); }
  importSpeciesProfileRows(): void { this.vm.importSpeciesProfileRows(); }
  clearSpeciesProfileImport(): void { this.vm.clearSpeciesProfileImport(); }
  editSpeciesProfile(profile: any): void { this.vm.editSpeciesProfile(profile); }
  deleteSpeciesProfile(profile: any): void { this.vm.deleteSpeciesProfile(profile); }
  uploadSpeciesFoodImport(event: Event): void { this.vm.uploadSpeciesFoodImport(event); }
  importSpeciesFoodRows(): void { this.vm.importSpeciesFoodRows(); }
  clearSpeciesFoodImport(): void { this.vm.clearSpeciesFoodImport(); }
  saveSpeciesFood(): void { this.vm.saveSpeciesFood(); }
  setSpeciesFoodForm(field: string, value: any): void { this.vm.setSpeciesFoodForm(field, value); }
  editSpeciesFood(food: any): void { this.vm.editSpeciesFood(food); }
  deleteSpeciesFood(food: any): void { this.vm.deleteSpeciesFood(food); }
}
