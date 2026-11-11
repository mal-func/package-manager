import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PropsWithChildren, ReactElement } from "react";

import { AuthContext } from "../context/AuthContext";
import type { AuthContextValue } from "../context/AuthContext";
import type { User } from "../types";
import { PermissionGate } from "./PermissionGate";

function renderWithUser(user: User | null, ui: ReactElement) {
  const value: AuthContextValue = { user, isAuthenticated: user !== null, loading: false, login: async () => {}, logout: async () => {} };

  function Wrapper({ children }: PropsWithChildren): ReactElement {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  return render(ui, { wrapper: Wrapper });
}

const permittedUser: User = { id: "u1", name: "Test", email: "t@example.com", roles: ["manager"], permissions: ["users:read"] };

describe("PermissionGate", () => {
  it("renders children when the user has the required permission", () => {
    renderWithUser(
      permittedUser,
      <PermissionGate permission="users:read">
        <p>Gated content</p>
      </PermissionGate>,
    );

    expect(screen.getByText("Gated content")).toBeInTheDocument();
  });

  it("renders nothing (default fallback) when the user lacks the permission", () => {
    renderWithUser(
      permittedUser,
      <PermissionGate permission="roles:manage">
        <p>Gated content</p>
      </PermissionGate>,
    );

    expect(screen.queryByText("Gated content")).not.toBeInTheDocument();
  });

  it("renders the given fallback instead of nothing when denied", () => {
    renderWithUser(
      permittedUser,
      <PermissionGate permission="roles:manage" fallback={<p>No access</p>}>
        <p>Gated content</p>
      </PermissionGate>,
    );

    expect(screen.queryByText("Gated content")).not.toBeInTheDocument();
    expect(screen.getByText("No access")).toBeInTheDocument();
  });

  it("denies (renders nothing) when there is no user at all", () => {
    renderWithUser(
      null,
      <PermissionGate permission="users:read">
        <p>Gated content</p>
      </PermissionGate>,
    );

    expect(screen.queryByText("Gated content")).not.toBeInTheDocument();
  });
});
