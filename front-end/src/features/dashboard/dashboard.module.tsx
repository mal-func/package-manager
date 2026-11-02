import { lazy } from "react";
import { Home } from "lucide-react";

import type { FeatureModule } from "@/config/navigation/featureModule";
import { ROUTE_SEGMENTS, ROUTES } from "@/routes/routeConfig";

// Lazy, not a static import: this file is imported eagerly by both
// protectedRoutes.tsx and navigationConfig.ts (for the sidebar), so a
// static import here would pull the page — and everything it pulls in
// (Recharts, Leaflet, TanStack Table) — into the initial bundle
// regardless of which route the user actually visits first.
// This file's only real export is the config object below; DashboardPage
// itself is never exported, so there's no HMR boundary to protect.
// eslint-disable-next-line react-refresh/only-export-components
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

export const dashboardModule: FeatureModule = {
  segment: ROUTE_SEGMENTS.DASHBOARD,
  path: ROUTES.DASHBOARD,
  element: <DashboardPage />,
  label: "Dashboard",
  icon: Home,
};
