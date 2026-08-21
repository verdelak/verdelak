import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeInventoryItem } from '../models/home-inventory-item.model';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-card.html',
  styleUrl: './item-card.scss'
})
export class ItemCard {
  @Input({ required: true }) item!: HomeInventoryItem;
  @Input() rooms: { id: number; location: string }[] = [];

  roomNameFor(id: number): string {
    return this.rooms.find(r => r.id === id)?.location ?? 'Unknown';
  }
}