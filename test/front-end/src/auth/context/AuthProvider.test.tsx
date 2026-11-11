import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ApiError } from "@/api";

vi.mock("../services", () => ({
  authService: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  },
}));

const { authService } = await import("../services");
const { AuthProvider } = await import("./AuthProvider");
const { useAuth } = await import("./useAuth");
const { SESSION_EXPIRED_EVENT } = await import("../constants");

const user = { id: "u1", name: "Test User", email: "t@example.com", roles: ["user"], permissions: [] };

function Consumer() {
  const { user: current, isAuthenticated, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user-name">{current?.name ?? "none"}</span>
      <button onClick={() => { void login({ email: "t@example.com", password: "pw" }); }}>login</button>
      <button onClick={() => { void logout(); }}>logout</button>
    </div>
  );
}

function renderProvider() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AuthProvider — initial session restore", () => {
  it("starts loading, then restores the session when getCurrentUser succeeds", async () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue(user);
    renderProvider();

    expect(screen.getByTestId("loading")).toHaveTextContent("true");

    await waitFor(() => { expect(screen.getByTestId("loading")).toHaveTextContent("false"); });
    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
  });

  it("treats a 401 as simply 'not logged in' — no warning logged", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(authService.getCurrentUser).mockRejectedValue(new ApiError("Auth required.", "UNAUTHORIZED", 401));

    renderProvider();

    await waitFor(() => { expect(screen.getByTestId("loading")).toHaveTextContent("false"); });
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("logs a warning for an unexpected session-restore failure (not a 401)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(authService.getCurrentUser).mockRejectedValue(new ApiError("Server error.", "INTERNAL_ERROR", 500));

    renderProvider();

    await waitFor(() => { expect(warnSpy).toHaveBeenCalled(); });
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
  });
});

describe("AuthProvider — login/logout", () => {
  it("login sets the user immediately from the response, without a follow-up /me refetch", async () => {
    const user_ = userEvent.setup();
    vi.mocked(authService.getCurrentUser).mockRejectedValue(new ApiError("Auth required.", "UNAUTHORIZED", 401));
    vi.mocked(authService.login).mockResolvedValue(user);
    renderProvider();

    await waitFor(() => { expect(screen.getByTestId("loading")).toHaveTextContent("false"); });

    await user_.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => { expect(screen.getByTestId("authenticated")).toHaveTextContent("true"); });
    expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
    expect(authService.getCurrentUser).toHaveBeenCalledOnce();
  });

  it("logout clears the user", async () => {
    const user_ = userEvent.setup();
    vi.mocked(authService.getCurrentUser).mockResolvedValue(user);
    vi.mocked(authService.logout).mockResolvedValue(undefined);
    renderProvider();

    await waitFor(() => { expect(screen.getByTestId("authenticated")).toHaveTextContent("true"); });

    await user_.click(screen.getByRole("button", { name: "logout" }));

    await waitFor(() => { expect(screen.getByTestId("authenticated")).toHaveTextContent("false"); });
    expect(screen.getByTestId("user-name")).toHaveTextContent("none");
  });
});

describe("AuthProvider — SESSION_EXPIRED_EVENT", () => {
  it("clears the user when the session-expired event fires", async () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue(user);
    renderProvider();

    await waitFor(() => { expect(screen.getByTestId("authenticated")).toHaveTextContent("true"); });

    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));

    await waitFor(() => { expect(screen.getByTestId("authenticated")).toHaveTextContent("false"); });
  });
});
