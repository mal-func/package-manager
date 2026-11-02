import { authApi } from "../api";

import type { LoginRequest, RegisterRequest, User } from "../types";

export const authService = {
  async login(credentials: LoginRequest): Promise<User> {
    const { user } = await authApi.login(credentials);
    return user;
  },

  async register(input: RegisterRequest): Promise<User> {
    const { user } = await authApi.register(input);
    return user;
  },

  async getCurrentUser(): Promise<User> {
    const { user } = await authApi.getCurrentUser();
    return user;
  },

  async logout(): Promise<void> {
    await authApi.logout();
  },
};
