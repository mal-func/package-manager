import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { PropsWithChildren, ReactElement } from "react";

import { AuthContext } from "../context/AuthContext";
import type { AuthContextValue } from "../context/AuthContext";
import { RedirectIfAuthenticated } from "./RedirectIfAuthenticated";

function renderWithAuth(value: AuthContextValue) {
  function AuthWrapper({ children }: PropsWithChildren): ReactElement {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  const router = createMemoryRouter(
    [
      { path: "/dashboard", element: <p>Dashboard Page</p> },
      {
        element: <RedirectIfAuthenticated />,
        children: [{ path: "/login", element: <p>Login Page</p> }],
      },
    ],
    { initialEntries: ["/login"] },
  );

  return render(
    <AuthWrapper>
      <RouterProvider router={router} />
    </AuthWrapper>,
  );
}

describe("RedirectIfAuthenticated", () => {
  it("renders nothing while the session-restore check is loading", () => {
    renderWithAuth({ user: null, isAuthenticated: false, loading: true, login: async () => {}, logout: async () => {} });

    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
    expect(screen.queryByText("Dashboard Page")).not.toBeInTheDocument();
  });

  it("renders the public route (login form) when not authenticated", async () => {
    renderWithAuth({ user: null, isAuthenticated: false, loading: false, login: async () => {}, logout: async () => {} });

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("redirects an already-authenticated visitor away from /login to /dashboard", async () => {
    renderWithAuth({
      user: { id: "u1", name: "Test", email: "test@example.com", roles: ["user"], permissions: [] },
      isAuthenticated: true,
      loading: false,
      login: async () => {},
      logout: async () => {},
    });

    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });
});
