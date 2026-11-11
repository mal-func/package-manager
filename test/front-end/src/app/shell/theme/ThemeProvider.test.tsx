import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeProvider } from "./ThemeProvider";
import { useTheme } from "./useTheme";

const STORAGE_KEY = "cdis-shell-theme";

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("ThemeProvider", () => {
  it("defaults to dark when nothing is stored", () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("reads a previously stored theme instead of defaulting", () => {
    window.localStorage.setItem(STORAGE_KEY, "light");

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-value")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("ignores a corrupted/unrecognized stored value and falls back to dark", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-a-real-theme");

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
  });

  it("toggling flips the theme, updates the <html> class, and persists to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "toggle" }));

    expect(screen.getByTestId("theme-value")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("light");

    await user.click(screen.getByRole("button", { name: "toggle" }));

    expect(screen.getByTestId("theme-value")).toHaveTextContent("dark");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });
});

describe("useTheme outside a ThemeProvider", () => {
  it("throws a descriptive error", () => {
    // Suppress the expected React error-boundary console noise for this one case.
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<ThemeProbe />)).toThrow("useTheme must be used within a ThemeProvider");

    consoleSpy.mockRestore();
  });
});
