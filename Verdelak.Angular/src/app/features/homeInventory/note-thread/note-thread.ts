import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HomeInventoryNote } from '../models/home-inventory-note.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-note-thread',
  imports: [CommonModule, FormsModule],
  templateUrl: './note-thread.html',
  styleUrl: './note-thread.scss'
})
export class NoteThread {

  @Input({ required: true }) notes!: HomeInventoryNote[];

  @Output() addPart = new EventEmitter<string>();
  @Output() editing = new EventEmitter<{ id: number; text: string }>();
  @Output() deleting = new EventEmitter<number>();
  
  editingId: number | null = null;
  editText: string = '';
  replyText: string = '';

  submitReply() {
    if (!this.replyText.trim()) return;
    this.addPart.emit(this.replyText);
    this.replyText = '';
  }

  startEdit(note: HomeInventoryNote) {
    this.editingId = note.id;
    this.editText = note.note;
  }

  cancelEdit() {
    this.editingId = null;
    this.editText = '';
  }

  saveEdit(id: number) {
    this.editing.emit({ id, text: this.editText });
    this.cancelEdit();
  }

  delete(id: number) {
    this.deleting.emit(id);
  }
}