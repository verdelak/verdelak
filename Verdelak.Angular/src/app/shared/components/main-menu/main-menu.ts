import { Component, ElementRef, HostListener, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MAIN_MENU, MenuItem } from '../../data/menu-data';
import { CommonModule } from '@angular/common';
import { MenuButton } from '../../menu-button/menu-button';
import { AuthService } from '../../../core/auth/auth.service';
import { ExternalSitesService } from '../../services/external-sites.service';
import { MainAppearanceService } from '../../services/main-appearance.service';


@Component({
  selector: 'app-main-menu',
  imports: [
    MenuButton,
    CommonModule,
    RouterLink
  ],
  templateUrl: './main-menu.html',
  styleUrl: './main-menu.scss'
})
export class MainMenu implements OnInit {
  readonly externalSites = signal<Record<string, { url: string; openInNewTab: boolean; label: string }>>({});
  readonly menu = computed(() => this.filterMenu(this.resolveExternalMenu(MAIN_MENU)));
  showMobileMenu = signal(false);
  openMenuPath = signal<string | null>(null);

  constructor(
    readonly auth: AuthService,
    readonly appearance: MainAppearanceService,
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly externalSitesService: ExternalSitesService
  ) {}

  ngOnInit(): void {
    this.externalSitesService.getResolvedSites().subscribe({
      next: sites => this.externalSites.set(Object.fromEntries(sites.map(site => [
        site.key,
        {
          url: site.resolvedUrl!,
          openInNewTab: site.openInNewTab,
          label: site.label
        }
      ]))),
      error: () => this.externalSites.set({})
    });
  }

  setOpenMenu(path: string | null): void {
    this.openMenuPath.set(path);
  }

  closeMenus(): void {
    this.openMenuPath.set(null);
    this.showMobileMenu.set(false);
  }

  toggleMobileMenu(): void {
    const next = !this.showMobileMenu();
    this.showMobileMenu.set(next);
    if (!next) {
      this.openMenuPath.set(null);
    }
  }

  @HostListener('document:click', ['$event'])
  closeWhenClickingAway(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.openMenuPath.set(null);
    }
  }

  private filterMenu(items: MenuItem[]): MenuItem[] {
    if (!this.auth.isAuthenticated()) {
      return items.filter(item => item.link === '/' || item.link === '/login');
    }

    return items
      .filter(item => !item.roles?.length || item.roles.some(role => this.auth.hasRole(role)))
      .map(item => ({
        ...item,
        children: item.children ? this.filterMenu(item.children) : undefined
      }))
      .filter(item => item.link || item.externalUrl || !item.children || item.children.length);
  }

  private resolveExternalMenu(items: MenuItem[]): MenuItem[] {
    const externalSites = this.externalSites();
    return items.map(item => {
      const resolved = item.externalSiteKey ? externalSites[item.externalSiteKey] : null;
      return {
        ...item,
        text: resolved?.label ?? item.text,
        externalUrl: resolved?.url ?? item.externalUrl,
        openInNewTab: resolved?.openInNewTab ?? item.openInNewTab,
        children: item.children ? this.resolveExternalMenu(item.children) : undefined
      };
    });
  }
}
