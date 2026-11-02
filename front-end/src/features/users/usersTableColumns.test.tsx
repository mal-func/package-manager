import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";

import type { User } from "@/auth";

import { buildUsersTableColumns } from "./usersTableColumns";

function TestTable({ data, columns }: { data: User[]; columns: ColumnDef<User, unknown>[] }) {
  const table = useReactTable({ columns, data, getCoreRowModel: getCoreRowModel() });
  return (
    <table>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const jane: User = { id: "u1", name: "Jane", email: "jane@example.com", roles: ["admin", "manager"], permissions: [] };
const bob: User = { id: "u2", name: "Bob", email: "bob@example.com", roles: [], permissions: [] };

describe("buildUsersTableColumns", () => {
  it("joins multiple roles into a single comma-separated cell", () => {
    render(<TestTable data={[jane]} columns={buildUsersTableColumns()} />);

    expect(screen.getByText("admin, manager")).toBeInTheDocument();
  });

  it("renders a user with no roles without error", () => {
    render(<TestTable data={[bob]} columns={buildUsersTableColumns()} />);

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  it("has no actions column unless an edit handler is given (viewer lacks roles:manage)", () => {
    render(<TestTable data={[jane]} columns={buildUsersTableColumns()} />);

    expect(screen.queryByRole("button", { name: /Edit roles/ })).not.toBeInTheDocument();
  });

  it("adds an Edit roles button per row that hands that row's user to the handler", async () => {
    const onEditRoles = vi.fn();
    render(<TestTable data={[jane, bob]} columns={buildUsersTableColumns({ onEditRoles, currentUserId: "someone-else" })} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Edit roles for Bob" }));

    expect(onEditRoles).toHaveBeenCalledWith(bob);
  });

  it("shows 'You' instead of a button on the viewer's own row (the API refuses self-edits)", () => {
    render(<TestTable data={[jane, bob]} columns={buildUsersTableColumns({ onEditRoles: vi.fn(), currentUserId: "u1" })} />);

    expect(screen.queryByRole("button", { name: "Edit roles for Jane" })).not.toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit roles for Bob" })).toBeInTheDocument();
  });
});
