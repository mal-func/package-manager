import type { userRepository } from "../repositories/user.repository.js";

export type UserWithRoles = NonNullable<Awaited<ReturnType<typeof userRepository.findByEmail>>>;

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

/**
 * Strips passwordHash and flattens the roles→permissions join structure
 * into the shape every consumer (auth responses, user listings,
 * authorization guards) actually wants.
 */
export function toSafeUser(user: UserWithRoles): SafeUser {
  const roles = user.roles.map((userRole) => userRole.role.name);
  const permissions = Array.from(
    new Set(user.roles.flatMap((userRole) => userRole.role.permissions.map((rp) => rp.permission.key))),
  );

  return { id: user.id, email: user.email, name: user.name, roles, permissions };
}
