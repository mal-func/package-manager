import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import { ApiError } from "@/api";

import { AUTH_QUERY_KEYS } from "../constants";

vi.mock("../api", () => ({
  authApi: { getOptions: vi.fn(), register: vi.fn() },
}));

const { authApi } = await import("../api");
const { default: RegisterPage } = await import("./RegisterPage");

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return queryClient;
}

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Full name"), "Jane Doe");
  await user.type(screen.getByLabelText("Email address"), "jane@example.com");
  await user.type(screen.getByLabelText("Password"), "long-enough");
  await user.type(screen.getByLabelText("Confirm password"), "long-enough");
  await user.click(screen.getByRole("button", { name: "Create Account" }));
}

const newUser = { id: "u9", name: "Jane Doe", email: "jane@example.com", roles: ["user"], permissions: [] };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authApi.getOptions).mockResolvedValue({ selfRegistration: true });
});

describe("RegisterPage", () => {
  it("creates the account (without sending confirmPassword) and signs the user straight in", async () => {
    vi.mocked(authApi.register).mockResolvedValue({ user: newUser });
    const queryClient = renderPage();

    await fillAndSubmit();

    expect(authApi.register).toHaveBeenCalledWith({ name: "Jane Doe", email: "jane@example.com", password: "long-enough" });
    // Stored exactly where AuthProvider keeps the session user.
    await vi.waitFor(() => { expect(queryClient.getQueryData(AUTH_QUERY_KEYS.currentUser)).toEqual(newUser); });
  });

  it("shows the server's message when registration is refused (e.g. duplicate email)", async () => {
    vi.mocked(authApi.register).mockRejectedValue(new ApiError("An account with this email already exists.", "CONFLICT", 409));
    renderPage();

    await fillAndSubmit();

    expect(await screen.findByText("An account with this email already exists.")).toBeInTheDocument();
  });

  it("falls back to a generic message for a non-API failure", async () => {
    vi.mocked(authApi.register).mockRejectedValue(new Error("boom"));
    renderPage();

    await fillAndSubmit();

    expect(await screen.findByText("Unable to create your account. Please try again.")).toBeInTheDocument();
  });

  it("validates before calling the API", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Please enter your name.")).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it("says sign-up is off instead of showing a form the server would refuse", async () => {
    vi.mocked(authApi.getOptions).mockResolvedValue({ selfRegistration: false });
    renderPage();

    expect(await screen.findByText("Sign-up is turned off")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Account" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });
});
