import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { GuitarService } from '../guitar.service';
import { ChordViewer } from '../chord-viewer/chord-viewer';
import { FretboardDiagram } from '../fretboard-diagram/fretboard-diagram';
import { PositionViewer } from '../position-viewer/position-viewer';
import { PracticeRoutineViewer } from '../practice-routine-viewer/practice-routine-viewer';
import { ScaleSelector } from '../scale-selector/scale-selector';
import { TuningPreset, TuningSelector } from '../tuning-selector/tuning-selector';
import { GuitarExplorerOptions, GuitarExplorerRequest, GuitarExplorerResult } from '../models/guitar.models';

interface CagedShape {
  shape: string;
  anchor: string;
  positionFocus: string;
  practicePrompt: string;
}

@Component({
  selector: 'app-guitar-explorer',
  imports: [
    CommonModule,
    ScaleSelector,
    TuningSelector,
    FretboardDiagram,
    PositionViewer,
    ChordViewer,
    PracticeRoutineViewer
  ],
  templateUrl: './guitar-explorer.html',
  styleUrl: './guitar-explorer.scss'
})
export class GuitarExplorer implements OnInit {
  readonly options = signal<GuitarExplorerOptions | null>(null);
  readonly result = signal<GuitarExplorerResult | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rootNote = signal('E');
  readonly scaleType = signal('Major');
  readonly tuningName = signal('Guitar Standard');
  readonly stringCount = signal(6);
  readonly fretCount = signal(15);
  readonly displayMode = signal<'notes' | 'intervals'>('notes');
  readonly customTuning = signal('');

  readonly selectedScale = computed(() =>
    this.options()?.scales.find(scale => scale.name === this.scaleType()) ?? this.result()?.scale ?? null);
  readonly tuningSummary = computed(() => this.result()?.tuning.notes.join(' - ') ?? '');
  readonly printDate = computed(() => new Date().toLocaleDateString());
  readonly practiceSheetTitle = computed(() => {
    const data = this.result();
    return data ? `${data.rootNote} ${data.scale.name} - ${data.tuning.name}` : 'Guitar Practice Sheet';
  });
  readonly cagedShapes = computed<CagedShape[]>(() => {
    const data = this.result();
    if (!data) {
      return [];
    }

    const root = data.rootNote;
    const third = data.scaleNotes[2] ?? data.scaleNotes[1] ?? root;
    const fifth = data.scaleNotes[4] ?? data.scaleNotes[2] ?? root;
    return [
      {
        shape: 'C',
        anchor: `${root} chord with ${root}-${third}-${fifth}`,
        positionFocus: 'Open C shape moved until the lowest C-shape root matches the key center.',
        practicePrompt: 'Play the chord, then outline the nearest scale position around it.'
      },
      {
        shape: 'A',
        anchor: `${root} chord around the A-shape barre form`,
        positionFocus: 'Find the root on the A string and build the compact mid-neck box.',
        practicePrompt: 'Ascend the arpeggio, descend the scale, then resolve to the root.'
      },
      {
        shape: 'G',
        anchor: `${root} chord using the stretched G-shape map`,
        positionFocus: 'Use this as a bridge between the lower and upper CAGED boxes.',
        practicePrompt: 'Keep the chord tones visible; play short two-string fragments.'
      },
      {
        shape: 'E',
        anchor: `${root} chord around the E-shape barre form`,
        positionFocus: 'Find the root on the low E string and connect it to the primary position.',
        practicePrompt: 'Play triad tones first, then add passing scale notes in time.'
      },
      {
        shape: 'D',
        anchor: `${root} chord with the D-shape upper-register form`,
        positionFocus: 'Use the high-string shape to finish the octave cycle.',
        practicePrompt: 'Play the top-string melody notes, then walk back to the nearest E shape.'
      }
    ];
  });

  constructor(private readonly service: GuitarService) {}

  ngOnInit(): void {
    this.service.getOptions().subscribe({
      next: options => {
        this.options.set(options);
        this.generate();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load guitar options.')
    });
  }

  setRootNote(value: string): void {
    this.rootNote.set(value);
    this.generate();
  }

  setScaleType(value: string): void {
    this.scaleType.set(value);
    this.generate();
  }

  setDisplayMode(value: 'notes' | 'intervals'): void {
    this.displayMode.set(value);
    this.generate();
  }

  setStringCount(value: number): void {
    const count = Math.max(4, Math.min(9, Number(value) || 6));
    this.stringCount.set(count);
    const firstMatching = this.options()?.tunings.find(tuning => tuning.stringCount === count);
    if (firstMatching && !this.options()?.tunings.some(tuning => tuning.stringCount === count && tuning.name === this.tuningName())) {
      this.tuningName.set(firstMatching.name);
    }
    this.generate();
  }

  setFretCount(value: number): void {
    this.fretCount.set(Math.max(5, Math.min(36, Number(value) || 15)));
    this.generate();
  }

  setTuningName(value: string): void {
    this.tuningName.set(value);
    this.customTuning.set('');
    this.generate();
  }

  setCustomTuning(value: string): void {
    this.customTuning.set(value);
    const notes = this.customTuningNotes();
    if (notes.length >= 4) {
      this.stringCount.set(Math.max(4, Math.min(9, notes.length)));
    }
    this.generate();
  }

  setPreset(preset: TuningPreset): void {
    const hasNamedTuning = this.options()?.tunings.some(tuning =>
      tuning.stringCount === preset.stringCount && tuning.name === preset.tuningName) ?? false;

    this.stringCount.set(preset.stringCount);
    this.tuningName.set(preset.tuningName);
    this.customTuning.set(hasNamedTuning ? '' : preset.notes.join(' '));
    this.generate();
  }

  generate(): void {
    if (!this.options()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.service.explore(this.buildRequest()).subscribe({
      next: result => this.result.set(result),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to generate fretboard.'),
      complete: () => this.loading.set(false)
    });
  }

  printPracticeSheet(): void {
    setTimeout(() => window.print());
  }

  private buildRequest(): GuitarExplorerRequest {
    const custom = this.customTuningNotes();
    return {
      rootNote: this.rootNote(),
      scaleType: this.scaleType(),
      tuningName: this.tuningName(),
      customTuning: custom.length >= 4 ? custom : null,
      stringCount: this.stringCount(),
      fretCount: this.fretCount(),
      displayMode: this.displayMode()
    };
  }

  private customTuningNotes(): string[] {
    return this.customTuning()
      .split(/[,\s]+/)
      .map(note => note.trim())
      .filter(Boolean);
  }
}
