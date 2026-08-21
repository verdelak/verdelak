import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

export interface MenuItem {
  text: string;
  link?: string;
  externalUrl?: string;
  openInNewTab?: boolean;
  children?: MenuItem[];
  dividerAfter?: boolean;
}

@Component({
  selector: 'app-menu-button',
  imports: [
    CommonModule,
    RouterModule,
    MenuButton
  ],
  templateUrl: './menu-button.html',
  styleUrl: './menu-button.scss'
})
export class MenuButton  {
  @Input({ required: true }) item!: MenuItem;
  @Input() mode: 'desktop' | 'mobile' = 'desktop';
  @Input() depth = 0;
  @Input() path = '';
  @Input() openPath: string | null = null;
  @Output() openPathChange = new EventEmitter<string | null>();
  @Output() navigate = new EventEmitter<void>();

  constructor(private readonly router: Router) {}

  isOpen(): boolean {
    return !!this.openPath && (this.openPath === this.path || this.openPath.startsWith(`${this.path}.`));
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.openPathChange.emit(this.isOpen() && this.openPath === this.path ? this.parentPath() : this.path);
  }

  childPath(index: number): string {
    return this.path ? `${this.path}.${index}` : index.toString();
  }

  onNavigate(): void {
    this.navigate.emit();
  }

  isActive(): boolean {
    return this.isItemActive(this.item);
  }

  linkActive(link: string | undefined): boolean {
    if (!link) {
      return false;
    }

    const current = this.router.url.split('?')[0].split('#')[0] || '/';
    if (link === '/') {
      return current === '/';
    }

    return current === link || current.startsWith(`${link}/`);
  }

  private isItemActive(item: MenuItem): boolean {
    return this.linkActive(item.link) || !!item.children?.some(child => this.isItemActive(child));
  }

  private parentPath(): string | null {
    const index = this.path.lastIndexOf('.');
    return index >= 0 ? this.path.slice(0, index) : null;
  }
}
