/**
 * Login request payload.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Self-registration payload — always creates a plain "user" account;
 * roles are granted afterwards by someone with roles:manage.
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/** Public (pre-login) auth settings from GET /auth/options. */
export interface AuthOptions {
  selfRegistration: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

/**
 * Shape returned by /auth/login, /auth/refresh, and /auth/me. Tokens
 * are never present here — they travel exclusively as httpOnly cookies
 * set by the server, never as JSON the frontend could read or store.
 */
export interface AuthResponse {
  user: User;
}
