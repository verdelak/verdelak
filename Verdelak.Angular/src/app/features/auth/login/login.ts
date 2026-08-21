import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html'
})
export class Login implements OnInit {
  readonly username = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.redirectAfterLogin();
    }
  }

  submit(): void {
    const username = this.username().trim();
    const password = this.password();

    if (!username || !password) {
      this.error.set('Username and password are required.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.login({ username, password }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: () => {
        this.redirectAfterLogin();
      },
      error: err => this.error.set(this.loginErrorMessage(err))
    });
  }

  private redirectAfterLogin(): void {
    const redirectUrl = this.getRedirectUrl();

    void this.router.navigateByUrl(redirectUrl, { replaceUrl: true });
    setTimeout(() => globalThis.location.replace(redirectUrl), 0);
  }

  private getRedirectUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('/login')) {
      return '/';
    }

    return returnUrl;
  }

  private loginErrorMessage(err: { status?: number; error?: unknown; message?: string }): string {
    if (err.status === 0) {
      return 'Could not reach the API. Make sure Verdelak.Api is running on http://localhost:5286.';
    }

    if (err.status === 401) {
      return 'Invalid username or password.';
    }

    if (typeof err.error === 'string') {
      return err.error;
    }

    return err.message ?? 'Login failed. Please try again.';
  }
}

