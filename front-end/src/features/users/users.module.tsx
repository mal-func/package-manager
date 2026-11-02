import { lazy } from "react";
import { Users as UsersIcon } from "lucide-react";

import type { FeatureModule } from "@/config/navigation/featureModule";
import { ROUTE_SEGMENTS, ROUTES } from "@/routes/routeConfig";

// Lazy — see dashboard.module.tsx for why.
// eslint-disable-next-line react-refresh/only-export-components
const UsersPage = lazy(() => import("./pages/UsersPage"));

export const usersModule: FeatureModule = {
  segment: ROUTE_SEGMENTS.USERS,
  path: ROUTES.USERS,
  element: <UsersPage />,
  label: "Users",
  icon: UsersIcon,
  permission: "users:read",
};
