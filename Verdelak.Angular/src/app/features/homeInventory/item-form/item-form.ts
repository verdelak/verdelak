import { Component, Input, Output, EventEmitter, Signal, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeInventoryItem } from '../models/home-inventory-item.model';

@Component({
  selector: 'app-item-form',
  imports: [CommonModule],
  templateUrl: './item-form.html',
  styleUrl: './item-form.scss'
})
export class ItemForm implements OnInit {
  @Input() item: HomeInventoryItem | null = null;
  @Input() rooms: { id: number; location: string }[] = [];
  @Output() save = new EventEmitter<HomeInventoryItem>();
  @Output() cancel = new EventEmitter<void>();

  // Local writable signals for form fields
  itemName = signal('');
  description = signal('');
  makeModel = signal('');
  serialNumber = signal('');
  purchaseDate = signal('');
  purchaseLocation = signal('');
  purchasePrice = signal<number | undefined>(undefined);
  estimatedValue = signal<number | undefined>(undefined);
  roomId = signal<number>(1);

  ngOnInit(): void {
   const i = this.item ?? {
      id: 0,
      item: '',
      roomId: this.rooms[0]?.id ?? 1,
      roomName: 'Unassigned',
      description: '',
      makeModel: '',
      serialNumber: '',
      purchaseDate: '',
      purchaseLocation: '',
      purchasePrice: undefined,
      estimatedValue: undefined
    };

    const defaultRoomId = this.rooms[0]?.id ?? 1;
    this.itemName.set(i.item);
    this.description.set(i.description ?? '');
    this.makeModel.set(i.makeModel ?? '');
    this.serialNumber.set(i.serialNumber ?? '');
    this.purchaseDate.set(i.purchaseDate ?? '');
    this.purchaseLocation.set(i.purchaseLocation ?? '');
    this.purchasePrice.set(i.purchasePrice ?? undefined);
    this.estimatedValue.set(i.estimatedValue ?? undefined);
  }

  onRoomChange(event: Event): void {
    const value = +(event.target as HTMLSelectElement).value;
    this.roomId.set(value);
  }

  onSave(): void {
    const updated: HomeInventoryItem = {
    id: this.item?.id ?? 0,
    item: this.itemName().trim(),
    roomId: this.roomId(),
    description: this.description(),
    makeModel: this.makeModel(),
    serialNumber: this.serialNumber(),
    purchaseDate: this.purchaseDate() || null,
    purchaseLocation: this.purchaseLocation(),
    purchasePrice: this.purchasePrice(),
    estimatedValue: this.estimatedValue(),
  };

    console.log('Submitting:', updated);
    this.save.emit(updated);
  }
}
