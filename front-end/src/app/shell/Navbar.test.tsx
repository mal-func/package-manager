import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { AuthContext, type AuthContextValue } from "@/auth/context/AuthContext";
import { ThemeProvider } from "./theme/ThemeProvider";

import Navbar from "./Navbar";

function renderNavbar(onMenuClick = vi.fn()) {
  const value: AuthContextValue = {
    user: null,
    isAuthenticated: false,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  };

  const utils = render(
    <MemoryRouter>
      <AuthContext.Provider value={value}>
        <ThemeProvider>
          <Navbar onMenuClick={onMenuClick} />
        </ThemeProvider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );

  return { ...utils, onMenuClick };
}

describe("Navbar", () => {
  it("calls onMenuClick when the mobile menu button is pressed", async () => {
    const user = userEvent.setup();
    const { onMenuClick } = renderNavbar();

    await user.click(screen.getByRole("button", { name: "Open navigation menu" }));

    expect(onMenuClick).toHaveBeenCalledOnce();
  });

  it("renders the search input, notifications button, and theme toggle", () => {
    renderNavbar();

    expect(screen.getByRole("searchbox", { name: "Search navigation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });

  it("toggling the theme button flips its own accessible label", async () => {
    const user = userEvent.setup();
    renderNavbar();

    await user.click(screen.getByRole("button", { name: "Switch to light theme" }));

    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeInTheDocument();
  });
});
