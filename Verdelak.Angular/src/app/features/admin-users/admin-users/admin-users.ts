import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CsvDownloadService } from '../../../shared/services/csv-download.service';
import { AdminUsersService } from '../admin-users.service';
import { AdminUser } from '../models/admin-user.models';

interface UserForm {
  id: number | null;
  username: string;
  password: string;
  role: string;
}

interface RoleSummary {
  role: string;
  count: number;
  description: string;
}

interface RolePermission {
  role: string;
  access: string;
}

@Component({
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss'
})
export class AdminUsers implements OnInit {
  private readonly csvDownload = inject(CsvDownloadService);

  readonly roleDescriptions: Record<string, string> = {
    Admin: 'Full access, including settings and user administration.',
    Contributor: 'Can add and edit collection data, but cannot access admin-only settings.',
    User: 'Can view the app and add reviews where supported.',
    Viewer: 'View-only access.'
  };
  readonly rolePermissions: RolePermission[] = [
    { role: 'Viewer', access: 'View-only' },
    { role: 'User', access: 'View plus reviews where supported' },
    { role: 'Contributor', access: 'Everything except admin areas' },
    { role: 'Admin', access: 'Full access, including user and settings management' }
  ];
  readonly users = signal<AdminUser[]>([]);
  readonly roles = signal<string[]>(['Admin', 'Contributor', 'User', 'Viewer']);
  readonly selectedUserId = signal<number | null>(null);
  readonly form = signal<UserForm>({
    id: null,
    username: '',
    password: '',
    role: 'Viewer'
  });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);

  readonly adminCount = computed(() => this.users().filter(user => user.role === 'Admin').length);
  readonly contributorCount = computed(() => this.users().filter(user => user.role === 'Contributor').length);
  readonly userCount = computed(() => this.users().filter(user => user.role === 'User').length);
  readonly viewerCount = computed(() => this.users().filter(user => user.role === 'Viewer').length);
  readonly isEditing = computed(() => this.form().id !== null);
  readonly roleSummaries = computed<RoleSummary[]>(() => this.roles().map(role => ({
    role,
    count: this.users().filter(user => user.role === role).length,
    description: this.roleDescriptions[role] ?? 'Custom role'
  })));
  readonly identityWarnings = computed(() => {
    const warnings: string[] = [];
    if (this.adminCount() === 0) {
      warnings.push('No Admin account exists. At least one Admin is required.');
    }
    if (this.adminCount() === 1) {
      warnings.push('Only one Admin account exists. The API will block deleting or demoting the last Admin.');
    }
    if (this.users().some(user => !this.roles().includes(user.role))) {
      warnings.push('One or more users has a role outside the configured role list.');
    }
    return warnings;
  });
  readonly canDeleteSelected = computed(() => {
    const selected = this.users().find(user => user.id === this.form().id);
    return !!selected && !(selected.role === 'Admin' && this.adminCount() <= 1);
  });
  readonly isDemotingOnlyAdmin = computed(() => {
    const selected = this.users().find(user => user.id === this.form().id);
    return !!selected && selected.role === 'Admin' && this.adminCount() <= 1 && this.form().role !== 'Admin';
  });

  constructor(private readonly service: AdminUsersService) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getUsers().subscribe({
      next: users => this.users.set(users),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load users.'),
      complete: () => this.loading.set(false)
    });
  }

  loadRoles(): void {
    this.service.getRoles().subscribe({
      next: roles => this.roles.set(roles),
      error: () => this.roles.set(['Admin', 'Contributor', 'User', 'Viewer'])
    });
  }

  selectUser(user: AdminUser): void {
    this.selectedUserId.set(user.id);
    this.message.set(null);
    this.error.set(null);
    this.form.set({
      id: user.id,
      username: user.username,
      password: '',
      role: user.role
    });
  }

  startNew(): void {
    this.selectedUserId.set(null);
    this.message.set(null);
    this.error.set(null);
    this.form.set({
      id: null,
      username: '',
      password: '',
      role: this.roles()[0] ?? 'Viewer'
    });
  }

  setFormField<K extends keyof UserForm>(field: K, value: UserForm[K]): void {
    this.form.set({ ...this.form(), [field]: value });
  }

  save(): void {
    const form = this.form();
    const username = form.username.trim();
    const password = form.password.trim();

    if (!username) {
      this.error.set('Username is required.');
      return;
    }

    if (!form.id && !password) {
      this.error.set('Password is required for a new user.');
      return;
    }

    if (this.isDemotingOnlyAdmin()) {
      this.error.set('At least one Admin account is required.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    const request = form.id
      ? this.service.updateUser(form.id, {
          username,
          password: password || null,
          role: form.role
        })
      : this.service.createUser({
          username,
          password,
          role: form.role
        });

    request.subscribe({
      next: saved => {
        this.message.set(`${saved.username} saved.`);
        this.selectedUserId.set(saved.id);
        this.form.set({ id: saved.id, username: saved.username, password: '', role: saved.role });
        this.loadUsers();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to save user.'),
      complete: () => this.loading.set(false)
    });
  }

  deleteSelected(): void {
    const form = this.form();

    if (!form.id) {
      return;
    }

    if (!this.canDeleteSelected()) {
      this.error.set('At least one Admin account is required.');
      return;
    }

    const confirmed = window.confirm(`Delete ${form.username}?`);

    if (!confirmed) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.deleteUser(form.id).subscribe({
      next: () => {
        this.message.set(`${form.username} deleted.`);
        this.startNew();
        this.loadUsers();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to delete user.'),
      complete: () => this.loading.set(false)
    });
  }

  exportIdentityAuditCsv(): void {
    const generatedAt = new Date().toLocaleString();
    const rows: Array<Array<string | number>> = [
      ['Section', 'Role', 'Count', 'Access or description', 'Username', 'Generated at', 'Warning'],
      ['Metadata', '', '', 'Identity / Authorization admin audit', '', generatedAt, ''],
      ...this.roleSummaries().map(summary => [
        'Role Summary',
        summary.role,
        summary.count,
        summary.description,
        '',
        '',
        ''
      ]),
      ...this.rolePermissions.map(permission => [
        'Permission Matrix',
        permission.role,
        '',
        permission.access,
        '',
        '',
        ''
      ]),
      ...this.identityWarnings().map(warning => ['Warning', '', '', '', '', '', warning]),
      ...this.users()
        .slice()
        .sort((a, b) => a.role.localeCompare(b.role) || a.username.localeCompare(b.username))
        .map(user => ['User', user.role, '', '', user.username, '', ''])
    ];

    this.downloadCsv(`identity-role-audit-${this.csvDateStamp()}.csv`, rows);
  }

  private downloadCsv(filename: string, rows: Array<Array<string | number>>): void {
    this.csvDownload.download(filename, rows);
  }

  private csvDateStamp(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
