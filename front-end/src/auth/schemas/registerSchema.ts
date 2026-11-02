import { z } from "zod";

/**
 * Mirrors the backend's registerSchema (back-end/src/data-transfer-object/
 * auth.dto.ts) so most mistakes are caught before a round-trip — the
 * backend still validates independently. confirmPassword is UI-only and
 * never sent.
 */
export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Please enter your name.").max(255, "Name is too long."),
    email: z.string().trim().pipe(z.email("Please enter a valid email address.")),
    password: z.string().min(8, "Password must contain at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
