import { lazy } from "react";
import { LineChart } from "lucide-react";

import type { FeatureModule } from "@/config/navigation/featureModule";
import { ROUTE_SEGMENTS, ROUTES } from "@/routes/routeConfig";

// Lazy — see dashboard.module.tsx for why.
// eslint-disable-next-line react-refresh/only-export-components
const GraphsPage = lazy(() => import("./pages/GraphsPage"));

export const graphsModule: FeatureModule = {
  segment: ROUTE_SEGMENTS.GRAPHS,
  path: ROUTES.GRAPHS,
  element: <GraphsPage />,
  label: "Graphs",
  icon: LineChart,
};
