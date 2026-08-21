import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResumeItem, ResumeItemSave, ResumeProfile } from '../models/resume.models';
import { ResumeService } from '../resume.service';

type ResumeSection = ResumeItem['section'];

interface ResumeItemForm {
  id: number | null;
  section: ResumeSection;
  sortOrder: number;
  title: string;
  subtitle: string;
  startText: string;
  endText: string;
  location: string;
  body: string;
  tags: string;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-resume',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-resume.html',
  styleUrl: './admin-resume.scss'
})
export class AdminResume implements OnInit {
  readonly sections: ResumeSection[] = ['Experience', 'Projects', 'Skills', 'Education', 'Certifications & Awards'];
  readonly profile = signal<ResumeProfile>(this.emptyProfile());
  readonly items = signal<ResumeItem[]>([]);
  readonly selectedSection = signal<ResumeSection | 'All'>('All');
  readonly itemForm = signal<ResumeItemForm>(this.emptyItemForm());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  constructor(private readonly service: ResumeService) {}

  ngOnInit(): void {
    this.loadResume();
  }

  filteredItems() {
    return this.items().filter(item => this.selectedSection() === 'All' || item.section === this.selectedSection());
  }

  loadResume(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getAdminResume().subscribe({
      next: document => {
        this.profile.set(document.profile);
        this.items.set(document.items);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Resume could not be loaded.'),
      complete: () => this.loading.set(false)
    });
  }

  setProfileField<K extends keyof ResumeProfile>(field: K, value: ResumeProfile[K]): void {
    this.profile.set({ ...this.profile(), [field]: value });
  }

  saveProfile(): void {
    const profile = this.profile();
    if (!profile.name.trim() || !profile.title.trim()) {
      this.error.set('Name and title are required.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.saveProfile(profile).subscribe({
      next: saved => {
        this.profile.set(saved);
        this.message.set('Resume profile saved.');
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Resume profile could not be saved.'),
      complete: () => this.loading.set(false)
    });
  }

  selectItem(item: ResumeItem): void {
    this.message.set(null);
    this.error.set(null);
    this.itemForm.set({
      id: item.id,
      section: item.section,
      sortOrder: item.sortOrder,
      title: item.title,
      subtitle: item.subtitle ?? '',
      startText: item.startText ?? '',
      endText: item.endText ?? '',
      location: item.location ?? '',
      body: item.body ?? '',
      tags: item.tags.join(', '),
      isActive: item.isActive
    });
  }

  newItem(section: ResumeSection = 'Experience'): void {
    this.message.set(null);
    this.error.set(null);
    this.itemForm.set(this.emptyItemForm(section));
  }

  setItemField<K extends keyof ResumeItemForm>(field: K, value: ResumeItemForm[K]): void {
    this.itemForm.set({ ...this.itemForm(), [field]: value });
  }

  saveItem(): void {
    const form = this.itemForm();
    if (!form.title.trim()) {
      this.error.set('Item title is required.');
      return;
    }

    const request: ResumeItemSave = {
      section: form.section,
      sortOrder: Number(form.sortOrder) || 0,
      title: form.title.trim(),
      subtitle: this.clean(form.subtitle),
      startText: this.clean(form.startText),
      endText: this.clean(form.endText),
      location: this.clean(form.location),
      body: this.clean(form.body),
      tags: this.parseTags(form.tags),
      isActive: form.isActive
    };

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    const saveRequest = form.id
      ? this.service.updateItem(form.id, request)
      : this.service.createItem(request);

    saveRequest.subscribe({
      next: saved => {
        this.message.set(`${saved.title} saved.`);
        this.itemForm.set({
          id: saved.id,
          section: saved.section,
          sortOrder: saved.sortOrder,
          title: saved.title,
          subtitle: saved.subtitle ?? '',
          startText: saved.startText ?? '',
          endText: saved.endText ?? '',
          location: saved.location ?? '',
          body: saved.body ?? '',
          tags: saved.tags.join(', '),
          isActive: saved.isActive
        });
        this.loadResume();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Resume item could not be saved.'),
      complete: () => this.loading.set(false)
    });
  }

  deleteSelectedItem(): void {
    const form = this.itemForm();
    if (!form.id || !window.confirm(`Delete ${form.title}?`)) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.deleteItem(form.id).subscribe({
      next: () => {
        this.message.set(`${form.title} deleted.`);
        this.itemForm.set(this.emptyItemForm(form.section));
        this.loadResume();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Resume item could not be deleted.'),
      complete: () => this.loading.set(false)
    });
  }

  private emptyProfile(): ResumeProfile {
    return {
      name: '',
      title: '',
      location: '',
      email: '',
      phone: '',
      website: '',
      summary: ''
    };
  }

  private emptyItemForm(section: ResumeSection = 'Experience'): ResumeItemForm {
    return {
      id: null,
      section,
      sortOrder: 0,
      title: '',
      subtitle: '',
      startText: '',
      endText: '',
      location: '',
      body: '',
      tags: '',
      isActive: true
    };
  }

  private parseTags(tags: string): string[] {
    return tags.split(',').map(tag => tag.trim()).filter(Boolean);
  }

  private clean(value: string): string | undefined {
    return value.trim() || undefined;
  }
}
