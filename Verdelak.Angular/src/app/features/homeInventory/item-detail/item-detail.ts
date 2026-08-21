import { Component, computed, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeInventoryService } from '../services/home-inventory';
import { ItemImageGallery } from '../item-image-gallery/item-image-gallery';
import { ItemNotes } from '../item-notes/item-notes';
import { ItemForm } from '../item-form/item-form';
import { HomeInventoryItem } from '../models/home-inventory-item.model';

@Component({
  selector: 'app-item-detail',
  imports: [CommonModule, ItemImageGallery, ItemForm, ItemNotes],
  templateUrl: './item-detail.html',
  styleUrl: './item-detail.scss'
})
export class ItemDetail {
  readonly item = computed(() => this.inventory.selectedItem());
  readonly editMode = signal(false);
  readonly newItemMode = signal(false);

createNewItem(): void {
  const newItem = {
    id: 0,
    item: '',
    roomId: 1,         // Default roomId, or let user choose
    roomName: 'Unassigned',
    description: '',
    makeModel: '',
    serialNumber: '',
    purchaseDate: '',
    purchaseLocation: '',
    purchasePrice: undefined,
    estimatedValue: undefined
  };

  this.inventory.setSelectedItem(newItem);
  this.newItemMode.set(true);
  this.editMode.set(false);
}


  constructor(public inventory: HomeInventoryService) {}
  @Input() rooms: { id: number; location: string }[] = [];
  delete(): void {
    const i = this.item();
    if (i && confirm(`Delete "${i.item}"?`)) {
      this.inventory.deleteItem(i.id);
      this.editMode.set(false);
    }
  }

  enableEdit(): void {
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
    this.newItemMode.set(false);
  }

  saveItem(updated: HomeInventoryItem): void {
    this.inventory.saveItem(updated);
    this.editMode.set(false);
    this.newItemMode.set(false);
  }

  roomNameFor(id: number): string {
    return this.rooms.find(r => r.id === id)?.location ?? 'Unknown';
  }
}
