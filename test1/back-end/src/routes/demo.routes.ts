import { Router } from "express";

import { listChartDatasets, listStateMetrics, listTableDatasets } from "../controllers/demo.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";

/**
 * Read-only demo/showcase data for the template's map, chart, and table
 * gallery pages. Gated behind authentication only (no specific
 * permission) — matching Dashboard/Graphs/Charts/Tables, which are
 * open to any signed-in user.
 */
export const demoRouter = Router();

demoRouter.get("/map/states", requireAuth, listStateMetrics);
demoRouter.get("/charts", requireAuth, listChartDatasets);
demoRouter.get("/tables", requireAuth, listTableDatasets);
