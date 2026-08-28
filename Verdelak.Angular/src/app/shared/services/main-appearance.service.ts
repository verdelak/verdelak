import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environments';

export interface MainAppearanceSettings {
  brandName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  faviconUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class MainAppearanceService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly url = `${environment.apiUrl}/admin/settings/main-appearance`;

  readonly settings = signal<MainAppearanceSettings>(this.defaults());

  load(): void {
    this.http.get<MainAppearanceSettings>(this.url).subscribe({
      next: settings => this.apply(settings),
      error: () => this.apply(this.defaults())
    });
  }

  apply(settings: MainAppearanceSettings): void {
    const normalized = this.normalize(settings);
    this.settings.set(normalized);

    const style = this.document.documentElement.style;
    style.setProperty('--verd-primary', normalized.primaryColor);
    style.setProperty('--verd-accent', normalized.accentColor);
    this.title.setTitle(normalized.brandName);
    this.applyFavicon(normalized.faviconUrl);
  }

  private normalize(settings: MainAppearanceSettings): MainAppearanceSettings {
    const fallback = this.defaults();
    return {
      brandName: settings.brandName?.trim() || fallback.brandName,
      tagline: settings.tagline?.trim() || fallback.tagline,
      primaryColor: this.isHexColor(settings.primaryColor) ? settings.primaryColor : fallback.primaryColor,
      accentColor: this.isHexColor(settings.accentColor) ? settings.accentColor : fallback.accentColor,
      logoUrl: settings.logoUrl?.trim() || null,
      heroImageUrl: settings.heroImageUrl?.trim() || null,
      faviconUrl: settings.faviconUrl?.trim() || fallback.faviconUrl
    };
  }

  private applyFavicon(faviconUrl: string | null): void {
    const href = faviconUrl || 'favicon.ico';
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'icon';
      this.document.head.appendChild(link);
    }

    link.href = href;
  }

  private defaults(): MainAppearanceSettings {
    return {
      brandName: 'Verdelak',
      tagline: 'Collections, schedules, and household systems',
      primaryColor: '#2563eb',
      accentColor: '#0f766e',
      logoUrl: null,
      heroImageUrl: null,
      faviconUrl: null
    };
  }

  private isHexColor(value: string | null | undefined): boolean {
    return /^#[0-9a-fA-F]{6}$/.test(value ?? '');
  }
}
