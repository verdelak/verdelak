import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemList } from '../item-list/item-list';
import { ItemDetail } from '../item-detail/item-detail';
import { HomeInventoryService } from '../services/home-inventory';
import { RouterModule } from '@angular/router';
import { signal } from '@angular/core';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-home-inventory',
  templateUrl: './home-inventory.html',
  imports: [CommonModule, RouterModule, ItemList, ItemDetail, FormsModule],
  styleUrl: './home-inventory.scss'
})
export class HomeInventory {
  // Optional: Filter by room name
  filterText = signal('');
  constructor(public inventory: HomeInventoryService) {
    inventory.loadRooms();
  }


}
