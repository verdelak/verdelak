import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import {
  BlogArchiveMonth,
  BlogPostDetail,
  BlogPostSaveRequest,
  BlogPostSummary,
  BlogTag,
  PagedResult
} from './models/blog.models';

export interface BlogQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  tag?: string;
  year?: number;
  month?: number;
  status?: string;
}

export interface BlogAppearanceSettings {
  brandName: string;
  tagline: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  faviconUrl: string | null;
}

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly blogUrl = `${environment.apiUrl}/blog`;
  private readonly adminUrl = `${environment.apiUrl}/admin/blog`;
  private readonly settingsUrl = `${environment.apiUrl}/admin/settings`;

  getPosts(query: BlogQuery = {}) {
    return this.http.get<PagedResult<BlogPostSummary>>(`${this.blogUrl}/posts`, { params: this.params(query) });
  }

  getPost(slug: string) {
    return this.http.get<BlogPostDetail>(`${this.blogUrl}/posts/${slug}`);
  }

  getTags() {
    return this.http.get<BlogTag[]>(`${this.blogUrl}/tags`);
  }

  getArchive() {
    return this.http.get<BlogArchiveMonth[]>(`${this.blogUrl}/archive`);
  }

  getAppearance() {
    return this.http.get<BlogAppearanceSettings>(`${this.settingsUrl}/blog-appearance`);
  }

  getAdminPosts(query: BlogQuery = {}) {
    return this.http.get<PagedResult<BlogPostSummary>>(`${this.adminUrl}/posts`, { params: this.params(query) });
  }

  getAdminPost(id: number) {
    return this.http.get<BlogPostDetail>(`${this.adminUrl}/posts/${id}`);
  }

  getStatuses() {
    return this.http.get<string[]>(`${this.adminUrl}/statuses`);
  }

  createPost(request: BlogPostSaveRequest) {
    return this.http.post<BlogPostDetail>(`${this.adminUrl}/posts`, request);
  }

  updatePost(id: number, request: BlogPostSaveRequest) {
    return this.http.put<BlogPostDetail>(`${this.adminUrl}/posts/${id}`, request);
  }

  deletePost(id: number) {
    return this.http.delete<void>(`${this.adminUrl}/posts/${id}`);
  }

  private params(query: BlogQuery): HttpParams {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return params;
  }
}
