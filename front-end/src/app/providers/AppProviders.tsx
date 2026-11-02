import type { ReactNode } from "react";

import { QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "@/auth/context";
import { ThemeProvider } from "@/app/shell/theme";

import { queryClient } from "./queryClient";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({
  children,
}: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
