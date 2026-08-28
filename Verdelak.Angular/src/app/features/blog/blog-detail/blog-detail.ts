import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogAppearanceSettings, BlogService } from '../blog.service';
import { renderMarkdown } from '../markdown';
import { BlogPostDetail } from '../models/blog.models';

const defaultBlogAppearance: BlogAppearanceSettings = {
  brandName: 'Verdelak Blog',
  tagline: 'Notes, updates, and personal writing.',
  primaryColor: '#4f46e5',
  accentColor: '#0f766e',
  logoUrl: null,
  heroImageUrl: null,
  faviconUrl: null
};

@Component({
  selector: 'app-blog-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-detail.html',
  styleUrl: './blog-detail.scss'
})
export class BlogDetail implements OnInit {
  readonly post = signal<BlogPostDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly appearance = signal<BlogAppearanceSettings>(defaultBlogAppearance);
  readonly bodyHtml = computed<SafeHtml>(() => this.sanitizer.bypassSecurityTrustHtml(renderMarkdown(this.post()?.bodyMarkdown ?? '')));

  constructor(
    private readonly service: BlogService,
    private readonly route: ActivatedRoute,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.service.getAppearance().subscribe({
      next: appearance => this.appearance.set(this.normalizeAppearance(appearance)),
      error: () => this.appearance.set(defaultBlogAppearance)
    });

    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.error.set('Blog entry not found.');
      return;
    }

    this.loading.set(true);
    this.service.getPost(slug).subscribe({
      next: post => this.post.set(post),
      error: err => this.error.set(err.error ?? err.message ?? 'Blog entry not found.'),
      complete: () => this.loading.set(false)
    });
  }

  private normalizeAppearance(appearance: BlogAppearanceSettings): BlogAppearanceSettings {
    return {
      brandName: appearance.brandName?.trim() || defaultBlogAppearance.brandName,
      tagline: appearance.tagline?.trim() || defaultBlogAppearance.tagline,
      primaryColor: appearance.primaryColor?.trim() || defaultBlogAppearance.primaryColor,
      accentColor: appearance.accentColor?.trim() || defaultBlogAppearance.accentColor,
      logoUrl: appearance.logoUrl?.trim() || null,
      heroImageUrl: appearance.heroImageUrl?.trim() || null,
      faviconUrl: appearance.faviconUrl?.trim() || null
    };
  }
}
