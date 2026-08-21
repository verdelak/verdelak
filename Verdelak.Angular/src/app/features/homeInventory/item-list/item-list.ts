import { Component, Input, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeInventoryService } from '../services/home-inventory';
import { ItemCard } from '../item-card/item-card';

@Component({
  selector: 'app-item-list',
  imports: [CommonModule, ItemCard],
  templateUrl: './item-list.html',
  styleUrl: './item-list.scss'
})
export class ItemList implements OnInit{

  @Input({ required: true }) filterText = '';

  constructor(public inventory: HomeInventoryService) {}

  ngOnInit(): void {
    this.inventory.loadItems();
  }

  // Filtered items based on filterText (optional name/room match)
  readonly filteredItems = computed(() => {
    const filter = this.filterText.trim().toLowerCase();
    if (!filter) return this.inventory.items();

/*     return this.inventory.items().filter(item =>
      item.item.toLowerCase().includes(filter) ||
      item.roomName.toLowerCase().includes(filter)
    ); */
    return null;
  });

  selectItem(id: number): void {

    this.inventory.loadItem(id);
    this.inventory.loadImages(id);
    this.inventory.loadNotes(id);
  }

  createNewItem(): void {
    const newItem = {
      id: 0,
      item: '',
      roomId: 1,
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
  }
}
