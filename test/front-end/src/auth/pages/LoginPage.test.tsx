import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import { AuthContext, type AuthContextValue } from "../context/AuthContext";

vi.mock("../api", () => ({
  authApi: { getOptions: vi.fn() },
}));

const { authApi } = await import("../api");
const { default: LoginPage } = await import("./LoginPage");

function renderPage() {
  const auth: AuthContextValue = { user: null, isAuthenticated: false, loading: false, login: vi.fn(), logout: vi.fn() };
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("offers a link to create an account when self-registration is on", async () => {
    vi.mocked(authApi.getOptions).mockResolvedValue({ selfRegistration: true });
    renderPage();

    expect(await screen.findByRole("link", { name: "Create one" })).toHaveAttribute("href", "/register");
  });

  it("offers no sign-up link when self-registration is off", async () => {
    vi.mocked(authApi.getOptions).mockResolvedValue({ selfRegistration: false });
    renderPage();

    await vi.waitFor(() => { expect(authApi.getOptions).toHaveBeenCalled(); });
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Create one" })).not.toBeInTheDocument();
  });
});
