import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import { AuthContext, type AuthContextValue } from "@/auth/context/AuthContext";
import type { User } from "@/auth/types";

import NavSearch from "./NavSearch";

function renderWithUser(user: User | null) {
  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <AuthContext.Provider value={value}>
        <Routes>
          <Route path="*" element={<NavSearch />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

const baseUser: User = { id: "u1", name: "Jane", email: "jane@example.com", roles: ["user"], permissions: [] };

describe("NavSearch", () => {
  it("shows no results before anything is typed", () => {
    renderWithUser(baseUser);

    expect(screen.queryByText("Graphs")).not.toBeInTheDocument();
  });

  it("filters navigation items by the typed query, case-insensitively", async () => {
    const user = userEvent.setup();
    renderWithUser(baseUser);

    await user.type(screen.getByRole("searchbox", { name: "Search navigation" }), "GRAPH");

    expect(await screen.findByRole("button", { name: "Graphs" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dashboard" })).not.toBeInTheDocument();
  });

  it("shows nothing for a query that matches no navigation item", async () => {
    const user = userEvent.setup();
    renderWithUser(baseUser);

    await user.type(screen.getByRole("searchbox", { name: "Search navigation" }), "zzz-nonexistent");

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("selecting a result clears the query and navigates", async () => {
    const user = userEvent.setup();
    renderWithUser(baseUser);

    const input = screen.getByRole("searchbox", { name: "Search navigation" });
    await user.type(input, "Table");
    await user.click(await screen.findByRole("button", { name: "Table" }));

    expect(input).toHaveValue("");
  });

  it("Ctrl+K focuses the search input from anywhere on the page", async () => {
    const user = userEvent.setup();
    renderWithUser(baseUser);

    const input = screen.getByRole("searchbox", { name: "Search navigation" });
    expect(input).not.toHaveFocus();

    await user.keyboard("{Control>}k{/Control}");

    expect(input).toHaveFocus();
  });
});
