import { apiClient } from "@/api";

import type { AuthOptions, AuthResponse, LoginRequest, RegisterRequest } from "../types";

export const authApi = {
  login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/login", credentials);
  },

  register(input: RegisterRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/register", input);
  },

  getOptions(): Promise<AuthOptions> {
    return apiClient.get<AuthOptions>("/auth/options");
  },

  refresh(): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>("/auth/refresh");
  },

  getCurrentUser(): Promise<AuthResponse> {
    return apiClient.get<AuthResponse>("/auth/me");
  },

  logout(): Promise<void> {
    return apiClient.post<void>("/auth/logout");
  },
};
