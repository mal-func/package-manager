import { Suspense } from "react";
import type { RouteObject } from "react-router-dom";

import type { FeatureModule } from "@/config/navigation/featureModule";
import { chartsModule } from "@/features/charts";
import { dashboardModule } from "@/features/dashboard";
import { graphsModule } from "@/features/graphs";
import { settingsModule } from "@/features/settings";
import { tablesModule } from "@/features/tables";
import { usersModule } from "@/features/users";
import { RequireAuth, RequirePermission } from "@/auth";
// Deep import, not the usual `@/shared` barrel: this file is imported
// eagerly by the router (it can't itself be lazy), and @/shared's
// barrel re-exports Chart/Map alongside RouteFallback — pulling in
// Recharts/Leaflet statically here would defeat every lazy() below.
import { RouteFallback } from "@/shared/components/RouteFallback";
import { ProtectedLayout } from "../layouts";

/**
 * Every pluggable feature registers itself here. Deleting a feature
 * folder only requires removing its entry from this array — the route
 * tree and the sidebar (navigationConfig.ts) both derive from it.
 */
const featureModules: FeatureModule[] = [
  dashboardModule,
  graphsModule,
  chartsModule,
  tablesModule,
  usersModule,
  settingsModule,
];

function toRoute(module: FeatureModule): RouteObject {
  // Every feature's element is a React.lazy()-wrapped component (see
  // e.g. dashboard.module.tsx) — one Suspense boundary here covers
  // every route uniformly, so no feature module has to remember to
  // add its own.
  const route: RouteObject = {
    path: module.segment,
    element: <Suspense fallback={<RouteFallback />}>{module.element}</Suspense>,
  };

  if (!module.permission) {
    return route;
  }

  return {
    element: <RequirePermission permission={module.permission} />,
    children: [route],
  };
}

export const protectedRoutes: RouteObject[] = [
  {
    element: <RequireAuth />,
    children: [
      {
        element: <ProtectedLayout />,
        children: featureModules.map(toRoute),
      },
    ],
  },
];
