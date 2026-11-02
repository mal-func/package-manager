import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { PropsWithChildren, ReactElement } from "react";

vi.mock("@/auth/api", () => ({
  authApi: { getOptions: vi.fn() },
}));

const { authApi } = await import("@/auth/api");

import { AuthContext } from "@/auth/context/AuthContext";
import type { AuthContextValue } from "@/auth/context/AuthContext";
import type { User } from "@/auth/types";

import { publicRoutes } from "./publicRoutes";

function renderAt(path: string, user: User | null, loading = false) {
  const value: AuthContextValue = { user, isAuthenticated: user !== null, loading, login: async () => {}, logout: async () => {} };

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  function Wrapper({ children }: PropsWithChildren): ReactElement {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  const router = createMemoryRouter(
    [...publicRoutes, { path: "/dashboard", element: <p>Dashboard Page</p> }],
    { initialEntries: [path] },
  );

  return render(
    <Wrapper>
      <RouterProvider router={router} />
    </Wrapper>,
  );
}

const user: User = { id: "u1", name: "Test", email: "t@example.com", roles: ["user"], permissions: [] };

beforeEach(() => {
  vi.mocked(authApi.getOptions).mockResolvedValue({ selfRegistration: true });
});

describe("publicRoutes", () => {
  it("root path sends an unauthenticated visitor to the login form", async () => {
    renderAt("/", null);

    expect(await screen.findByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("root path sends an authenticated visitor straight to the dashboard", async () => {
    renderAt("/", user);

    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });

  it("renders the login form at /login for an unauthenticated visitor", async () => {
    renderAt("/login", null);

    expect(await screen.findByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("redirects an already-authenticated visitor away from /login to the dashboard", async () => {
    renderAt("/login", user);

    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });

  it("renders the registration form at /register for an unauthenticated visitor", async () => {
    renderAt("/register", null);

    expect(await screen.findByRole("button", { name: "Create Account" })).toBeInTheDocument();
  });

  it("redirects an already-authenticated visitor away from /register to the dashboard", async () => {
    renderAt("/register", user);

    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });
});
