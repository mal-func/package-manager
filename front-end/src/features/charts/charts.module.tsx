import { lazy } from "react";
import { ChartPie } from "lucide-react";

import type { FeatureModule } from "@/config/navigation/featureModule";
import { ROUTE_SEGMENTS, ROUTES } from "@/routes/routeConfig";

// Lazy — see dashboard.module.tsx for why.
// eslint-disable-next-line react-refresh/only-export-components
const ChartsPage = lazy(() => import("./pages/ChartsPage"));

export const chartsModule: FeatureModule = {
  segment: ROUTE_SEGMENTS.CHARTS,
  path: ROUTES.CHARTS,
  element: <ChartsPage />,
  label: "Charts",
  icon: ChartPie,
};
