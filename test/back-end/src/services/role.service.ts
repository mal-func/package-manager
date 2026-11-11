import { roleRepository } from "../repositories/role.repository.js";

export interface RoleSummary {
  name: string;
  description: string | null;
  permissions: string[];
}

export const roleService = {
  /** Every assignable role, with the permission keys it grants — what a role picker needs to show. */
  async list(): Promise<RoleSummary[]> {
    const roles = await roleRepository.findAll();

    return roles.map((role) => ({
      name: role.name,
      description: role.description,
      permissions: role.permissions.map((rolePermission) => rolePermission.permission.key),
    }));
  },
};
