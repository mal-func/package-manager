import { ForbiddenError, NotFoundError, ValidationError } from "../errors/index.js";
import { toSafeUser, type SafeUser } from "../mappers/user.mapper.js";
import { roleRepository } from "../repositories/role.repository.js";
import { userRepository } from "../repositories/user.repository.js";

export interface UserListResult {
  users: SafeUser[];
  total: number;
}

export const userService = {
  async list(pagination: { limit: number; offset: number }): Promise<UserListResult> {
    const [users, total] = await Promise.all([userRepository.findAll(pagination), userRepository.count()]);

    return { users: users.map(toSafeUser), total };
  },

  /**
   * Replaces a user's roles with exactly `roleNames`. Takes effect on the
   * target's very next request — requireAuth reloads permissions from
   * the database every time, nothing is cached in the access token.
   */
  async setRoles(actorId: string, targetId: string, roleNames: string[]): Promise<SafeUser> {
    // Nobody edits their own roles: an admin can't accidentally remove
    // their own roles:manage (so the last admin can never lock everyone
    // out), and nobody can escalate themselves.
    if (actorId === targetId) {
      throw new ForbiddenError("You can't change your own roles. Ask another administrator.");
    }

    const target = await userRepository.findById(targetId);

    if (!target) {
      throw new NotFoundError("User not found.");
    }

    const roles = await roleRepository.findByNames(roleNames);

    if (roles.length !== roleNames.length) {
      const known = new Set(roles.map((role) => role.name));
      const unknown = roleNames.filter((name) => !known.has(name));
      throw new ValidationError(`Unknown role(s): ${unknown.join(", ")}.`);
    }

    await userRepository.replaceRoles(
      targetId,
      roles.map((role) => role.id),
    );

    const updated = await userRepository.findById(targetId);

    if (!updated) {
      throw new NotFoundError("User not found.");
    }

    return toSafeUser(updated);
  },
};
