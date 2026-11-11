import { z } from "zod";

export const setUserRolesSchema = z.object({
  roles: z
    .array(z.string().trim().min(1, "Role names can't be empty."))
    .min(1, "A user must keep at least one role.")
    .max(50)
    // Duplicates are harmless intent ("admin, admin"), not an error —
    // collapse them so the service compares like with like.
    .transform((names) => Array.from(new Set(names))),
});

export type SetUserRolesInput = z.infer<typeof setUserRolesSchema>;
