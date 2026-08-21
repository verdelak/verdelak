import { Component, Input, signal, effect, Signal } from '@angular/core';
import { HomeInventoryService } from '../services/home-inventory';
import { HomeInventoryImage } from '../models/home-inventory-image.model';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-item-image-gallery',
  imports: [NgIf, NgFor,],
  templateUrl: './item-image-gallery.html',
  styleUrl: './item-image-gallery.scss'
})
export class ItemImageGallery {

  @Input() itemId: number = 0;

  readonly images = signal<HomeInventoryImage[]>([]);
  readonly error = signal<string | null>(null);

  constructor(private inventory: HomeInventoryService) {
  }

  ngOnChanges(): void {
    if (this.itemId > 0) {
      this.images.set([]); // reset old images
      this.error.set(null);
      this.inventory.fetchImages(this.itemId).subscribe({
        next: imgs => this.images.set(imgs),
        error: err => this.error.set(err.message),
      });
    }
  }

  deleteImage(id: number) {
  if (!confirm('Delete this image?')) return;
    this.inventory.deleteImage(id).subscribe(() => {
      this.inventory.loadImages(this.itemId);
    });
  }

  async uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      await this.inventory.uploadImage(this.itemId, file);
      const updated = await this.inventory.fetchImages(this.itemId).toPromise();
      this.images.set(updated || []);
    } catch {
      this.error.set('Image upload failed.');
    } finally {
      input.value = ''; // reset file input
    }
  }
}
