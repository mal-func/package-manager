import { useState } from "react";
import { Dialog } from "radix-ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api";
import type { User } from "@/auth";

import { userApi } from "../api/userApi";

interface EditRolesDialogProps {
  /** The user being edited; null closes the dialog. */
  user: User | null;
  onClose: () => void;
}

/**
 * Checkbox picker over every role GET /roles returns, saving via
 * PUT /users/:id/roles. The change applies to that user's very next
 * request (the backend reloads permissions per request).
 */
export function EditRolesDialog({ user, onClose }: EditRolesDialogProps) {
  return (
    <Dialog.Root open={user !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl">
          {/* Keyed by user, so reopening for someone else starts from their roles, not leftover state. */}
          {user && <EditRolesForm key={user.id} user={user} onClose={onClose} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EditRolesForm({ user, onClose }: { user: User; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>(user.roles);

  const rolesQuery = useQuery({
    queryKey: ["roles", "list"],
    queryFn: () => userApi.listRoles(),
  });

  const save = useMutation({
    mutationFn: () => userApi.setRoles(user.id, selected),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users", "list"] });
      onClose();
    },
  });

  function toggle(role: string) {
    setSelected((current) => (current.includes(role) ? current.filter((r) => r !== role) : [...current, role]));
  }

  const unchanged = selected.length === user.roles.length && selected.every((role) => user.roles.includes(role));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <Dialog.Title className="text-lg font-semibold text-gray-900">Edit roles</Dialog.Title>
      <Dialog.Description className="mt-1 text-sm text-gray-500">
        {user.name} ({user.email}). Changes apply on their next request.
      </Dialog.Description>

      <fieldset className="mt-5 space-y-3" disabled={save.isPending}>
        <legend className="sr-only">Roles</legend>
        {rolesQuery.isPending && <p className="text-sm text-gray-500">Loading roles…</p>}
        {rolesQuery.isError && <p className="text-sm text-red-600">Couldn&apos;t load the available roles.</p>}
        {rolesQuery.data?.roles.map((role) => (
          <label key={role.name} className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selected.includes(role.name)}
              onChange={() => { toggle(role.name); }}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-slate-900"
            />
            <span className="text-sm">
              <span className="block font-medium capitalize text-gray-900">{role.name}</span>
              {role.description && <span className="block text-gray-500">{role.description}</span>}
              <span className="mt-1 block text-xs text-gray-400">
                {role.permissions.length > 0 ? role.permissions.join(", ") : "No extra permissions"}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {selected.length === 0 && <p className="mt-3 text-sm text-amber-700">A user must keep at least one role.</p>}
      {save.isError && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {save.error instanceof ApiError ? save.error.message : "Couldn't save the roles. Please try again."}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <Dialog.Close asChild>
          <button type="button" className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Cancel
          </button>
        </Dialog.Close>
        <button
          type="submit"
          disabled={selected.length === 0 || unchanged || save.isPending}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : "Save roles"}
        </button>
      </div>
    </form>
  );
}
