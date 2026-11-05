import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { PropsWithChildren, ReactElement } from "react";

import { AuthContext } from "@/auth/context/AuthContext";
import type { AuthContextValue } from "@/auth/context/AuthContext";
import type { User } from "@/auth/types";
import { ThemeProvider } from "@/app/shell/theme";

// The pages behind these routes (Dashboard, Users) fetch their own data
// via react-query — mocked here so this stays a route-wiring test, not
// a real network call against whatever backend happens to be running.
vi.mock("@/features/dashboard/api/geoDataApi", () => ({
  geoDataApi: {
    listIndiaDistricts: vi.fn().mockResolvedValue({ type: "FeatureCollection", features: [] }),
    listIndiaMask: vi.fn().mockResolvedValue({ type: "FeatureCollection", features: [] }),
    listStateMetrics: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/features/users/api/userApi", () => ({
  userApi: { list: vi.fn().mockResolvedValue({ users: [], pagination: { limit: 20, offset: 0, total: 0 } }) },
}));

const { protectedRoutes } = await import("./protectedRoutes");

function renderAt(path: string, user: User | null) {
  const value: AuthContextValue = { user, isAuthenticated: user !== null, loading: false, login: async () => {}, logout: async () => {} };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  function Wrapper({ children }: PropsWithChildren): ReactElement {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  const router = createMemoryRouter(
    [...protectedRoutes, { path: "/login", element: <p>Login Page</p> }, { path: "/forbidden", element: <p>Forbidden Page</p> }],
    { initialEntries: [path] },
  );

  return render(
    <Wrapper>
      <RouterProvider router={router} />
    </Wrapper>,
  );
}

const plainUser: User = { id: "u1", name: "Test", email: "t@example.com", roles: ["user"], permissions: [] };
const managerUser: User = { id: "u2", name: "Manager", email: "m@example.com", roles: ["manager"], permissions: ["users:read"] };

describe("protectedRoutes", () => {
  it("redirects an unauthenticated visitor away from a protected route to /login", async () => {
    renderAt("/dashboard", null);

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("lets any authenticated user reach a module with no permission requirement (dashboard)", async () => {
    renderAt("/dashboard", plainUser);

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("blocks a permission-gated module (users) for an authenticated user who lacks the permission", async () => {
    renderAt("/users", plainUser);

    expect(await screen.findByText("Forbidden Page")).toBeInTheDocument();
  });

  it("allows a permission-gated module (users) for a user who has the required permission", async () => {
    renderAt("/users", managerUser);

    expect(await screen.findByRole("heading", { name: "Users" })).toBeInTheDocument();
  });
});
