import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AuthContext, type AuthContextValue } from "@/auth/context/AuthContext";
import type { User } from "@/auth/types";

import ProfileMenu from "./ProfileMenu";

function renderWithUser(user: User | null, overrides: Partial<AuthContextValue> = {}) {
  const logout = vi.fn().mockResolvedValue(undefined);
  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    loading: false,
    login: vi.fn(),
    logout,
    ...overrides,
  };

  const utils = render(
    <MemoryRouter>
      <AuthContext.Provider value={value}>
        <ProfileMenu />
      </AuthContext.Provider>
    </MemoryRouter>,
  );

  return { ...utils, logout };
}

const baseUser: User = {
  id: "u1",
  name: "Jane Doe",
  email: "jane@example.com",
  roles: ["manager"],
  permissions: ["users:read"],
};

describe("ProfileMenu", () => {
  it("renders nothing when there is no authenticated user", () => {
    const { container } = renderWithUser(null);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the user's initials, name, and capitalized primary role", () => {
    renderWithUser(baseUser);

    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
  });

  it("omits the role line when the user has no roles", () => {
    renderWithUser({ ...baseUser, roles: [] });

    expect(screen.queryByText("Manager")).not.toBeInTheDocument();
  });

  it("shows the user's name and email inside the opened menu", async () => {
    const user = userEvent.setup();
    renderWithUser(baseUser);

    await user.click(screen.getByRole("button", { name: "Account menu" }));

    expect(await screen.findByText("jane@example.com")).toBeInTheDocument();
  });

  it("calls logout when 'Log out' is selected", async () => {
    const user = userEvent.setup();
    const { logout } = renderWithUser(baseUser);

    await user.click(screen.getByRole("button", { name: "Account menu" }));
    await user.click(await screen.findByText("Log out"));

    expect(logout).toHaveBeenCalledOnce();
  });

  it("links to Users for someone with users:read", async () => {
    const user = userEvent.setup();
    renderWithUser(baseUser);

    await user.click(screen.getByRole("button", { name: "Account menu" }));

    expect(await screen.findByRole("menuitem", { name: "Users" })).toBeInTheDocument();
  });

  it("hides the Users link from someone without users:read (the route would just send them to /forbidden)", async () => {
    const user = userEvent.setup();
    renderWithUser({ ...baseUser, roles: ["user"], permissions: [] });

    await user.click(screen.getByRole("button", { name: "Account menu" }));

    await screen.findByRole("menuitem", { name: "Settings" });
    expect(screen.queryByRole("menuitem", { name: "Users" })).not.toBeInTheDocument();
  });

  it.each([
    ["Users", "Users Route"],
    ["Settings", "Settings Route"],
  ])("navigates when '%s' is selected", async (item, landing) => {
    const user = userEvent.setup();
    const value: AuthContextValue = {
      user: baseUser,
      isAuthenticated: true,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
    };
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AuthContext.Provider value={value}>
          <ProfileMenu />
          <Routes>
            <Route path="/dashboard" element={null} />
            <Route path="/users" element={<p>Users Route</p>} />
            <Route path="/settings" element={<p>Settings Route</p>} />
          </Routes>
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Account menu" }));
    await user.click(await screen.findByRole("menuitem", { name: item }));

    expect(await screen.findByText(landing)).toBeInTheDocument();
  });
});
