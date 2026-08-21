import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScaleDefinition } from '../models/guitar.models';

@Component({
  selector: 'app-scale-selector',
  imports: [CommonModule, FormsModule],
  templateUrl: './scale-selector.html'
})
export class ScaleSelector {
  @Input() rootNotes: string[] = [];
  @Input() scales: ScaleDefinition[] = [];
  @Input() rootNote = 'E';
  @Input() scaleType = 'Major';
  @Input() displayMode: 'notes' | 'intervals' = 'notes';
  @Output() rootNoteChange = new EventEmitter<string>();
  @Output() scaleTypeChange = new EventEmitter<string>();
  @Output() displayModeChange = new EventEmitter<'notes' | 'intervals'>();

  selectedScale(): ScaleDefinition | null {
    return this.scales.find(scale => scale.name === this.scaleType) ?? null;
  }

  formulaLabel(scale: ScaleDefinition): string {
    return scale.formula.join(' - ');
  }
}
