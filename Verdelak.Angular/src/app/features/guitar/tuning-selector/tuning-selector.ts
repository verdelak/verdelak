import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TuningDefinition } from '../models/guitar.models';

export interface TuningPreset {
  label: string;
  group: 'Guitar' | 'Bass' | 'Extended';
  stringCount: number;
  tuningName: string;
  notes: string[];
}

@Component({
  selector: 'app-tuning-selector',
  imports: [CommonModule, FormsModule],
  templateUrl: './tuning-selector.html'
})
export class TuningSelector {
  readonly presets: TuningPreset[] = [
    { label: 'Standard', group: 'Guitar', stringCount: 6, tuningName: 'Guitar Standard', notes: ['E', 'A', 'D', 'G', 'B', 'E'] },
    { label: 'Eb Standard', group: 'Guitar', stringCount: 6, tuningName: 'Guitar Eb Standard', notes: ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb'] },
    { label: 'Drop D', group: 'Guitar', stringCount: 6, tuningName: 'Guitar Drop D', notes: ['D', 'A', 'D', 'G', 'B', 'E'] },
    { label: 'D Standard', group: 'Guitar', stringCount: 6, tuningName: 'Guitar D Standard', notes: ['D', 'G', 'C', 'F', 'A', 'D'] },
    { label: 'Drop C', group: 'Guitar', stringCount: 6, tuningName: 'Guitar Drop C', notes: ['C', 'G', 'C', 'F', 'A', 'D'] },
    { label: 'DADGAD', group: 'Guitar', stringCount: 6, tuningName: 'Guitar DADGAD', notes: ['D', 'A', 'D', 'G', 'A', 'D'] },
    { label: 'Open D', group: 'Guitar', stringCount: 6, tuningName: 'Guitar Open D', notes: ['D', 'A', 'D', 'F#', 'A', 'D'] },
    { label: 'Open G', group: 'Guitar', stringCount: 6, tuningName: 'Guitar Open G', notes: ['D', 'G', 'D', 'G', 'B', 'D'] },
    { label: 'Bass Std', group: 'Bass', stringCount: 4, tuningName: 'Bass Standard', notes: ['E', 'A', 'D', 'G'] },
    { label: 'Bass Drop D', group: 'Bass', stringCount: 4, tuningName: 'Bass Drop D', notes: ['D', 'A', 'D', 'G'] },
    { label: 'Bass BEAD', group: 'Bass', stringCount: 4, tuningName: 'Bass BEAD', notes: ['B', 'E', 'A', 'D'] },
    { label: 'Tenor Bass', group: 'Bass', stringCount: 4, tuningName: 'Bass Tenor', notes: ['A', 'D', 'G', 'C'] },
    { label: '5 Bass Std', group: 'Bass', stringCount: 5, tuningName: 'Bass 5 Standard', notes: ['B', 'E', 'A', 'D', 'G'] },
    { label: '5 Bass Drop A', group: 'Bass', stringCount: 5, tuningName: 'Bass 5 Drop A', notes: ['A', 'E', 'A', 'D', 'G'] },
    { label: 'Baritone B', group: 'Extended', stringCount: 6, tuningName: 'Baritone B Standard', notes: ['B', 'E', 'A', 'D', 'F#', 'B'] },
    { label: '7 Std', group: 'Extended', stringCount: 7, tuningName: '7-String Standard', notes: ['B', 'E', 'A', 'D', 'G', 'B', 'E'] },
    { label: '7 Drop A', group: 'Extended', stringCount: 7, tuningName: '7-String Drop A', notes: ['A', 'E', 'A', 'D', 'G', 'B', 'E'] },
    { label: '8 Std', group: 'Extended', stringCount: 8, tuningName: '8-String Standard', notes: ['F#', 'B', 'E', 'A', 'D', 'G', 'B', 'E'] },
    { label: '8 Drop E', group: 'Extended', stringCount: 8, tuningName: '8-String Drop E', notes: ['E', 'B', 'E', 'A', 'D', 'G', 'B', 'E'] },
    { label: '9 Std', group: 'Extended', stringCount: 9, tuningName: '9-String Standard', notes: ['C#', 'F#', 'B', 'E', 'A', 'D', 'G', 'B', 'E'] }
  ];
  readonly presetGroups: TuningPreset['group'][] = ['Guitar', 'Bass', 'Extended'];
  @Input() tunings: TuningDefinition[] = [];
  @Input() tuningName = 'Guitar Standard';
  @Input() stringCount = 6;
  @Input() fretCount = 15;
  @Input() customTuning = '';
  @Output() tuningNameChange = new EventEmitter<string>();
  @Output() stringCountChange = new EventEmitter<number>();
  @Output() fretCountChange = new EventEmitter<number>();
  @Output() customTuningChange = new EventEmitter<string>();
  @Output() presetSelected = new EventEmitter<TuningPreset>();

  filteredTunings(): TuningDefinition[] {
    return this.tunings.filter(tuning => tuning.stringCount === this.stringCount);
  }

  presetsByGroup(group: TuningPreset['group']): TuningPreset[] {
    return this.presets.filter(preset => preset.group === group);
  }

  selectedTuning(): TuningDefinition | null {
    return this.tunings.find(tuning => tuning.stringCount === this.stringCount && tuning.name === this.tuningName) ?? null;
  }

  isPresetActive(preset: TuningPreset): boolean {
    return this.stringCount === preset.stringCount
      && this.tuningName === preset.tuningName
      && !this.customTuning.trim();
  }

  noteList(notes: string[]): string {
    return notes.join(' - ');
  }

  customNoteCount(): number {
    return this.customTuning.split(/[,\s]+/).map(note => note.trim()).filter(Boolean).length;
  }
}
