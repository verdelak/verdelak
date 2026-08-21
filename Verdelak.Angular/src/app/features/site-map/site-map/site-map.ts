import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { MAIN_MENU, MenuItem } from '../../../shared/data/menu-data';

type SiteMapStatus = 'Working' | 'Planned' | 'Placeholder' | 'External';
type StatusFilter = SiteMapStatus | 'All';

interface SiteMapEntry {
  area: string;
  title: string;
  path: string[];
  link?: string;
  description: string;
  status: SiteMapStatus;
  roles: string[];
  tags: string[];
}

interface SiteMapGroup {
  area: string;
  entries: SiteMapEntry[];
}

@Component({
  selector: 'app-site-map',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './site-map.html',
  styleUrl: './site-map.scss'
})
export class SiteMap {
  readonly search = signal('');
  readonly statusFilter = signal<StatusFilter>('All');
  readonly showPlaceholders = signal(true);
  readonly statuses: StatusFilter[] = ['All', 'Working', 'Planned', 'Placeholder', 'External'];

  readonly entries = computed(() => this.buildEntries());
  readonly filteredGroups = computed(() => {
    const search = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    const showPlaceholders = this.showPlaceholders();

    const entries = this.entries().filter(entry => {
      const matchesSearch = !search || [
        entry.area,
        entry.title,
        entry.description,
        entry.link,
        entry.status,
        entry.roles.join(' '),
        entry.tags.join(' '),
        entry.path.join(' ')
      ].some(value => (value ?? '').toLowerCase().includes(search));

      const matchesStatus = status === 'All' || entry.status === status;
      const matchesPlaceholder = showPlaceholders || entry.status !== 'Placeholder';

      return matchesSearch && matchesStatus && matchesPlaceholder;
    });

    return this.groupEntries(entries);
  });

  readonly visibleCount = computed(() => this.filteredGroups().reduce((total, group) => total + group.entries.length, 0));
  readonly totalCount = computed(() => this.entries().length);

  constructor(private readonly auth: AuthService) {}

  clearFilters(): void {
    this.search.set('');
    this.statusFilter.set('All');
    this.showPlaceholders.set(true);
  }

  statusClass(status: SiteMapStatus): string {
    return {
      Working: 'bg-emerald-50 text-emerald-700',
      Planned: 'bg-blue-50 text-blue-700',
      Placeholder: 'bg-slate-100 text-slate-600',
      External: 'bg-amber-50 text-amber-700'
    }[status];
  }

  private buildEntries(): SiteMapEntry[] {
    return MAIN_MENU.flatMap(item => this.flattenItem(item, item.text, [], []));
  }

  private flattenItem(item: MenuItem, area: string, path: string[], inheritedRoles: string[]): SiteMapEntry[] {
    const roles = item.roles ?? inheritedRoles;
    const currentPath = [...path, item.text];
    const childEntries = item.children?.flatMap(child => this.flattenItem(child, area, currentPath, roles)) ?? [];
    const includeItem = item.link || !item.children?.length;

    if (!this.canSee(roles)) {
      return [];
    }

    const entries = includeItem
      ? [this.toEntry(item, area, currentPath, roles)]
      : [];

    return [...entries, ...childEntries];
  }

  private toEntry(item: MenuItem, area: string, path: string[], roles: string[]): SiteMapEntry {
    const status = item.status ?? (item.link ? 'Working' : 'Placeholder');

    return {
      area,
      title: item.text,
      path,
      link: item.link,
      description: item.description ?? this.defaultDescription(item, status),
      status,
      roles,
      tags: item.tags ?? [area]
    };
  }

  private groupEntries(entries: SiteMapEntry[]): SiteMapGroup[] {
    return MAIN_MENU
      .map(item => ({
        area: item.text,
        entries: entries.filter(entry => entry.area === item.text)
      }))
      .filter(group => group.entries.length > 0);
  }

  private canSee(roles: string[]): boolean {
    return roles.length === 0 || roles.some(role => this.auth.hasRole(role));
  }

  private defaultDescription(item: MenuItem, status: SiteMapStatus): string {
    if (status === 'Placeholder') {
      return 'This section is listed in the navigation but has not been wired to a page yet.';
    }

    if (status === 'External') {
      return 'This item points to a related external area.';
    }

    return `${item.text} section.`;
  }
}
