import type { ColumnDef } from "@tanstack/react-table";

import type { User } from "@/auth";

interface UsersTableColumnOptions {
  /** When set (the viewer holds roles:manage), adds an actions column that calls this. */
  onEditRoles?: (user: User) => void;
  /** The signed-in user — their own row gets no edit action (the API refuses self-edits). */
  currentUserId?: string;
}

export function buildUsersTableColumns({ onEditRoles, currentUserId }: UsersTableColumnOptions = {}): ColumnDef<User, unknown>[] {
  const columns: ColumnDef<User, unknown>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    {
      id: "roles",
      header: "Roles",
      accessorFn: (user) => user.roles.join(", "),
    },
  ];

  if (onEditRoles) {
    columns.push({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) =>
        row.original.id === currentUserId ? (
          <span className="text-xs text-gray-400">You</span>
        ) : (
          <button
            type="button"
            onClick={() => { onEditRoles(row.original); }}
            aria-label={`Edit roles for ${row.original.name}`}
            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit roles
          </button>
        ),
    });
  }

  return columns;
}
