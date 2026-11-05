import { apiClient, type Pagination } from "@/api";
import type { User } from "@/auth";

export interface ListUsersParams {
  limit: number;
  offset: number;
}

/** An assignable role, as returned by GET /roles (needs roles:manage). */
export interface Role {
  name: string;
  description: string | null;
  permissions: string[];
}

export const userApi = {
  list({ limit, offset }: ListUsersParams): Promise<{ users: User[]; pagination: Pagination }> {
    return apiClient.get<{ users: User[]; pagination: Pagination }>("/users", { limit, offset });
  },

  listRoles(): Promise<{ roles: Role[] }> {
    return apiClient.get<{ roles: Role[] }>("/roles");
  },

  /** Replaces the user's roles with exactly `roles`. CSRF header is added by the client's interceptor. */
  setRoles(userId: string, roles: string[]): Promise<{ user: User }> {
    return apiClient.put<{ user: User }>(`/users/${encodeURIComponent(userId)}/roles`, { roles });
  },
};
