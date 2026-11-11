import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api";

import { AUTH_QUERY_KEYS } from "../constants";
import { registerSchema, type RegisterFormValues } from "../schemas/registerSchema";
import { authService } from "../services";
import type { User } from "../types";

/**
 * Registration signs the new user straight in (the backend sets session
 * cookies on 201), so on success this stores the user exactly where
 * AuthProvider's login does — RedirectIfAuthenticated then sends them on
 * to the app.
 */
export function useRegister() {
  const queryClient = useQueryClient();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit({ name, email, password }: RegisterFormValues) {
    try {
      const user = await authService.register({ name, email, password });
      queryClient.setQueryData<User>(AUTH_QUERY_KEYS.currentUser, user);
    } catch (error) {
      form.setError("root", {
        message: error instanceof ApiError ? error.message : "Unable to create your account. Please try again.",
      });
    }
  }

  return {
    register: form.register,
    handleSubmit: form.handleSubmit(onSubmit),
    errors: form.formState.errors,
    isSubmitting: form.formState.isSubmitting,
  };
}
