import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';
import { FretboardPosition } from '../models/guitar.models';
import { FretboardDiagram } from '../fretboard-diagram/fretboard-diagram';

@Component({
  selector: 'app-position-viewer',
  imports: [CommonModule, FretboardDiagram],
  templateUrl: './position-viewer.html'
})
export class PositionViewer {
  @Input() positions: FretboardPosition[] = [];
  readonly activeIndex = signal(0);

  activePosition(): FretboardPosition | null {
    return this.positions[this.activeIndex()] ?? this.positions[0] ?? null;
  }

  setPosition(index: number): void {
    this.activeIndex.set(index);
  }
}
