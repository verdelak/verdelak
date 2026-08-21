import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FretboardString } from '../models/guitar.models';

@Component({
  selector: 'app-fretboard-diagram',
  imports: [CommonModule],
  templateUrl: './fretboard-diagram.html',
  styleUrl: './fretboard-diagram.scss'
})
export class FretboardDiagram {
  @Input() fretboard: FretboardString[] = [];
  @Input() title = 'Full Fretboard';

  frets(): number[] {
    return this.fretboard[0]?.frets.map(fret => fret.fret) ?? [];
  }

  displayStrings(): FretboardString[] {
    return [...this.fretboard].reverse();
  }
}
