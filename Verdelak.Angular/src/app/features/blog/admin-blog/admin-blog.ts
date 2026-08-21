import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../blog.service';
import { BlogPostDetail, BlogPostSummary } from '../models/blog.models';

interface BlogForm {
  id: number | null;
  title: string;
  slug: string;
  bodyMarkdown: string;
  postedDate: string;
  status: string;
  isPublic: boolean;
  tags: string;
}

@Component({
  selector: 'app-admin-blog',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-blog.html',
  styleUrl: './admin-blog.scss'
})
export class AdminBlog implements OnInit {
  readonly posts = signal<BlogPostSummary[]>([]);
  readonly statuses = signal<string[]>(['Draft', 'Published']);
  readonly statusFilter = signal('');
  readonly search = signal('');
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly totalCount = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly form = signal<BlogForm>(this.emptyForm());

  constructor(private readonly service: BlogService) {}

  ngOnInit(): void {
    this.service.getStatuses().subscribe({
      next: statuses => this.statuses.set(statuses),
      error: () => this.statuses.set(['Draft', 'Published'])
    });
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getAdminPosts({
      page: this.page(),
      pageSize: 20,
      search: this.search(),
      status: this.statusFilter()
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

  applyFilters(): void {
    this.page.set(1);
    this.loadPosts();
  }

  newPost(): void {
    this.message.set(null);
    this.error.set(null);
    this.form.set(this.emptyForm());
  }

  selectPost(post: BlogPostSummary): void {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.getAdminPost(post.id).subscribe({
      next: detail => this.form.set(this.toForm(detail)),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load blog entry.'),
      complete: () => this.loading.set(false)
    });
  }

  setFormField<K extends keyof BlogForm>(field: K, value: BlogForm[K]): void {
    this.form.set({ ...this.form(), [field]: value });
  }

  save(): void {
    const form = this.form();

    if (!form.title.trim() || !form.bodyMarkdown.trim()) {
      this.error.set('Title and body text are required.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    const request = {
      title: form.title.trim(),
      slug: form.slug.trim() || null,
      bodyMarkdown: form.bodyMarkdown.trim(),
      postedDate: new Date(form.postedDate).toISOString(),
      status: form.status,
      isPublic: form.isPublic,
      tags: this.parseTags(form.tags)
    };

    const saveRequest = form.id
      ? this.service.updatePost(form.id, request)
      : this.service.createPost(request);

    saveRequest.subscribe({
      next: saved => {
        this.form.set(this.toForm(saved));
        this.message.set(`${saved.title} saved.`);
        this.loadPosts();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save blog entry.'),
      complete: () => this.loading.set(false)
    });
  }

  deleteSelected(): void {
    const form = this.form();

    if (!form.id) {
      return;
    }

    if (!window.confirm(`Delete ${form.title}?`)) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.deletePost(form.id).subscribe({
      next: () => {
        this.message.set(`${form.title} deleted.`);
        this.form.set(this.emptyForm());
        this.loadPosts();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete blog entry.'),
      complete: () => this.loading.set(false)
    });
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
      this.loadPosts();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.set(this.page() + 1);
      this.loadPosts();
    }
  }

  private emptyForm(): BlogForm {
    return {
      id: null,
      title: '',
      slug: '',
      bodyMarkdown: '',
      postedDate: this.localDateTime(new Date()),
      status: 'Draft',
      isPublic: false,
      tags: ''
    };
  }

  private toForm(post: BlogPostDetail): BlogForm {
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      bodyMarkdown: post.bodyMarkdown,
      postedDate: this.localDateTime(new Date(post.postedDate)),
      status: post.status,
      isPublic: post.isPublic,
      tags: post.tags.map(tag => tag.name).join(', ')
    };
  }

  private parseTags(tags: string): string[] {
    return tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }

  private localDateTime(date: Date): string {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }
}
