/**
 * Suspense fallback shown while a route-level feature module's code is
 * still downloading (see protectedRoutes.tsx, which lazy-loads every
 * feature's page component). Generic and domain-agnostic — same rule
 * as the rest of shared/: no feature-specific knowledge here.
 */
export function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-500">
      Loading…
    </div>
  );
}
