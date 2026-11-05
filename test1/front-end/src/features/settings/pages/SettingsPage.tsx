import { useAuth } from "@/auth";

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function SettingsPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-gray-900">Settings</h1>
      <p className="mb-4 text-sm text-gray-500">Your account details, read from the current session.</p>

      <div className="flex max-w-2xl flex-col gap-5">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Account</h2>
          <dl className="mt-3 divide-y divide-gray-100 text-sm">
            <div className="flex items-center justify-between py-2">
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium text-gray-900">{user.name}</dd>
            </div>
            <div className="flex items-center justify-between py-2">
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between py-2">
              <dt className="text-gray-500">User ID</dt>
              <dd className="font-mono text-xs text-gray-500">{user.id}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Roles</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <span key={role} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {capitalize(role)}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Permissions</h2>
          {user.permissions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {user.permissions.map((permission) => (
                <span key={permission} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  {permission}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">No additional permissions granted.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default SettingsPage;
