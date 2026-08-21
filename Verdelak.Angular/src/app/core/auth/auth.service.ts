import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environments';
import { AuthUser, LoginRequest, LoginResponse } from './auth.models';

const tokenKey = 'verdelak.auth.token';
const userKey = 'verdelak.auth.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSignal = signal<AuthUser | null>(this.loadUser());

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.getToken() && !!this.userSignal());
  readonly isAdmin = computed(() => this.userSignal()?.role === 'Admin');

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  login(request: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/Auth/login`, request).pipe(
      tap(response => {
        const user: AuthUser = {
          username: response.username,
          role: response.role
        };

        localStorage.setItem(tokenKey, response.token);
        localStorage.setItem(userKey, JSON.stringify(user));
        this.userSignal.set(user);
      })
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  clearSession(): void {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    this.userSignal.set(null);
  }

  getToken(): string | null {
    const token = localStorage.getItem(tokenKey);

    if (!token) {
      return null;
    }

    if (this.isTokenExpired(token)) {
      this.clearSession();
      return null;
    }

    return token;
  }

  hasRole(role: string): boolean {
    return this.userSignal()?.role === role;
  }

  private loadUser(): AuthUser | null {
    const token = localStorage.getItem(tokenKey);
    if (!token || this.isTokenExpired(token)) {
      this.clearStoredAuth();
      return null;
    }

    const raw = localStorage.getItem(userKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      localStorage.removeItem(userKey);
      localStorage.removeItem(tokenKey);
      return null;
    }
  }

  private clearStoredAuth(): void {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
  }

  private isTokenExpired(token: string): boolean {
    const [, payload] = token.split('.');

    if (!payload) {
      return true;
    }

    try {
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + (4 - normalizedPayload.length % 4) % 4, '=');
      const decoded = JSON.parse(atob(paddedPayload)) as { exp?: number };
      return !decoded.exp || decoded.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }
}

