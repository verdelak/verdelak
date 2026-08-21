export interface GuitarExplorerRequest {
  rootNote: string;
  scaleType: string;
  tuningName: string | null;
  customTuning: string[] | null;
  stringCount: number;
  fretCount: number;
  displayMode: 'notes' | 'intervals';
}

export interface GuitarExplorerOptions {
  rootNotes: string[];
  scales: ScaleDefinition[];
  tunings: TuningDefinition[];
  displayModes: string[];
}

export interface ScaleDefinition {
  name: string;
  intervals: number[];
  formula: string[];
  family: string;
  description: string;
}

export interface TuningDefinition {
  name: string;
  instrument: string;
  stringCount: number;
  notes: string[];
  description: string;
}

export interface GuitarExplorerResult {
  rootNote: string;
  scale: ScaleDefinition;
  tuning: TuningDefinition;
  scaleNotes: string[];
  fretboard: FretboardString[];
  positions: FretboardPosition[];
  chords: HarmonizedChord[];
  arpeggios: ArpeggioPattern[];
  practiceRoutine: PracticeRoutine[];
  suggestedProgressions: string[];
}

export interface FretboardString {
  stringNumber: number;
  openNote: string;
  frets: FretboardNote[];
}

export interface FretboardNote {
  fret: number;
  note: string;
  interval: string;
  isScaleNote: boolean;
  isRoot: boolean;
  display: string;
}

export interface FretboardPosition {
  positionNumber: number;
  startFret: number;
  endFret: number;
  strings: FretboardString[];
}

export interface HarmonizedChord {
  degree: string;
  rootNote: string;
  triad: string;
  triadNotes: string[];
  seventh: string | null;
  seventhNotes: string[];
}

export interface ArpeggioPattern {
  degree: string;
  chordName: string;
  patternType: string;
  notes: string[];
  intervals: string[];
  practiceHint: string;
}

export interface PracticeRoutine {
  title: string;
  focus: string;
  steps: string[];
}
