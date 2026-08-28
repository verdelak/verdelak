import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MainAppearanceSettings } from '../admin-settings.service';

@Component({
  selector: 'app-appearance-settings-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './appearance-settings-panel.html',
})
export class AppearanceSettingsPanel {
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input({ required: true }) settings!: MainAppearanceSettings;
  @Input() loading = false;
  @Input() warnings: string[] = [];
  @Input() saveLabel = 'Save appearance';
  @Input() loadingLabel = 'Saving.';
  @Input() reviewTitle = 'Appearance Review';
  @Input() fallbackBrandName = 'Verdelak';
  @Input() fallbackTagline = 'Collections, schedules, and household systems';
  @Input() logoPlaceholder = '/assets/logo.png or https://...';
  @Input() heroPlaceholder = '/assets/hero.jpg or https://...';
  @Input() faviconPlaceholder = '/favicon.ico or https://...';
  @Input() previewNote = 'Saved values establish the Admin-managed appearance contract.';

  @Output() settingsChange = new EventEmitter<MainAppearanceSettings>();
  @Output() save = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();

  setField<K extends keyof MainAppearanceSettings>(field: K, value: MainAppearanceSettings[K] | string): void {
    const nullableUrlFields: (keyof MainAppearanceSettings)[] = ['logoUrl', 'heroImageUrl', 'faviconUrl'];
    this.settingsChange.emit({
      ...this.settings,
      [field]: typeof value === 'string' && value.trim() === '' && nullableUrlFields.includes(field) ? null : value
    });
  }
}
