export interface AdminUser {
  id: number;
  username: string;
  role: string;
}

export interface UserCreateRequest {
  username: string;
  password: string;
  role: string;
}

export interface UserUpdateRequest {
  username: string;
  password?: string | null;
  role: string;
}
