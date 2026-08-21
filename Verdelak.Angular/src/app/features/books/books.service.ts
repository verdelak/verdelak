import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { BookListItem, BookLookup, BookSaveRequest } from './models/book.models';

@Injectable({ providedIn: 'root' })
export class BooksService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/books`;

  getBooks(format?: string, q?: string) {
    let params = new HttpParams();

    if (format && format !== 'All') {
      params = params.set('format', format);
    }

    if (q?.trim()) {
      params = params.set('q', q.trim());
    }

    return this.http.get<BookListItem[]>(this.baseUrl, { params });
  }

  getWantList() {
    return this.http.get<BookListItem[]>(`${this.baseUrl}/want-list`);
  }

  getFormats() {
    return this.http.get<BookLookup[]>(`${this.baseUrl}/formats`);
  }

  getAuthors() {
    return this.http.get<BookLookup[]>(`${this.baseUrl}/authors`);
  }

  getSeries() {
    return this.http.get<BookLookup[]>(`${this.baseUrl}/series`);
  }

  getSubSeries(seriesId?: number | null) {
    const params = seriesId ? new HttpParams().set('seriesId', seriesId) : undefined;
    return this.http.get<BookLookup[]>(`${this.baseUrl}/sub-series`, { params });
  }

  createBook(request: BookSaveRequest) {
    return this.http.post<BookListItem>(this.baseUrl, request);
  }

  updateBook(id: number, request: BookSaveRequest) {
    return this.http.put<void>(`${this.baseUrl}/${id}`, request);
  }

  deleteBook(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
