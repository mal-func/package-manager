import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ApiError } from "@/api";
import type { User } from "@/auth";

vi.mock("../api/userApi", () => ({
  userApi: { listRoles: vi.fn(), setRoles: vi.fn() },
}));

const { userApi } = await import("../api/userApi");
const { EditRolesDialog } = await import("./EditRolesDialog");

const target: User = { id: "u2", name: "Bob", email: "bob@example.com", roles: ["user"], permissions: [] };

function renderDialog(user: User | null = target) {
  const onClose = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <EditRolesDialog user={user} onClose={onClose} />
    </QueryClientProvider>,
  );
  return { onClose };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(userApi.listRoles).mockResolvedValue({
    roles: [
      { name: "admin", description: "Full administrative access", permissions: ["roles:manage", "users:read"] },
      { name: "user", description: null, permissions: [] },
    ],
  });
});

describe("EditRolesDialog", () => {
  it("renders nothing when no user is being edited", () => {
    renderDialog(null);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lists every role with its permissions, pre-checking the user's current roles", async () => {
    renderDialog();

    expect(await screen.findByRole("checkbox", { name: /^admin/i })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /^user/i })).toBeChecked();
    expect(screen.getByText("roles:manage, users:read")).toBeInTheDocument();
    expect(screen.getByText("No extra permissions")).toBeInTheDocument();
  });

  it("keeps Save disabled until something changes, and blocks removing every role", async () => {
    const user = userEvent.setup();
    renderDialog();

    const save = screen.getByRole("button", { name: "Save roles" });
    expect(save).toBeDisabled();

    await user.click(await screen.findByRole("checkbox", { name: /^user/i }));

    expect(save).toBeDisabled();
    expect(screen.getByText("A user must keep at least one role.")).toBeInTheDocument();
  });

  it("saves the selection and closes", async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.setRoles).mockResolvedValue({ user: { ...target, roles: ["user", "admin"] } });
    const { onClose } = renderDialog();

    await user.click(await screen.findByRole("checkbox", { name: /^admin/i }));
    await user.click(screen.getByRole("button", { name: "Save roles" }));

    await vi.waitFor(() => { expect(onClose).toHaveBeenCalled(); });
    expect(userApi.setRoles).toHaveBeenCalledWith("u2", ["user", "admin"]);
  });

  it("shows the server's refusal and stays open", async () => {
    const user = userEvent.setup();
    vi.mocked(userApi.setRoles).mockRejectedValue(new ApiError("Unknown role(s): admin.", "VALIDATION_ERROR", 400));
    const { onClose } = renderDialog();

    await user.click(await screen.findByRole("checkbox", { name: /^admin/i }));
    await user.click(screen.getByRole("button", { name: "Save roles" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Unknown role(s): admin.");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("says so when the roles can't be loaded", async () => {
    vi.mocked(userApi.listRoles).mockRejectedValue(new Error("network"));
    renderDialog();

    expect(await screen.findByText("Couldn't load the available roles.")).toBeInTheDocument();
  });

  it("closes on Cancel without saving", async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalled();
    expect(userApi.setRoles).not.toHaveBeenCalled();
  });
});
