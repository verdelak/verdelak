import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { Contact, ContactLookup, PagedResult, UpsertContact } from './models/phone-list.models';

@Injectable({ providedIn: 'root' })
export class PhoneListService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/phone-list`;

  list(opts: {
    q?: string;
    contactTypeId?: string;
    xmasCard?: boolean;
    sort?: string;
    page?: number;
    pageSize?: number;
  }) {
    let params = new HttpParams();
    Object.entries(opts).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<PagedResult<Contact>>(this.baseUrl, { params });
  }

  getContactTypes() {
    return this.http.get<ContactLookup[]>(`${this.baseUrl}/contact-types`);
  }

  getPhoneTypes() {
    return this.http.get<ContactLookup[]>(`${this.baseUrl}/phone-types`);
  }

  create(payload: UpsertContact) {
    return this.http.post<Contact>(this.baseUrl, payload);
  }

  update(id: number, payload: UpsertContact) {
    return this.http.put<Contact>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
