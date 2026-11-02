import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/auth/services", () => ({
  authService: {
    login: vi.fn(),
    getCurrentUser: vi.fn().mockRejectedValue(Object.assign(new Error("no session"), { statusCode: 401 })),
    logout: vi.fn(),
  },
}));

afterEach(() => {
  window.history.pushState({}, "", "/");
});

describe("App", () => {
  it("boots the full provider + router stack and renders something real (the login page, unauthenticated)", async () => {
    window.history.pushState({}, "", "/");
    vi.resetModules();
    const { default: App } = await import("./App");

    render(<App />);

    expect(await screen.findByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });
});
