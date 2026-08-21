import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HomeInventoryItem } from '../models/home-inventory-item.model';
import { HomeInventoryNote } from '../models/home-inventory-note.model';
import { HomeInventoryImage } from '../models/home-inventory-image.model';
import { Location } from '../models/location.model';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';

@Injectable({ providedIn: 'root' })
export class HomeInventoryService {

  // STATE SIGNALS
  private readonly _items = signal<HomeInventoryItem[]>([]);
  private readonly _selectedItem = signal<HomeInventoryItem | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _images = signal<HomeInventoryImage[]>([]);
  private readonly _notes = signal<HomeInventoryNote[]>([]);

  // EXPOSED COMPUTED SIGNALS
  readonly items = computed(() => this._items());
  readonly selectedItem = computed(() => this._selectedItem());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly images = computed(() => this._images());
  readonly notes = computed(() => this._notes());
  readonly groupedNotes = computed(() => {
    const threads = new Map<number, HomeInventoryNote[]>();

    for (const note of this._notes()) {
      if (!threads.has(note.noteNum)) {
        threads.set(note.noteNum, []);
      }
      threads.get(note.noteNum)!.push(note);
    }

    // Sort each thread by notePartNum
    const result: HomeInventoryNote[][] = Array.from(threads.values()).map(group =>
      group.sort((a, b) => a.notePartNum - b.notePartNum)
    );

    // Optional: sort threads by noteNum (top-level thread order)
    return result.sort((a, b) => a[0].noteNum - b[0].noteNum);
  });

  
  constructor(private http: HttpClient) {}

  readonly rooms = signal<{ id: number; location: string }[]>([]);

  loadRooms(): void {
    this.http.get<{ id: number; location: string }[]>(`${environment.apiUrl}/locations`)
      .subscribe({
        next: (data) => this.rooms.set(data),
        error: (err) => this._error.set('Failed to load rooms')
      });
  }

  // LOAD ALL ITEMS
  loadItems(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http.get<HomeInventoryItem[]>(`${environment.apiUrl}/homeinventory/items`).subscribe({
      next: (data) => this._items.set(data),
      error: (err) => this._error.set(err.message),
      complete: () => this._loading.set(false),
    });
  }

  // LOAD SINGLE ITEM INTO SELECTION
  loadItem(id: number): void {
    this._loading.set(true);
    this._error.set(null);
    this.http.get<HomeInventoryItem>(`${environment.apiUrl}/homeinventory/items/${id}`).subscribe({
      next: (data) => this._selectedItem.set(data),
      error: (err) => this._error.set(err.message),
      complete: () => this._loading.set(false),
    });
  }

  // SAVE ITEM
  saveItem(item: HomeInventoryItem): void {
    this._loading.set(true);
    const isNew = item.id === 0;

   const req$: Observable<HomeInventoryItem | void> = isNew
  ? this.http.post<HomeInventoryItem>(`${environment.apiUrl}/homeinventory/items`, this.prepareItemForUpdate(item))
  : this.http.put<void>(`${environment.apiUrl}/homeinventory/items/${item.id}`, this.prepareItemForUpdate(item));
  
    req$.subscribe({
      next: () => this.loadItems(),
      error: (err) => this._error.set(err.message),
      complete: () => this._loading.set(false),
    });
  }

  // DELETE ITEM
  deleteItem(id: number): void {
    this._loading.set(true);
    this.http.delete(`${environment.apiUrl}/homeinventory/items/${id}`).subscribe({
      next: () => {
        this.loadItems();
        if (this._selectedItem()?.id === id) this._selectedItem.set(null);
      },
      error: (err) => this._error.set(err.message),
      complete: () => this._loading.set(false),
    });
  }

  setSelectedItem(item: HomeInventoryItem): void {
    this._selectedItem.set(item);
  }
    clearSelectedItem(): void {
      this._selectedItem.set(null);
    }

    clearError(): void {
      this._error.set(null);
    }

    loadImages(itemId: number): void {
    this._loading.set(true);
    this._error.set(null);

    this.http.get<HomeInventoryImage[]>(`${environment.apiUrl}/homeinventory/items/${itemId}/images`).subscribe({
      next: (data) => this._images.set(data),
      error: (err) => this._error.set(err.message),
      complete: () => this._loading.set(false),
    });
  }

  loadNotes(itemId: number): void {
    this._loading.set(true);
    this._error.set(null);

    this.http.get<HomeInventoryNote[]>(`${environment.apiUrl}/homeinventory/items/${itemId}/notes`).subscribe({
      next: (data) => this._notes.set(data),
      error: (err) => this._error.set(err.message),
      complete: () => this._loading.set(false),
    });
  }

  clearImages(): void {
    this._images.set([]);
  }

  clearNotes(): void {
    this._notes.set([]);
  }

deleteNote(noteId: number): Observable<void> {
  return this.http.delete<void>(`${environment.apiUrl}/homeinventory/notes/${noteId}`);
}

updateNote(noteId: number, note: string): Observable<void> {
  return this.http.put<void>(`${environment.apiUrl}/homeinventory/notes/${noteId}`, { note });
}

deleteImage(imageId: number): Observable<void> {
  return this.http.delete<void>(`${environment.apiUrl}/homeinventory/images/${imageId}`);
}


uploadImage(itemId: number, file: File, description: string | null = null): void {
  const formData = new FormData();
  formData.append('file', file);
  if (description) formData.append('description', description);

  this.http.post<void>(`${environment.apiUrl}/homeinventory/items/${itemId}/images`, formData).subscribe({
    next: () => this.loadImages(itemId),
    error: (err) => this._error.set(err.message)
  });
}

prepareItemForUpdate(item: HomeInventoryItem): Partial<HomeInventoryItem> {
  const cleaned: any = { ...item };

  Object.entries(cleaned).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim() === '') {
      cleaned[key] = null;
    }
  });

  return cleaned;
}


fetchImages(itemId: number): Observable<HomeInventoryImage[]> {
   return this.http.get<HomeInventoryImage[]>(`${environment.apiUrl}/homeinventory/items/${itemId}/images`);
}

addNote(itemId: number, note: string): Observable<void> {
  return this.http.post<void>(`${environment.apiUrl}/homeinventory/items/${itemId}/notes`, { note });
}

appendNotePart(itemId: number, noteNum: number, note: string): Observable<void> {
  return this.http.post<void>(`${environment.apiUrl}/homeinventory/items/${itemId}/notes/${noteNum}`, { note });
}
}
