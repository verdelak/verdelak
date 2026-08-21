import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ArpeggioPattern, HarmonizedChord } from '../models/guitar.models';

@Component({
  selector: 'app-chord-viewer',
  imports: [CommonModule],
  templateUrl: './chord-viewer.html'
})
export class ChordViewer {
  @Input() chords: HarmonizedChord[] = [];
  @Input() arpeggios: ArpeggioPattern[] = [];
  @Input() progressions: string[] = [];

  noteList(notes: string[]): string {
    return notes.join(' - ');
  }

  intervalList(intervals: string[]): string {
    return intervals.join(' - ');
  }
}
