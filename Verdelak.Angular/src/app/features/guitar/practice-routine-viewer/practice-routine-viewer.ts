import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PracticeRoutine } from '../models/guitar.models';

@Component({
  selector: 'app-practice-routine-viewer',
  imports: [CommonModule],
  templateUrl: './practice-routine-viewer.html'
})
export class PracticeRoutineViewer {
  @Input() routines: PracticeRoutine[] = [];
}
