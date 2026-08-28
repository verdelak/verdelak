import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BlogAppearanceSettings, BlogService } from '../blog.service';
import { BlogArchiveMonth, BlogPostSummary, BlogTag } from '../models/blog.models';

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
  selector: 'app-blog-list',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './blog-list.html',
  styleUrl: './blog-list.scss'
})
export class BlogList implements OnInit {
  readonly posts = signal<BlogPostSummary[]>([]);
  readonly tags = signal<BlogTag[]>([]);
  readonly archive = signal<BlogArchiveMonth[]>([]);
  readonly search = signal('');
  readonly selectedTag = signal('');
  readonly selectedYear = signal<number | null>(null);
  readonly selectedMonth = signal<number | null>(null);
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly totalPages = signal(0);
  readonly totalCount = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly appearance = signal<BlogAppearanceSettings>(defaultBlogAppearance);

  readonly canGoPrevious = computed(() => this.page() > 1);
  readonly canGoNext = computed(() => this.totalPages() > this.page());

  constructor(
    private readonly service: BlogService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.service.getAppearance().subscribe({
      next: appearance => this.appearance.set(this.normalizeAppearance(appearance)),
      error: () => this.appearance.set(defaultBlogAppearance)
    });
    this.service.getTags().subscribe(tags => this.tags.set(tags));
    this.service.getArchive().subscribe(archive => this.archive.set(archive));

    this.route.queryParamMap.subscribe(params => {
      this.search.set(params.get('search') ?? '');
      this.selectedTag.set(params.get('tag') ?? '');
      this.selectedYear.set(this.numberParam(params.get('year')));
      this.selectedMonth.set(this.numberParam(params.get('month')));
      this.page.set(this.numberParam(params.get('page')) ?? 1);
      this.loadPosts();
    });
  }

  applySearch(): void {
    this.navigate({ search: this.search().trim(), page: 1 });
  }

  setTag(tag: string): void {
    this.navigate({ tag, page: 1 });
  }

  setArchive(month: BlogArchiveMonth): void {
    this.navigate({ year: month.year, month: month.month, page: 1 });
  }

  clearFilters(): void {
    this.search.set('');
    this.router.navigate([], { queryParams: {} });
  }

  previousPage(): void {
    if (this.canGoPrevious()) {
      this.navigate({ page: this.page() - 1 });
    }
  }

  nextPage(): void {
    if (this.canGoNext()) {
      this.navigate({ page: this.page() + 1 });
    }
  }

  monthName(month: number): string {
    return new Date(2000, month - 1, 1).toLocaleString(undefined, { month: 'long' });
  }

  private loadPosts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getPosts({
      page: this.page(),
      pageSize: this.pageSize,
      search: this.search(),
      tag: this.selectedTag(),
      year: this.selectedYear() ?? undefined,
      month: this.selectedMonth() ?? undefined
    }).subscribe({
      next: result => {
        this.posts.set(result.items);
        this.totalPages.set(result.totalPages);
        this.totalCount.set(result.totalCount);
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load blog entries.'),
      complete: () => this.loading.set(false)
    });
  }

  private navigate(queryParams: Record<string, string | number | null | undefined>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  private numberParam(value: string | null): number | null {
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
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
