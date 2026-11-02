import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().pipe(z.email("Please provide a valid email address.")),
  name: z.string().trim().min(1, "Name is required.").max(255),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().pipe(z.email("Please provide a valid email address.")),
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;
