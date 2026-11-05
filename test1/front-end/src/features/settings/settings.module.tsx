import { lazy } from "react";
import { Settings as SettingsIcon } from "lucide-react";

import type { FeatureModule } from "@/config/navigation/featureModule";
import { ROUTE_SEGMENTS, ROUTES } from "@/routes/routeConfig";

// Lazy — see dashboard.module.tsx for why.
// eslint-disable-next-line react-refresh/only-export-components
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

export const settingsModule: FeatureModule = {
  segment: ROUTE_SEGMENTS.SETTINGS,
  path: ROUTES.SETTINGS,
  element: <SettingsPage />,
  label: "Settings",
  icon: SettingsIcon,
};
