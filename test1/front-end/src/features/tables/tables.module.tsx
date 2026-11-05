import { lazy } from "react";
import { Table2 } from "lucide-react";

import type { FeatureModule } from "@/config/navigation/featureModule";
import { ROUTE_SEGMENTS, ROUTES } from "@/routes/routeConfig";

// Lazy — see dashboard.module.tsx for why.
// eslint-disable-next-line react-refresh/only-export-components
const TablesPage = lazy(() => import("./pages/TablesPage"));

export const tablesModule: FeatureModule = {
  segment: ROUTE_SEGMENTS.TABLES,
  path: ROUTES.TABLES,
  element: <TablesPage />,
  label: "Table",
  icon: Table2,
};
