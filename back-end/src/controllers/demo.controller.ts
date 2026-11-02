import type { Request, Response } from "express";

import { demoService } from "../services/demo.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function listStateMetrics(_req: Request, res: Response): Promise<void> {
  const states = await demoService.listStateMetrics();
  sendSuccess(res, { states });
}

export async function listChartDatasets(req: Request, res: Response): Promise<void> {
  const chartType = typeof req.query["type"] === "string" ? req.query["type"] : undefined;
  const datasets = await demoService.listChartDatasets(chartType);
  sendSuccess(res, { datasets });
}

export async function listTableDatasets(_req: Request, res: Response): Promise<void> {
  const datasets = await demoService.listTableDatasets();
  sendSuccess(res, { datasets });
}
