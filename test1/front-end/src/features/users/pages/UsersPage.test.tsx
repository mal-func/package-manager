import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren, ReactElement } from "react";

import { AuthContext, type AuthContextValue } from "@/auth/context/AuthContext";
import type { User } from "@/auth/types";

vi.mock("../api/userApi", () => ({
  userApi: { list: vi.fn(), listRoles: vi.fn(), setRoles: vi.fn() },
}));

const { userApi } = await import("../api/userApi");
const { default: UsersPage } = await import("./UsersPage");

const manager: User = { id: "viewer", name: "Viewer", email: "v@example.com", roles: ["manager"], permissions: ["users:read"] };
const admin: User = { ...manager, roles: ["admin"], permissions: ["users:read", "roles:manage"] };

function renderPage(viewer: User = manager) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const auth: AuthContextValue = { user: viewer, isAuthenticated: true, loading: false, login: vi.fn(), logout: vi.fn() };
  function Wrapper({ children }: PropsWithChildren): ReactElement {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    );
  }
  return render(<UsersPage />, { wrapper: Wrapper });
}

function fakeUser(id: string) {
  return { id, name: `User ${id}`, email: `${id}@example.com`, roles: ["user"], permissions: [] };
}

describe("UsersPage", () => {
  it("fetches the first page on mount, with the configured page size", async () => {
    vi.mocked(userApi.list).mockResolvedValue({ users: [], pagination: { limit: 20, offset: 0, total: 0 } });

    renderPage();

    await screen.findByText("No users found.");
    expect(userApi.list).toHaveBeenCalledWith({ limit: 20, offset: 0 });
  });

  it("shows an error message when the fetch fails", async () => {
    vi.mocked(userApi.list).mockRejectedValue(new Error("network down"));

    renderPage();

    expect(await screen.findByText("Failed to load users.")).toBeInTheDocument();
  });

  it("renders the fetched page of users and the real total from the server, not just this page's length", async () => {
    vi.mocked(userApi.list).mockResolvedValue({
      users: [fakeUser("u1")],
      pagination: { limit: 1, offset: 0, total: 45 },
    });

    renderPage();

    expect(await screen.findByText("u1@example.com")).toBeInTheDocument();
    expect(screen.getByText(/45 total/)).toBeInTheDocument();
  });

  it("requests the next page with the correct offset when Next is clicked — a real new fetch, not client-side re-slicing", async () => {
    const user = userEvent.setup();
    // total (25) must exceed the page's own real PAGE_SIZE (20, a
    // UsersPage constant, not something this mock controls) for a
    // second page — and therefore an enabled Next button — to exist.
    vi.mocked(userApi.list).mockResolvedValue({
      users: [fakeUser("u1")],
      pagination: { limit: 20, offset: 0, total: 25 },
    });

    renderPage();
    await screen.findByText("u1@example.com");

    vi.mocked(userApi.list).mockResolvedValue({
      users: [fakeUser("u2")],
      pagination: { limit: 20, offset: 20, total: 25 },
    });

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("u2@example.com")).toBeInTheDocument();
    expect(userApi.list).toHaveBeenLastCalledWith({ limit: 20, offset: 20 });
  });

  it("offers no role editing to a viewer without roles:manage", async () => {
    vi.mocked(userApi.list).mockResolvedValue({ users: [fakeUser("u1")], pagination: { limit: 20, offset: 0, total: 1 } });

    renderPage(manager);

    await screen.findByText("u1@example.com");
    expect(screen.queryByRole("button", { name: /Edit roles/ })).not.toBeInTheDocument();
  });

  it("lets a roles:manage holder change someone's roles, then refetches the list", async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.list).mockResolvedValue({ users: [fakeUser("u1")], pagination: { limit: 20, offset: 0, total: 1 } });
    vi.mocked(userApi.listRoles).mockResolvedValue({
      roles: [
        { name: "manager", description: "Can view user accounts", permissions: ["users:read"] },
        { name: "user", description: "Standard", permissions: [] },
      ],
    });
    vi.mocked(userApi.setRoles).mockResolvedValue({ user: { ...fakeUser("u1"), roles: ["user", "manager"] } });

    renderPage(admin);

    await user.click(await screen.findByRole("button", { name: "Edit roles for User u1" }));
    await user.click(await screen.findByRole("checkbox", { name: /^manager/i }));
    await user.click(screen.getByRole("button", { name: "Save roles" }));

    await vi.waitFor(() => { expect(userApi.setRoles).toHaveBeenCalledWith("u1", ["user", "manager"]); });
    // Dialog closes and the page re-fetches to show the new roles.
    await vi.waitFor(() => { expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); });
    expect(vi.mocked(userApi.list).mock.calls.length).toBeGreaterThan(1);
  });
});
