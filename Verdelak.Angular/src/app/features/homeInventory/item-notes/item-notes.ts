import { CommonModule } from '@angular/common';
import { Component, computed, Input, OnChanges, OnInit, Signal, signal } from '@angular/core';
import { NoteThread } from '../note-thread/note-thread';
import { HomeInventoryService } from '../services/home-inventory';
import { HomeInventoryNote } from '../models/home-inventory-note.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-item-notes',
  imports: [CommonModule, NoteThread, FormsModule],
  templateUrl: './item-notes.html',
  styleUrl: './item-notes.scss'
})
export class ItemNotes implements OnChanges {
  @Input() itemId: number = 0;

  readonly notes: Signal<HomeInventoryNote[]>;
  readonly error: Signal<string | null>;
  readonly loading: Signal<boolean>;
  readonly groupedNotes: Signal<HomeInventoryNote[][]>;

  newNoteText: string = '';

  constructor(private service: HomeInventoryService) {
    this.notes = this.service.notes;
    this.error = this.service.error;
    this.loading = this.service.loading;

    this.groupedNotes = computed(() => {
      const threads = new Map<number, HomeInventoryNote[]>();

      for (const note of this.notes()) {
        if (!threads.has(note.noteNum)) {
          threads.set(note.noteNum, []);
        }
        threads.get(note.noteNum)!.push(note);
      }

      return Array.from(threads.values())
        .map(group => group.sort((a, b) => a.notePartNum - b.notePartNum))
        .sort((a, b) => a[0].noteNum - b[0].noteNum);
    });
  }

  ngOnChanges(): void {
    if (this.itemId > 0) {
      this.service.loadNotes(this.itemId);
    }
  }

  addNewThread() {
    if (!this.newNoteText.trim()) return;

    this.service.addNote(this.itemId, this.newNoteText).subscribe(() => {
      this.newNoteText = '';
      this.service.loadNotes(this.itemId);
    });
  }

  editNote(event: { id: number; text: string }) {
    this.service.updateNote(event.id, event.text).subscribe(() => {
      this.service.loadNotes(this.itemId);
    });
  }

  deleteNote(id: number) {
    if (!confirm('Delete this note?')) return;
    this.service.deleteNote(id).subscribe(() => {
      this.service.loadNotes(this.itemId);
    });
  }
  
  addNotePart(noteNum: number, text: string) {
    if (!text.trim()) return;

    this.service.appendNotePart(this.itemId, noteNum, text).subscribe(() => {
      this.service.loadNotes(this.itemId);
    });
  }
}


