import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PropsWithChildren, ReactElement } from "react";

import { AuthContext } from "@/auth/context/AuthContext";
import type { AuthContextValue } from "@/auth/context/AuthContext";
import type { User } from "@/auth/types";

import SettingsPage from "./SettingsPage";

function renderWithUser(user: User | null) {
  const value: AuthContextValue = { user, isAuthenticated: user !== null, loading: false, login: async () => {}, logout: async () => {} };
  function Wrapper({ children }: PropsWithChildren): ReactElement {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }
  return render(<SettingsPage />, { wrapper: Wrapper });
}

describe("SettingsPage", () => {
  it("renders nothing when there is no authenticated user", () => {
    const { container } = renderWithUser(null);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the user's name, email, and id", () => {
    renderWithUser({ id: "u1", name: "Jane Doe", email: "jane@example.com", roles: ["manager"], permissions: [] });

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("u1")).toBeInTheDocument();
  });

  it("shows each role, capitalized", () => {
    renderWithUser({ id: "u1", name: "Jane", email: "j@example.com", roles: ["manager", "user"], permissions: [] });

    expect(screen.getByText("Manager")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
  });

  it("lists every granted permission", () => {
    renderWithUser({ id: "u1", name: "Jane", email: "j@example.com", roles: ["manager"], permissions: ["users:read", "roles:manage"] });

    expect(screen.getByText("users:read")).toBeInTheDocument();
    expect(screen.getByText("roles:manage")).toBeInTheDocument();
  });

  it("shows a message instead of a list when there are no permissions", () => {
    renderWithUser({ id: "u1", name: "Jane", email: "j@example.com", roles: ["user"], permissions: [] });

    expect(screen.getByText("No additional permissions granted.")).toBeInTheDocument();
  });
});
