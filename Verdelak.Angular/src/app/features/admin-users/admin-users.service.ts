import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { AdminUser, UserCreateRequest, UserUpdateRequest } from './models/admin-user.models';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/users`;

  getUsers() {
    return this.http.get<AdminUser[]>(this.apiUrl);
  }

  getRoles() {
    return this.http.get<string[]>(`${this.apiUrl}/roles`);
  }

  createUser(request: UserCreateRequest) {
    return this.http.post<AdminUser>(this.apiUrl, request);
  }

  updateUser(id: number, request: UserUpdateRequest) {
    return this.http.put<AdminUser>(`${this.apiUrl}/${id}`, request);
  }

  deleteUser(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
