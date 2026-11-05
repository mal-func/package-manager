import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

/**
 * AppRouter.tsx creates its router (createBrowserRouter) once, at
 * module load, reading the current browser location — so each test
 * needs a fresh module import after positioning window.history first.
 * This only covers the two auth-independent status routes (catch-all
 * 404, /forbidden); "/" and protected paths are exercised in
 * publicRoutes.test.tsx / protectedRoutes.test.tsx against a real
 * (fake) AuthContext instead of the full AuthProvider AppRouter alone
 * doesn't supply.
 */
async function renderAppRouterAt(path: string) {
  window.history.pushState({}, "", path);
  vi.resetModules();
  const { default: AppRouter } = await import("./AppRouter");
  return render(<AppRouter />);
}

afterEach(() => {
  window.history.pushState({}, "", "/");
});

describe("AppRouter", () => {
  it("renders the 404 page for a completely unmatched path", async () => {
    await renderAppRouterAt("/this-route-does-not-exist");

    expect(await screen.findByRole("heading", { name: "404 - Page Not Found" })).toBeInTheDocument();
  });

  it("renders the 403 page at /forbidden regardless of auth state", async () => {
    await renderAppRouterAt("/forbidden");

    expect(await screen.findByRole("heading", { name: "403 - Access Denied" })).toBeInTheDocument();
  });
});
